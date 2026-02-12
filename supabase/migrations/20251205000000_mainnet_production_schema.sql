-- Mainnet Production Schema Update
-- Date: December 5, 2025
-- Purpose: Ensure all user data, Pi Network integrations, and settings are saved to Supabase

-- =======================
-- PROFILES TABLE UPDATES
-- =======================

-- Add mainnet-specific columns if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pi_mainnet_wallet TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pi_access_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pi_access_token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_pi_auth TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'mainnet' CHECK (environment IN ('mainnet', 'testnet')),
ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pi_payment_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pi_ads_enabled BOOLEAN DEFAULT true;

-- Add comment for mainnet wallet
COMMENT ON COLUMN public.profiles.pi_mainnet_wallet IS 'Pi Network mainnet wallet address (G... format)';
COMMENT ON COLUMN public.profiles.pi_access_token IS 'Encrypted Pi Network access token for API calls';
COMMENT ON COLUMN public.profiles.environment IS 'Network environment: mainnet (production) or testnet';

-- Update existing pi_wallet_address to ensure it's for mainnet
COMMENT ON COLUMN public.profiles.pi_wallet_address IS 'Primary Pi Network wallet address (mainnet)';

-- =======================
-- PI TRANSACTIONS TABLE
-- =======================

-- Create table for Pi Network transaction history
CREATE TABLE IF NOT EXISTS public.pi_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    
    -- Transaction details
    transaction_id TEXT UNIQUE NOT NULL,
    payment_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'subscription', 'donation', 'purchase', 'ad_reward')),
    amount DECIMAL(20, 7) NOT NULL,
    memo TEXT DEFAULT '',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'cancelled')),
    
    -- Blockchain data
    blockchain_txid TEXT,
    from_address TEXT,
    to_address TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
    
    -- Error tracking
    error_message TEXT,
    error_code TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pi_transactions_profile_id ON public.pi_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_transaction_id ON public.pi_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_payment_id ON public.pi_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_status ON public.pi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_created_at ON public.pi_transactions(created_at DESC);

-- =======================
-- PI AD INTERACTIONS TABLE
-- =======================

-- Create table for Pi Ad Network interactions
CREATE TABLE IF NOT EXISTS public.pi_ad_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    
    -- Ad details
    ad_type TEXT NOT NULL CHECK (ad_type IN ('rewarded', 'interstitial')),
    ad_id TEXT,
    ad_result TEXT NOT NULL CHECK (ad_result IN ('AD_CLOSED', 'AD_REWARDED', 'AD_DISPLAY_ERROR', 'AD_NETWORK_ERROR', 'AD_NOT_AVAILABLE', 'ADS_NOT_SUPPORTED', 'USER_UNAUTHENTICATED')),
    
    -- Reward tracking (for rewarded ads)
    reward_granted BOOLEAN DEFAULT false,
    reward_amount DECIMAL(10, 2),
    reward_type TEXT,
    
    -- Metadata
    session_id TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_profile_id ON public.pi_ad_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_ad_type ON public.pi_ad_interactions(ad_type);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_created_at ON public.pi_ad_interactions(created_at DESC);

-- =======================
-- USER SESSIONS TABLE UPDATE
-- =======================

-- Add missing columns to user_sessions table if it exists
DO $$ 
BEGIN
    -- Check if user_sessions table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions'
    ) THEN
        -- Add session_id column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'session_id'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN session_id TEXT;
        END IF;

        -- Add auth_method column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'auth_method'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN auth_method TEXT;
        END IF;

        -- Add pi_access_token column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'pi_access_token'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN pi_access_token TEXT;
        END IF;

        -- Add pi_user_id column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'pi_user_id'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN pi_user_id TEXT;
        END IF;

        -- Add pi_username column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'pi_username'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN pi_username TEXT;
        END IF;

        -- Add pi_wallet_address column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'pi_wallet_address'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN pi_wallet_address TEXT;
        END IF;

        -- Add environment column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'environment'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN environment TEXT DEFAULT 'mainnet';
        END IF;
    END IF;
END $$;

