-- SIMPLE FIX - No fancy checks, just create what's missing
-- Copy ALL of this file and run in Supabase SQL Editor

-- Add Pi columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pi_mainnet_wallet TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pi_access_token TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pi_access_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_pi_auth TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'mainnet';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pi_payment_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pi_ads_enabled BOOLEAN DEFAULT true;

-- Create pi_transactions
CREATE TABLE IF NOT EXISTS public.pi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    payment_id TEXT,
    transaction_type TEXT NOT NULL,
    amount DECIMAL(20, 7) NOT NULL,
    memo TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    blockchain_txid TEXT,
    from_address TEXT,
    to_address TEXT,
    metadata JSONB DEFAULT '{}',
    network TEXT DEFAULT 'mainnet',
    error_message TEXT,
    error_code TEXT
);

-- Create pi_ad_interactions
CREATE TABLE IF NOT EXISTS public.pi_ad_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    ad_type TEXT NOT NULL,
    ad_id TEXT,
    ad_result TEXT NOT NULL,
    reward_granted BOOLEAN DEFAULT false,
    reward_amount DECIMAL(10, 2),
    reward_type TEXT,
    session_id TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create wallet_tokens
CREATE TABLE IF NOT EXISTS public.wallet_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT NOT NULL,
    asset_code TEXT NOT NULL,
    asset_issuer TEXT NOT NULL,
    balance DECIMAL(20, 7) DEFAULT 0,
    token_name TEXT,
    home_domain TEXT,
    has_trustline BOOLEAN DEFAULT false,
    detected_via TEXT,
    network TEXT DEFAULT 'mainnet',
    UNIQUE(profile_id, wallet_address, asset_code, asset_issuer)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_transactions_profile_id ON public.pi_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_profile_id ON public.pi_ad_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_profile_id ON public.wallet_tokens(profile_id);

-- Enable RLS
ALTER TABLE public.pi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_ad_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_tokens ENABLE ROW LEVEL SECURITY;

-- Add payload column to notifications if missing
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
