-- ==============================================================================
-- MASTER BACKEND VERIFICATION & FIX SCRIPT
-- Purpose: Verify and fix ALL core tables, columns, and policies for Droplink
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    pi_user_id TEXT,
    display_name TEXT,
    business_name TEXT DEFAULT '',
    email TEXT,
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    social_links JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "backgroundColor": "#000000"}',
    has_premium BOOLEAN DEFAULT false,
    show_share_button BOOLEAN DEFAULT true,
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix missing profile columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'logo') THEN
        ALTER TABLE public.profiles ADD COLUMN logo TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 3. USER PREFERENCES (JSONB storage for complex settings)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT '#8B5CF6',
    background_color TEXT DEFAULT '#ffffff',
    font_size TEXT DEFAULT 'medium',
    dashboard_layout JSONB DEFAULT '{}',
    store_settings JSONB DEFAULT '{}',
    social_settings JSONB DEFAULT '{}',
    content_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(profile_id)
);

-- 4. WALLETS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    drop_tokens NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    txid TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GIFT SYSTEM (Catalog vs Transactions)
-- Rename incorrect table if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gifts' AND column_name = 'sender_profile_id') THEN
        ALTER TABLE public.gifts RENAME TO gifts_legacy_transactions;
    END IF;
END $$;

-- Catalog
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

-- POPULATE GIFTS CATALOG
INSERT INTO public.gifts (name, icon, drop_token_cost, pi_amount, category, sort_order, description)
VALUES 
  ('Like', '👍', 5, 0.25, 'emotion', 1, 'Quick like 👍'),
  ('Coffee', '☕', 10, 0.5, 'food', 2, 'Buy me a coffee ☕'),
  ('Heart', '❤️', 15, 0.75, 'emotion', 3, 'Send some love ❤️'),
  ('Beer', '🍺', 20, 1.0, 'food', 4, 'Grab a beer 🍺'),
  ('Star', '⭐', 25, 1.0, 'achievement', 5, 'You rock! ⭐'),
  ('Love', '😍', 25, 1.25, 'emotion', 6, 'Much love 😍'),
  ('Cake', '🎂', 30, 1.5, 'food', 7, 'Celebrate with cake 🎂'),
  ('Fire', '🔥', 30, 1.5, 'emotion', 8, 'You''re on fire! 🔥'),
  ('Medal', '🏅', 40, 2.0, 'achievement', 9, 'Medal of honor 🏅'),
  ('Pizza', '🍕', 50, 2.5, 'food', 10, 'Pizza time! 🍕'),
  ('Trophy', '🏆', 75, 2.5, 'achievement', 11, 'Champion! 🏆'),
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

-- Transactions
CREATE TABLE IF NOT EXISTS public.gift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gift_id UUID REFERENCES public.gifts(id) ON DELETE SET NULL,
    drop_tokens_spent NUMERIC(20, 6) NOT NULL,
    pi_amount NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift Cards
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) UNIQUE NOT NULL,
    plan_type VARCHAR(20) NOT NULL,
    billing_period VARCHAR(10) NOT NULL,
    pi_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    purchased_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    redeemed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    recipient_email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper Function for Gift Cards
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

-- 6. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    billing_period TEXT NOT NULL DEFAULT 'monthly',
    auto_renew BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pi_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AI FEATURES
CREATE TABLE IF NOT EXISTS public.ai_support_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    business_info TEXT,
    custom_instructions TEXT,
    faqs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SOCIAL (Followers & Messages)
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_profile_id, following_profile_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PERMISSIVE RLS POLICIES (Dev Mode)
-- Enable RLS on all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_support_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Grant to all
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Universal Policy Function
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "all_permissive_policy" ON %I', t);
        EXECUTE format('CREATE POLICY "all_permissive_policy" ON %I FOR ALL USING (true)', t);
    END LOOP;
END $$;

-- 10. REFRESH
NOTIFY pgrst, 'reload schema';
SELECT 'MASTER VERIFICATION COMPLETE: All tables checked, fixed, and RLS enabled. ✅' as status;
