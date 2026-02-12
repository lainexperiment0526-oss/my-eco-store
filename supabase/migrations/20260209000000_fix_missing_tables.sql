-- Fix missing tables for SalesEarnings.tsx
-- This migration ensures subscription_transactions, withdrawals, and referral_codes tables exist

-- 1. Create subscription_transactions table
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_username TEXT, -- Pi username of the subscriber
    
    plan_type TEXT NOT NULL, -- 'basic', 'premium', 'pro'
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'Pi',
    
    status TEXT DEFAULT 'completed',
    payment_id TEXT, -- Pi Payment ID
    transaction_id TEXT -- Pi Transaction ID (TXID)
);

-- RLS for subscription_transactions
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscription transactions are viewable by profile owner" ON public.subscription_transactions;
CREATE POLICY "Subscription transactions are viewable by profile owner" ON public.subscription_transactions
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- 2. Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    admin_note TEXT,
    transaction_hash TEXT -- If paid out via blockchain
);

-- RLS for withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Withdrawals are viewable by profile owner" ON public.withdrawals;
CREATE POLICY "Withdrawals are viewable by profile owner" ON public.withdrawals
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

DROP POLICY IF EXISTS "Withdrawals can be created by profile owner" ON public.withdrawals;
CREATE POLICY "Withdrawals can be created by profile owner" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- 3. Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    
    uses_count INTEGER DEFAULT 0,
    reward_type TEXT DEFAULT 'pi_coins', -- 'pi_coins', 'percentage'
    reward_value DECIMAL(10, 2) DEFAULT 0
);

-- RLS for referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referral codes are viewable by profile owner" ON public.referral_codes;
CREATE POLICY "Referral codes are viewable by profile owner" ON public.referral_codes
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_profile_id ON public.subscription_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_profile_id ON public.withdrawals(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON public.referral_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