-- Add constraints if table exists
DO $$
BEGIN
    -- Check if user_sessions table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions'
    ) THEN
        -- Add check constraint for auth_method if not exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_sessions_auth_method_check'
        ) THEN
            ALTER TABLE public.user_sessions 
            ADD CONSTRAINT user_sessions_auth_method_check 
            CHECK (auth_method IN ('pi_network', 'email', 'google'));
        END IF;

        -- Add check constraint for environment if not exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_sessions_environment_check'
        ) THEN
            ALTER TABLE public.user_sessions 
            ADD CONSTRAINT user_sessions_environment_check 
            CHECK (environment IN ('mainnet', 'testnet'));
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Constraint already exists, ignore
END $$;

-- Create indexes for sessions only if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_id ON public.user_sessions(profile_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_pi_user_id ON public.user_sessions(pi_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active DESC);
    END IF;
END $$;

-- =======================
-- WALLET TOKENS TABLE
-- =======================

-- Track detected tokens in user wallets (mainnet)
CREATE TABLE IF NOT EXISTS public.wallet_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT NOT NULL,
    
    -- Token details
    asset_code TEXT NOT NULL,
    asset_issuer TEXT NOT NULL,
    balance DECIMAL(20, 7) DEFAULT 0,
    
    -- Token metadata
    token_name TEXT,
    home_domain TEXT,
    has_trustline BOOLEAN DEFAULT false,
    
    -- Detection method
    detected_via TEXT CHECK (detected_via IN ('pi_api', 'horizon', 'asset_discovery')),
    
    -- Network
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
    
    -- Constraints
    UNIQUE(profile_id, wallet_address, asset_code, asset_issuer)
);

-- Create indexes for wallet tokens
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_profile_id ON public.wallet_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet_address ON public.wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_asset_code ON public.wallet_tokens(asset_code);

-- =======================
-- ANALYTICS ENHANCEMENTS
-- =======================

