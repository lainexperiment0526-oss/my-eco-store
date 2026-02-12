-- Quick fix: Add only missing Pi Network tables
-- Safe to run multiple times - uses IF NOT EXISTS

-- First check what exists
DO $$ 
BEGIN
    RAISE NOTICE 'Checking existing tables...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pi_transactions') THEN
        RAISE NOTICE '✓ pi_transactions exists';
    ELSE
        RAISE NOTICE '✗ pi_transactions missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pi_ad_interactions') THEN
        RAISE NOTICE '✓ pi_ad_interactions exists';
    ELSE
        RAISE NOTICE '✗ pi_ad_interactions missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallet_tokens') THEN
        RAISE NOTICE '✓ wallet_tokens exists';
    ELSE
        RAISE NOTICE '✗ wallet_tokens missing';
    END IF;
END $$;

-- Add Pi mainnet columns to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pi_mainnet_wallet TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pi_access_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pi_access_token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_pi_auth TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'mainnet',
ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pi_payment_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pi_ads_enabled BOOLEAN DEFAULT true;

-- Create pi_transactions table
CREATE TABLE IF NOT EXISTS public.pi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    
    transaction_id TEXT UNIQUE NOT NULL,
    payment_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'subscription', 'donation', 'purchase', 'ad_reward')),
    amount DECIMAL(20, 7) NOT NULL,
    memo TEXT DEFAULT '',
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'cancelled')),
    
    blockchain_txid TEXT,
    from_address TEXT,
    to_address TEXT,
    
    metadata JSONB DEFAULT '{}',
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
    
    error_message TEXT,
    error_code TEXT
);

-- Create pi_ad_interactions table
CREATE TABLE IF NOT EXISTS public.pi_ad_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    
    ad_type TEXT NOT NULL CHECK (ad_type IN ('rewarded', 'interstitial')),
    ad_id TEXT,
    ad_result TEXT NOT NULL CHECK (ad_result IN ('AD_CLOSED', 'AD_REWARDED', 'AD_DISPLAY_ERROR', 'AD_NETWORK_ERROR', 'AD_NOT_AVAILABLE', 'ADS_NOT_SUPPORTED', 'USER_UNAUTHENTICATED')),
    
    reward_granted BOOLEAN DEFAULT false,
    reward_amount DECIMAL(10, 2),
    reward_type TEXT,
    
    session_id TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create wallet_tokens table
CREATE TABLE IF NOT EXISTS public.wallet_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT NOT NULL,
    
    asset_code TEXT NOT NULL,
    asset_issuer TEXT NOT NULL,
    balance DECIMAL(20, 7) DEFAULT 0,
    
    token_name TEXT,
    home_domain TEXT,
    has_trustline BOOLEAN DEFAULT false,
    
    detected_via TEXT CHECK (detected_via IN ('pi_api', 'horizon', 'asset_discovery')),
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
    
    UNIQUE(profile_id, wallet_address, asset_code, asset_issuer)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_transactions_profile_id ON public.pi_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_transaction_id ON public.pi_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_status ON public.pi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_created_at ON public.pi_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_profile_id ON public.pi_ad_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_ad_type ON public.pi_ad_interactions(ad_type);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_created_at ON public.pi_ad_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_tokens_profile_id ON public.wallet_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet_address ON public.wallet_tokens(wallet_address);

-- Enable RLS
ALTER TABLE public.pi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_ad_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "System can update transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "Users can view their own ad interactions" ON public.pi_ad_interactions;
DROP POLICY IF EXISTS "Users can insert ad interactions" ON public.pi_ad_interactions;
DROP POLICY IF EXISTS "Users can view their own wallet tokens" ON public.wallet_tokens;
DROP POLICY IF EXISTS "Users can manage their wallet tokens" ON public.wallet_tokens;

