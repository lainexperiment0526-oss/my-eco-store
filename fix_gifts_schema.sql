-- Fix Gifts Schema Conflict
-- This script resolves the conflict where 'gifts' table was created as a transaction table
-- instead of a gift catalog table.

BEGIN;

-- 1. Check if 'gifts' is a transaction table (has sender_profile_id)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gifts' 
        AND column_name = 'sender_profile_id'
    ) THEN
        -- It's a transaction table. Rename it to preserve data, or drop if empty.
        -- We'll rename it to gift_transactions_legacy to be safe.
        ALTER TABLE IF EXISTS public.gifts RENAME TO gift_transactions_legacy;
    END IF;
END $$;

-- 2. Create the correct 'gifts' catalog table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Constraint added later to be safe
    icon TEXT NOT NULL,
    drop_token_cost INTEGER NOT NULL DEFAULT 0,
    pi_amount DECIMAL(10, 2) DEFAULT 0,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 Ensure columns exist (in case table already existed but was missing columns)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'pi_amount') THEN
        ALTER TABLE public.gifts ADD COLUMN pi_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'drop_token_cost') THEN
        ALTER TABLE public.gifts ADD COLUMN drop_token_cost INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'category') THEN
        ALTER TABLE public.gifts ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'sort_order') THEN
        ALTER TABLE public.gifts ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'description') THEN
        ALTER TABLE public.gifts ADD COLUMN description TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'is_active') THEN
        ALTER TABLE public.gifts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2.6 Ensure UNIQUE constraint on name (required for ON CONFLICT)
DO $$
BEGIN
    -- First, remove any duplicate names if they exist, keeping the one created most recently or just arbitrary
    -- This is necessary before adding a unique constraint
    DELETE FROM public.gifts a USING public.gifts b WHERE a.id > b.id AND a.name = b.name;
    
    -- Now add the constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'gifts_name_key'
    ) THEN
        ALTER TABLE public.gifts ADD CONSTRAINT gifts_name_key UNIQUE (name);
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
DROP POLICY IF EXISTS "Allow public read access to gifts" ON public.gifts;
CREATE POLICY "Allow public read access to gifts" ON public.gifts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin insert/update gifts" ON public.gifts;
CREATE POLICY "Allow admin insert/update gifts" ON public.gifts FOR ALL USING (auth.role() = 'service_role');

-- 5. Create gift_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gift_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL,
    drop_tokens_spent DECIMAL(20, 6) NOT NULL DEFAULT 0,
    pi_amount DECIMAL(20, 6) DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable RLS on transactions
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.gift_transactions;
CREATE POLICY "Users can view their own transactions" ON public.gift_transactions 
    FOR SELECT USING (auth.uid() = sender_profile_id OR auth.uid() = receiver_profile_id);

DROP POLICY IF EXISTS "Users can insert transactions" ON public.gift_transactions;
CREATE POLICY "Users can insert transactions" ON public.gift_transactions 
    FOR INSERT WITH CHECK (auth.uid() = sender_profile_id);

-- 8. Insert default gifts
INSERT INTO public.gifts (name, icon, drop_token_cost, pi_amount, category, sort_order, description)
VALUES 
  -- Quick Appreciation (5-20 tokens)
  ('Like', '👍', 5, 0.25, 'emotion', 1, 'Quick like 👍'),
  ('Coffee', '☕', 10, 0.5, 'food', 2, 'Buy me a coffee ☕'),
  ('Heart', '❤️', 15, 0.75, 'emotion', 3, 'Send some love ❤️'),
  ('Beer', '🍺', 20, 1.0, 'food', 4, 'Grab a beer 🍺'),
  ('Star', '⭐', 20, 1.0, 'achievement', 5, 'You rock! ⭐'),
  
  -- Medium Support (25-50 tokens)
  ('Love', '😍', 25, 1.25, 'emotion', 6, 'Much love 😍'),
  ('Cake', '🎂', 30, 1.5, 'food', 7, 'Celebrate with cake 🎂'),
  ('Fire', '🔥', 30, 1.5, 'emotion', 8, 'You''re on fire! 🔥'),
  ('Medal', '🏅', 40, 2.0, 'achievement', 9, 'Medal of honor 🏅'),
  ('Pizza', '🍕', 50, 2.5, 'food', 10, 'Pizza time! 🍕'),
  ('Trophy', '🏆', 50, 2.5, 'achievement', 11, 'Champion! 🏆'),
  
  -- Premium Gifts (100+ tokens)
  ('Diamond', '💎', 100, 5.0, 'premium', 12, 'Premium support 💎'),
  ('Crown', '👑', 100, 5.0, 'achievement', 13, 'Royal treatment 👑'),
  ('Gem', '💍', 150, 7.5, 'premium', 14, 'Precious gem 💍'),
  ('Gift Box', '🎁', 200, 10.0, 'premium', 15, 'Special gift 🎁'),
  ('Rocket', '🚀', 500, 25.0, 'premium', 16, 'To the moon! 🚀')
ON CONFLICT (name) DO UPDATE 
SET 
  icon = EXCLUDED.icon,
  drop_token_cost = EXCLUDED.drop_token_cost,
  pi_amount = EXCLUDED.pi_amount,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

COMMIT;