-- Add Pi Network specific analytics columns (check if analytics table exists first)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics'
    ) THEN
        -- Add pi_user_id if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'analytics' 
            AND column_name = 'pi_user_id'
        ) THEN
            ALTER TABLE public.analytics ADD COLUMN pi_user_id TEXT;
        END IF;

        -- Add payment_id if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'analytics' 
            AND column_name = 'payment_id'
        ) THEN
            ALTER TABLE public.analytics ADD COLUMN payment_id TEXT;
        END IF;

        -- Add ad_interaction_id if not exists and pi_ad_interactions table exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'analytics' 
            AND column_name = 'ad_interaction_id'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'pi_ad_interactions'
        ) THEN
            ALTER TABLE public.analytics ADD COLUMN ad_interaction_id UUID REFERENCES public.pi_ad_interactions(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Create indexes for new analytics columns (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_analytics_pi_user_id ON public.analytics(pi_user_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_payment_id ON public.analytics(payment_id);
    END IF;
END $$;

-- =======================
-- RLS POLICIES
-- =======================

-- Enable Row Level Security
ALTER TABLE public.pi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_ad_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "System can update transactions" ON public.pi_transactions;
DROP POLICY IF EXISTS "Users can view their own ad interactions" ON public.pi_ad_interactions;
DROP POLICY IF EXISTS "Users can insert ad interactions" ON public.pi_ad_interactions;
DROP POLICY IF EXISTS "Users can view their own wallet tokens" ON public.wallet_tokens;
DROP POLICY IF EXISTS "Users can manage their wallet tokens" ON public.wallet_tokens;

-- Pi Transactions Policies
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

-- Pi Ad Interactions Policies
CREATE POLICY "Users can view their own ad interactions"
    ON public.pi_ad_interactions FOR SELECT
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert ad interactions"
    ON public.pi_ad_interactions FOR INSERT
    TO authenticated
    WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Wallet Tokens Policies
CREATE POLICY "Users can view their own wallet tokens"
    ON public.wallet_tokens FOR SELECT
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their wallet tokens"
    ON public.wallet_tokens FOR ALL
    TO authenticated
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- =======================
-- FUNCTIONS
-- =======================

-- Function to update profile's last Pi authentication
CREATE OR REPLACE FUNCTION update_last_pi_auth()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_pi_auth = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_pi_auth when pi_access_token changes
DROP TRIGGER IF EXISTS trigger_update_last_pi_auth ON public.profiles;
CREATE TRIGGER trigger_update_last_pi_auth
    BEFORE UPDATE OF pi_access_token ON public.profiles
    FOR EACH ROW
    WHEN (OLD.pi_access_token IS DISTINCT FROM NEW.pi_access_token)
    EXECUTE FUNCTION update_last_pi_auth();

-- Function to record Pi transaction
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
        profile_id,
        pi_user_id,
        transaction_id,
        payment_id,
        transaction_type,
        amount,
        memo,
        metadata,
        network
    ) VALUES (
        p_profile_id,
        p_pi_user_id,
        p_transaction_id,
        p_payment_id,
        p_transaction_type,
        p_amount,
        p_memo,
        p_metadata,
        'mainnet'
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update transaction status
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

-- Function to record ad interaction
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
        profile_id,
        pi_user_id,
        ad_type,
        ad_id,
        ad_result,
        reward_granted,
        reward_amount,
        metadata
    ) VALUES (
        p_profile_id,
        p_pi_user_id,
        p_ad_type,
        p_ad_id,
        p_ad_result,
        p_reward_granted,
        p_reward_amount,
        p_metadata
    )
    RETURNING id INTO v_interaction_id;
    
    RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update or insert wallet token
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
        profile_id,
        wallet_address,
        asset_code,
        asset_issuer,
        balance,
        token_name,
        home_domain,
        has_trustline,
        detected_via,
        network
    ) VALUES (
        p_profile_id,
        p_wallet_address,
        p_asset_code,
        p_asset_issuer,
        p_balance,
        p_token_name,
        p_home_domain,
        p_has_trustline,
        p_detected_via,
        'mainnet'
    )
    ON CONFLICT (profile_id, wallet_address, asset_code, asset_issuer)
    DO UPDATE SET
        balance = EXCLUDED.balance,
        token_name = COALESCE(EXCLUDED.token_name, wallet_tokens.token_name),
        home_domain = COALESCE(EXCLUDED.home_domain, wallet_tokens.home_domain),
        has_trustline = EXCLUDED.has_trustline,
        detected_via = EXCLUDED.detected_via,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_token_id;
    
    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- GRANT PERMISSIONS
-- =======================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION record_pi_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_pi_transaction_status TO authenticated;
GRANT EXECUTE ON FUNCTION record_pi_ad_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_wallet_token TO authenticated;

-- =======================
-- COMMENTS
-- =======================

COMMENT ON TABLE public.pi_transactions IS 'Pi Network payment and transaction history for mainnet';
COMMENT ON TABLE public.pi_ad_interactions IS 'Pi Ad Network interaction tracking and rewards';
COMMENT ON TABLE public.wallet_tokens IS 'Detected tokens in user Pi Network wallets (mainnet)';

COMMENT ON FUNCTION record_pi_transaction IS 'Record a new Pi Network transaction (payment, subscription, donation, etc.)';
COMMENT ON FUNCTION update_pi_transaction_status IS 'Update the status of a Pi Network transaction';
COMMENT ON FUNCTION record_pi_ad_interaction IS 'Record a Pi Ad Network interaction (rewarded or interstitial)';
COMMENT ON FUNCTION upsert_wallet_token IS 'Add or update a detected token in user wallet';

-- =======================
-- CLEANUP OLD TESTNET DATA
-- =======================

-- Mark old testnet data (optional - uncomment if needed)
-- UPDATE public.profiles SET environment = 'testnet' WHERE environment IS NULL;
-- UPDATE public.profiles SET environment = 'mainnet' WHERE pi_wallet_address LIKE 'G%';

-- =======================
-- VERIFICATION QUERIES
-- =======================

-- To verify all tables are created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'pi_transactions', 'pi_ad_interactions', 'wallet_tokens', 'user_sessions')
-- ORDER BY table_name;

-- To verify all functions exist:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name LIKE '%pi%'
-- ORDER BY routine_name;
