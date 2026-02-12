-- ==============================================================================
-- VERIFY AND FIX GIFT BACKEND SYSTEM (COMPLETE)
-- ==============================================================================

-- 1. FIX TABLE CONFLICTS (gifts vs gift_transactions)
-- The 'gifts' table should be a CATALOG (name, icon, cost), not a transaction log.
-- If 'gifts' has 'sender_profile_id', it's incorrectly set up as a transaction table.
DO $$
DECLARE
    is_transaction_table BOOLEAN;
BEGIN
    -- Check if gifts table exists and has sender_profile_id
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'gifts' AND column_name = 'sender_profile_id'
    ) INTO is_transaction_table;
    
    IF is_transaction_table THEN
        RAISE NOTICE 'Detected "gifts" table is incorrectly structured as a transaction table. Renaming to "gifts_legacy_transactions"...';
        ALTER TABLE public.gifts RENAME TO gifts_legacy_transactions;
    END IF;
END $$;

-- 2. CREATE CORRECT GIFTS CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    drop_token_cost INTEGER NOT NULL DEFAULT 0,
    pi_amount DECIMAL(10, 2) DEFAULT 0,
    category TEXT DEFAULT 'general',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. POPULATE GIFTS CATALOG (from upgrade-gifts-system.sql)
INSERT INTO public.gifts (name, icon, drop_token_cost, pi_amount, category, sort_order, description)
VALUES 
  -- Quick Appreciation
  ('Like', '👍', 5, 0.25, 'emotion', 1, 'Quick like 👍'),
  ('Coffee', '☕', 10, 0.5, 'food', 2, 'Buy me a coffee ☕'),
  ('Heart', '❤️', 15, 0.75, 'emotion', 3, 'Send some love ❤️'),
  ('Beer', '🍺', 20, 1.0, 'food', 4, 'Grab a beer 🍺'),
  
  -- Medium Support
  ('Star', '⭐', 25, 1.0, 'achievement', 5, 'You rock! ⭐'),
  ('Love', '😍', 25, 1.25, 'emotion', 6, 'Much love 😍'),
  ('Cake', '🎂', 30, 1.5, 'food', 7, 'Celebrate with cake 🎂'),
  ('Fire', '🔥', 30, 1.5, 'emotion', 8, 'You''re on fire! 🔥'),
  ('Medal', '🏅', 40, 2.0, 'achievement', 9, 'Medal of honor 🏅'),
  ('Pizza', '🍕', 50, 2.5, 'food', 10, 'Pizza time! 🍕'),
  ('Trophy', '🏆', 75, 2.5, 'achievement', 11, 'Champion! 🏆'),
  ('Diamond', '💎', 100, 5.0, 'premium', 12, 'Premium support 💎'),
  
  -- Premium Gifts
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

-- Indexes for gifts
CREATE INDEX IF NOT EXISTS idx_gifts_category ON public.gifts(category);
CREATE INDEX IF NOT EXISTS idx_gifts_active ON public.gifts(is_active);
CREATE INDEX IF NOT EXISTS idx_gifts_sort ON public.gifts(sort_order);

-- 4. VERIFY GIFT CARDS TABLE (Subscription Codes)
-- The correct table must have a 'code' column.
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_cards') INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'code') INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Detected Incorrect gift_cards table (missing code column). Dropping and recreating...';
            DROP TABLE public.gift_cards CASCADE;
        ELSE
            RAISE NOTICE 'gift_cards table appears correct (has code column).';
        END IF;
    END IF;
END $$;

-- 5. RECREATE GIFT CARDS TABLE (If dropped or missing)
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'pro')),
  billing_period VARCHAR(10) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  pi_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  
  -- Purchaser info
  purchased_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Redeemer info
  redeemed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  message TEXT,
  recipient_email VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);

-- 6. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS VARCHAR(16) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(16) := 'DL';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := 'DL';
    FOR i IN 1..14 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. ENSURE WALLETS AND TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  drop_tokens numeric(20, 6) default 0 not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),
  UNIQUE(profile_id)
);

CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid references profiles(id) on delete set null,
  receiver_profile_id uuid references profiles(id) on delete set null,
  gift_id uuid references gifts(id) on delete set null,
  drop_tokens_spent numeric(20, 6) not null,
  pi_amount numeric(20, 6) default 0 not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Add missing columns to transactions if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gift_transactions' AND column_name = 'pi_amount') THEN
        ALTER TABLE public.gift_transactions ADD COLUMN pi_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- 8. APPLY RLS POLICIES (Development Mode - Permissive)
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.gift_cards TO authenticated, anon;
GRANT ALL ON public.gifts TO authenticated, anon;
GRANT ALL ON public.user_wallets TO authenticated, anon;
GRANT ALL ON public.gift_transactions TO authenticated, anon;

-- Permissive Policies
DROP POLICY IF EXISTS "gift_cards_all" ON public.gift_cards;
CREATE POLICY "gift_cards_all" ON public.gift_cards FOR ALL USING (true);

DROP POLICY IF EXISTS "gifts_all" ON public.gifts;
CREATE POLICY "gifts_all" ON public.gifts FOR ALL USING (true);

DROP POLICY IF EXISTS "user_wallets_all" ON public.user_wallets;
CREATE POLICY "user_wallets_all" ON public.user_wallets FOR ALL USING (true);

DROP POLICY IF EXISTS "gift_transactions_all" ON public.gift_transactions;
CREATE POLICY "gift_transactions_all" ON public.gift_transactions FOR ALL USING (true);

-- 9. REFRESH
NOTIFY pgrst, 'reload schema';
SELECT 'Gift Backend System Verified, Fixed, and Populated! ✅' as status;