-- Create policies
CREATE POLICY "Users can view their own transactions"
    ON public.pi_transactions FOR SELECT
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert transactions"
    ON public.pi_transactions FOR INSERT
    TO authenticated
    WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can update transactions"
    ON public.pi_transactions FOR UPDATE
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own ad interactions"
    ON public.pi_ad_interactions FOR SELECT
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert ad interactions"
    ON public.pi_ad_interactions FOR INSERT
    TO authenticated
    WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own wallet tokens"
    ON public.wallet_tokens FOR SELECT
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their wallet tokens"
    ON public.wallet_tokens FOR ALL
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create functions
CREATE OR REPLACE FUNCTION record_pi_transaction(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_transaction_id TEXT,
    p_payment_id TEXT,
    p_transaction_type TEXT,
    p_amount DECIMAL,
    p_memo TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO public.pi_transactions (
        profile_id, pi_user_id, transaction_id, payment_id,
        transaction_type, amount, memo, metadata, network
    ) VALUES (
        p_profile_id, p_pi_user_id, p_transaction_id, p_payment_id,
        p_transaction_type, p_amount, p_memo, p_metadata, 'mainnet'
    )
    RETURNING id INTO v_transaction_id;
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_pi_transaction_status(
    p_transaction_id TEXT,
    p_status TEXT,
    p_blockchain_txid TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.pi_transactions
    SET 
        status = p_status,
        blockchain_txid = COALESCE(p_blockchain_txid, blockchain_txid),
        error_message = p_error_message,
        error_code = p_error_code,
        updated_at = timezone('utc'::text, now())
    WHERE transaction_id = p_transaction_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_pi_ad_interaction(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_ad_type TEXT,
    p_ad_id TEXT,
    p_ad_result TEXT,
    p_reward_granted BOOLEAN DEFAULT false,
    p_reward_amount DECIMAL DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_interaction_id UUID;
BEGIN
    INSERT INTO public.pi_ad_interactions (
        profile_id, pi_user_id, ad_type, ad_id, ad_result,
        reward_granted, reward_amount, metadata
    ) VALUES (
        p_profile_id, p_pi_user_id, p_ad_type, p_ad_id, p_ad_result,
        p_reward_granted, p_reward_amount, p_metadata
    )
    RETURNING id INTO v_interaction_id;
    RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_wallet_token(
    p_profile_id UUID,
    p_wallet_address TEXT,
    p_asset_code TEXT,
    p_asset_issuer TEXT,
    p_balance DECIMAL,
    p_token_name TEXT DEFAULT NULL,
    p_home_domain TEXT DEFAULT NULL,
    p_has_trustline BOOLEAN DEFAULT false,
    p_detected_via TEXT DEFAULT 'pi_api'
)
RETURNS UUID AS $$
DECLARE
    v_token_id UUID;
BEGIN
    INSERT INTO public.wallet_tokens (
        profile_id, wallet_address, asset_code, asset_issuer,
        balance, token_name, home_domain, has_trustline, detected_via, network
    ) VALUES (
        p_profile_id, p_wallet_address, p_asset_code, p_asset_issuer,
        p_balance, p_token_name, p_home_domain, p_has_trustline, p_detected_via, 'mainnet'
    )
    ON CONFLICT (profile_id, wallet_address, asset_code, asset_issuer)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        token_name = COALESCE(EXCLUDED.token_name, wallet_tokens.token_name),
        home_domain = COALESCE(EXCLUDED.home_domain, wallet_tokens.home_domain),
        has_trustline = EXCLUDED.has_trustline,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_token_id;
    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_pi_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_pi_transaction_status TO authenticated;
GRANT EXECUTE ON FUNCTION record_pi_ad_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_wallet_token TO authenticated;

-- Final verification
DO $$ 
BEGIN
    RAISE NOTICE '=== Final Status ===';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pi_transactions') THEN
        RAISE NOTICE '✓ pi_transactions ready';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pi_ad_interactions') THEN
        RAISE NOTICE '✓ pi_ad_interactions ready';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallet_tokens') THEN
        RAISE NOTICE '✓ wallet_tokens ready';
    END IF;
    RAISE NOTICE 'Pi Network tables deployment complete!';
END $$;
