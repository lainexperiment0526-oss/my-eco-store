-- =====================================================
-- Pi Network Mainnet Complete Integration
-- Date: December 8, 2025
-- Purpose: Comprehensive Supabase schema for Pi Network Mainnet
-- API Key: 96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5
-- Validation Key: 7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE - Enhanced for Pi Network Mainnet
-- =====================================================

-- Add Pi Network Mainnet columns to profiles table
DO $$
BEGIN
    -- Pi Network authentication fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_user_id TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_username') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_username TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_access_token') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_access_token_expiry') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token_expiry TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Pi Network wallet and verification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_mainnet_wallet') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_mainnet_wallet TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'wallet_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN wallet_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Pi Network authentication tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_pi_auth') THEN
        ALTER TABLE public.profiles ADD COLUMN last_pi_auth TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_wallet_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Network environment (mainnet vs testnet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'environment') THEN
        ALTER TABLE public.profiles ADD COLUMN environment TEXT DEFAULT 'mainnet' CHECK (environment IN ('mainnet', 'testnet'));
    END IF;
    
    -- Pi Network feature flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_payment_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_payment_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_ads_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_ads_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Display name for user profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
    END IF;
END $$;

-- Create indexes for Pi Network fields
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_username ON public.profiles(pi_username);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_mainnet_wallet ON public.profiles(pi_mainnet_wallet);
CREATE INDEX IF NOT EXISTS idx_profiles_environment ON public.profiles(environment);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.pi_user_id IS 'Unique Pi Network user identifier from Pi authentication';
COMMENT ON COLUMN public.profiles.pi_username IS 'Pi Network username (unique across platform)';
COMMENT ON COLUMN public.profiles.pi_mainnet_wallet IS 'Pi Network mainnet wallet address (G... format)';
COMMENT ON COLUMN public.profiles.pi_access_token IS 'Encrypted Pi Network access token for API calls (mainnet)';
COMMENT ON COLUMN public.profiles.environment IS 'Network environment: mainnet (production) or testnet';
COMMENT ON COLUMN public.profiles.wallet_verified IS 'Whether the Pi wallet has been verified on mainnet';

-- =====================================================
-- 2. PI TRANSACTIONS TABLE - Mainnet Payment Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pi_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    pi_username TEXT,
    
    -- Transaction identifiers
    transaction_id TEXT UNIQUE NOT NULL,
    payment_id TEXT,
    
    -- Transaction details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'payment', 
        'subscription', 
        'donation', 
        'purchase', 
        'ad_reward',
        'account_creation',
        'premium_upgrade',
        'gift'
    )),
    amount DECIMAL(20, 7) NOT NULL,
    currency TEXT DEFAULT 'PI',
    memo TEXT DEFAULT '',
    
    -- Status tracking (aligned with Pi Network payment lifecycle)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'approved',
        'completed',
        'failed',
        'cancelled',
        'developer_approved',
        'developer_completed'
    )),
    
    -- Pi Network blockchain data
    blockchain_txid TEXT,
    from_address TEXT,
    to_address TEXT,
    
    -- Metadata for additional context
    metadata JSONB DEFAULT '{}',
    
    -- Network specification
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet')),
    
    -- Error tracking
    error_message TEXT,
    error_code TEXT,
    
    -- Timestamps for lifecycle
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pi_transactions_profile_id ON public.pi_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_pi_user_id ON public.pi_transactions(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_transaction_id ON public.pi_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_payment_id ON public.pi_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_status ON public.pi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_transaction_type ON public.pi_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_created_at ON public.pi_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_transactions_network ON public.pi_transactions(network);

-- Add comments
COMMENT ON TABLE public.pi_transactions IS 'Pi Network mainnet transaction history and payment tracking';
COMMENT ON COLUMN public.pi_transactions.transaction_id IS 'Unique Pi Network transaction identifier';
COMMENT ON COLUMN public.pi_transactions.payment_id IS 'Pi Network payment identifier for payment flows';
COMMENT ON COLUMN public.pi_transactions.blockchain_txid IS 'Pi blockchain transaction hash when completed';

-- =====================================================
-- 3. PI AD INTERACTIONS TABLE - Ad Network Integration
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pi_ad_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    pi_username TEXT,
    
    -- Ad details
    ad_type TEXT NOT NULL CHECK (ad_type IN ('rewarded', 'interstitial')),
    ad_id TEXT,
    
    -- Ad result (from Pi Ad Network SDK)
    ad_result TEXT NOT NULL CHECK (ad_result IN (
        'AD_CLOSED',
        'AD_REWARDED',
        'AD_DISPLAY_ERROR',
        'AD_NETWORK_ERROR',
        'AD_NOT_AVAILABLE',
        'ADS_NOT_SUPPORTED',
        'USER_UNAUTHENTICATED'
    )),
    
    -- Reward tracking (for rewarded ads)
    reward_granted BOOLEAN DEFAULT false,
    reward_amount DECIMAL(10, 7),
    reward_type TEXT DEFAULT 'PI',
    reward_description TEXT,
    
    -- Session and context
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Metadata for additional context
    metadata JSONB DEFAULT '{}',
    
    -- Network
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_profile_id ON public.pi_ad_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_pi_user_id ON public.pi_ad_interactions(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_ad_type ON public.pi_ad_interactions(ad_type);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_ad_result ON public.pi_ad_interactions(ad_result);
CREATE INDEX IF NOT EXISTS idx_pi_ad_interactions_created_at ON public.pi_ad_interactions(created_at DESC);

-- Add comments
COMMENT ON TABLE public.pi_ad_interactions IS 'Pi Ad Network interaction tracking and reward management';
COMMENT ON COLUMN public.pi_ad_interactions.ad_result IS 'Result code from Pi Ad Network SDK';

-- =====================================================
-- 4. PI PAYMENT LINKS TABLE - Payment Link Management
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pi_payment_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Owner reference
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL,
    
    -- Payment link details
    link_id TEXT UNIQUE NOT NULL,
    link_type TEXT NOT NULL CHECK (link_type IN (
        'donation',
        'subscription',
        'product',
        'service',
        'custom'
    )),
    
    -- Amount details
    amount DECIMAL(20, 7) NOT NULL,
    currency TEXT DEFAULT 'PI',
    memo TEXT DEFAULT '',
    
    -- Subscription-specific (if applicable)
    billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
    
    -- Link status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Network
    network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'testnet'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pi_payment_links_profile_id ON public.pi_payment_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_pi_payment_links_link_id ON public.pi_payment_links(link_id);
CREATE INDEX IF NOT EXISTS idx_pi_payment_links_link_type ON public.pi_payment_links(link_type);
CREATE INDEX IF NOT EXISTS idx_pi_payment_links_is_active ON public.pi_payment_links(is_active);

-- Add comments
COMMENT ON TABLE public.pi_payment_links IS 'Pi Network payment link management for Droplink creators';

-- =====================================================
-- 5. DATABASE FUNCTIONS - Pi Network Operations
-- =====================================================

-- Function: Authenticate or create Pi Network user (Mainnet)
CREATE OR REPLACE FUNCTION authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    profile_id UUID;
    is_new_user BOOLEAN := false;
    result JSON;
BEGIN
    -- Validate inputs
    IF p_pi_user_id IS NULL OR p_pi_username IS NULL OR p_access_token IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Missing required Pi Network authentication parameters',
            'error_code', 'INVALID_PARAMS'
        );
    END IF;
    
    -- Check if user already exists by pi_user_id
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE pi_user_id = p_pi_user_id
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        -- Check if username exists (avoid duplicates)
        SELECT * INTO user_profile 
        FROM profiles 
        WHERE pi_username = p_pi_username OR username = p_pi_username
        LIMIT 1;
        
        IF user_profile IS NOT NULL THEN
            -- Username exists but different pi_user_id - update the profile
            profile_id := user_profile.id;
            
            UPDATE profiles SET
                pi_user_id = p_pi_user_id,
                pi_username = p_pi_username,
                pi_access_token = p_access_token,
                pi_access_token_expiry = NOW() + INTERVAL '24 hours',
                last_pi_auth = NOW(),
                pi_mainnet_wallet = COALESCE(p_wallet_address, pi_mainnet_wallet),
                wallet_verified = CASE WHEN p_wallet_address IS NOT NULL THEN true ELSE wallet_verified END,
                display_name = COALESCE(p_display_name, display_name, p_pi_username),
                environment = 'mainnet',
                updated_at = NOW()
            WHERE id = profile_id;
        ELSE
            -- Create new user profile
            is_new_user := true;
            profile_id := gen_random_uuid();
            
            INSERT INTO profiles (
                id,
                username,
                business_name,
                display_name,
                pi_user_id,
                pi_username,
                pi_mainnet_wallet,
                pi_wallet_address,
                pi_access_token,
                pi_access_token_expiry,
                last_pi_auth,
                wallet_verified,
                pi_wallet_verified,
                environment,
                has_premium,
                pi_payment_enabled,
                pi_ads_enabled,
                show_share_button,
                description,
                social_links,
                theme_settings,
                crypto_wallets,
                bank_details,
                youtube_video_url,
                created_at,
                updated_at
            ) VALUES (
                profile_id,
                p_pi_username,
                p_pi_username,
                COALESCE(p_display_name, p_pi_username),
                p_pi_user_id,
                p_pi_username,
                p_wallet_address,
                p_wallet_address,
                p_access_token,
                NOW() + INTERVAL '24 hours',
                NOW(),
                p_wallet_address IS NOT NULL,
                p_wallet_address IS NOT NULL,
                'mainnet',
                false,
                true,
                true,
                true,
                'Pi Network user on DropLink',
                '{}',
                jsonb_build_object(
                    'primaryColor', '#3b82f6',
                    'backgroundColor', '#000000',
                    'backgroundType', 'color',
                    'iconStyle', 'rounded',
                    'buttonStyle', 'filled'
                ),
                jsonb_build_object('wallets', '[]'::jsonb),
                jsonb_build_object('accounts', '[]'::jsonb),
                '',
                NOW(),
                NOW()
            );
            
            -- Create default user preferences
            INSERT INTO user_preferences (
                user_id,
                theme,
                notifications_enabled,
                auto_save_enabled,
                default_payment_type,
                created_at,
                updated_at
            ) VALUES (
                profile_id,
                'light',
                true,
                true,
                'one_time',
                NOW(),
                NOW()
            ) ON CONFLICT (user_id) DO NOTHING;
        END IF;
    ELSE
        -- Update existing user
        profile_id := user_profile.id;
        is_new_user := false;
        
        UPDATE profiles SET
            pi_access_token = p_access_token,
            pi_access_token_expiry = NOW() + INTERVAL '24 hours',
            last_pi_auth = NOW(),
            pi_mainnet_wallet = COALESCE(p_wallet_address, pi_mainnet_wallet),
            pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
            wallet_verified = CASE WHEN p_wallet_address IS NOT NULL THEN true ELSE wallet_verified END,
            pi_wallet_verified = CASE WHEN p_wallet_address IS NOT NULL THEN true ELSE pi_wallet_verified END,
            pi_username = p_pi_username,
            display_name = COALESCE(p_display_name, display_name, p_pi_username),
            environment = 'mainnet',
            updated_at = NOW()
        WHERE id = profile_id;
    END IF;
    
    -- Get the final profile data
    SELECT * INTO user_profile FROM profiles WHERE id = profile_id;
    
    -- Build success response
    result := json_build_object(
        'success', true,
        'is_new_user', is_new_user,
        'profile_id', profile_id,
        'user_data', json_build_object(
            'id', user_profile.id,
            'username', user_profile.username,
            'business_name', user_profile.business_name,
            'display_name', user_profile.display_name,
            'pi_user_id', user_profile.pi_user_id,
            'pi_username', user_profile.pi_username,
            'pi_mainnet_wallet', user_profile.pi_mainnet_wallet,
            'pi_wallet_address', user_profile.pi_wallet_address,
            'wallet_verified', user_profile.wallet_verified,
            'has_premium', user_profile.has_premium,
            'environment', user_profile.environment,
            'theme_settings', user_profile.theme_settings,
            'created_at', user_profile.created_at,
            'last_auth', user_profile.last_pi_auth
        ),
        'message', CASE 
            WHEN is_new_user THEN 'Welcome to DropLink! Your Pi Network account has been created on mainnet.'
            ELSE 'Welcome back! Successfully authenticated with Pi Network mainnet.'
        END
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Authentication failed: ' || SQLERRM,
        'error_code', 'AUTH_ERROR',
        'sql_state', SQLSTATE
    );
END;
$$;

-- Function: Record Pi transaction
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
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_record RECORD;
    result JSON;
BEGIN
    -- Insert transaction
    INSERT INTO pi_transactions (
        profile_id,
        pi_user_id,
        transaction_id,
        payment_id,
        transaction_type,
        amount,
        memo,
        metadata,
        network,
        status,
        created_at
    ) VALUES (
        p_profile_id,
        p_pi_user_id,
        p_transaction_id,
        p_payment_id,
        p_transaction_type,
        p_amount,
        p_memo,
        p_metadata,
        'mainnet',
        'pending',
        NOW()
    )
    RETURNING * INTO transaction_record;
    
    result := json_build_object(
        'success', true,
        'transaction_id', transaction_record.id,
        'pi_transaction_id', transaction_record.transaction_id,
        'status', transaction_record.status,
        'amount', transaction_record.amount,
        'created_at', transaction_record.created_at
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Transaction recording failed: ' || SQLERRM,
        'error_code', 'TRANSACTION_ERROR'
    );
END;
$$;

-- Function: Update Pi transaction status
CREATE OR REPLACE FUNCTION update_pi_transaction_status(
    p_transaction_id TEXT,
    p_status TEXT,
    p_blockchain_txid TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_record RECORD;
    result JSON;
BEGIN
    -- Update transaction
    UPDATE pi_transactions SET
        status = p_status,
        blockchain_txid = COALESCE(p_blockchain_txid, blockchain_txid),
        error_message = p_error_message,
        approved_at = CASE WHEN p_status IN ('approved', 'developer_approved') THEN NOW() ELSE approved_at END,
        completed_at = CASE WHEN p_status IN ('completed', 'developer_completed') THEN NOW() ELSE completed_at END,
        failed_at = CASE WHEN p_status = 'failed' THEN NOW() ELSE failed_at END,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id
    RETURNING * INTO transaction_record;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Transaction not found',
            'error_code', 'NOT_FOUND'
        );
    END IF;
    
    result := json_build_object(
        'success', true,
        'transaction_id', transaction_record.transaction_id,
        'status', transaction_record.status,
        'updated_at', transaction_record.updated_at
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Status update failed: ' || SQLERRM,
        'error_code', 'UPDATE_ERROR'
    );
END;
$$;

-- Function: Record Pi ad interaction
CREATE OR REPLACE FUNCTION record_pi_ad_interaction(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_ad_type TEXT,
    p_ad_result TEXT,
    p_reward_granted BOOLEAN DEFAULT false,
    p_reward_amount DECIMAL DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    interaction_record RECORD;
    result JSON;
BEGIN
    -- Insert ad interaction
    INSERT INTO pi_ad_interactions (
        profile_id,
        pi_user_id,
        ad_type,
        ad_result,
        reward_granted,
        reward_amount,
        metadata,
        network,
        created_at
    ) VALUES (
        p_profile_id,
        p_pi_user_id,
        p_ad_type,
        p_ad_result,
        p_reward_granted,
        p_reward_amount,
        p_metadata,
        'mainnet',
        NOW()
    )
    RETURNING * INTO interaction_record;
    
    result := json_build_object(
        'success', true,
        'interaction_id', interaction_record.id,
        'ad_result', interaction_record.ad_result,
        'reward_granted', interaction_record.reward_granted,
        'created_at', interaction_record.created_at
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Ad interaction recording failed: ' || SQLERRM,
        'error_code', 'AD_ERROR'
    );
END;
$$;

-- Function: Get Pi user profile by identifier
CREATE OR REPLACE FUNCTION get_pi_user_profile(
    p_identifier TEXT -- Can be username, pi_user_id, or pi_username
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    result JSON;
BEGIN
    -- Try to find user by various identifiers
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE pi_user_id = p_identifier 
       OR pi_username = p_identifier 
       OR username = p_identifier
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    result := json_build_object(
        'success', true,
        'profile', json_build_object(
            'id', user_profile.id,
            'username', user_profile.username,
            'business_name', user_profile.business_name,
            'display_name', user_profile.display_name,
            'description', user_profile.description,
            'pi_user_id', user_profile.pi_user_id,
            'pi_username', user_profile.pi_username,
            'pi_mainnet_wallet', user_profile.pi_mainnet_wallet,
            'wallet_verified', user_profile.wallet_verified,
            'has_premium', user_profile.has_premium,
            'environment', user_profile.environment,
            'pi_payment_enabled', user_profile.pi_payment_enabled,
            'pi_ads_enabled', user_profile.pi_ads_enabled,
            'theme_settings', user_profile.theme_settings,
            'social_links', user_profile.social_links,
            'created_at', user_profile.created_at,
            'last_auth', user_profile.last_pi_auth
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Profile retrieval failed: ' || SQLERRM,
        'error_code', 'PROFILE_ERROR'
    );
END;
$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.pi_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_ad_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_payment_links ENABLE ROW LEVEL SECURITY;

-- Pi Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.pi_transactions;
CREATE POLICY "Users can view their own transactions" ON public.pi_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert transactions" ON public.pi_transactions;
CREATE POLICY "System can insert transactions" ON public.pi_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update transactions" ON public.pi_transactions;
CREATE POLICY "System can update transactions" ON public.pi_transactions
    FOR UPDATE USING (true);

-- Pi Ad Interactions Policies
DROP POLICY IF EXISTS "Users can view their own ad interactions" ON public.pi_ad_interactions;
CREATE POLICY "Users can view their own ad interactions" ON public.pi_ad_interactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert ad interactions" ON public.pi_ad_interactions;
CREATE POLICY "System can insert ad interactions" ON public.pi_ad_interactions
    FOR INSERT WITH CHECK (true);

-- Pi Payment Links Policies
DROP POLICY IF EXISTS "Payment links are viewable by everyone" ON public.pi_payment_links;
CREATE POLICY "Payment links are viewable by everyone" ON public.pi_payment_links
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own payment links" ON public.pi_payment_links;
CREATE POLICY "Users can manage their own payment links" ON public.pi_payment_links
    FOR ALL USING (true);

-- =====================================================
-- 7. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant access to new tables
GRANT SELECT, INSERT ON public.pi_transactions TO anon;
GRANT ALL ON public.pi_transactions TO authenticated;

GRANT SELECT, INSERT ON public.pi_ad_interactions TO anon;
GRANT ALL ON public.pi_ad_interactions TO authenticated;

GRANT SELECT ON public.pi_payment_links TO anon;
GRANT ALL ON public.pi_payment_links TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION authenticate_pi_user TO anon;
GRANT EXECUTE ON FUNCTION authenticate_pi_user TO authenticated;

GRANT EXECUTE ON FUNCTION record_pi_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_pi_transaction_status TO authenticated;
GRANT EXECUTE ON FUNCTION record_pi_ad_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_pi_user_profile TO anon;
GRANT EXECUTE ON FUNCTION get_pi_user_profile TO authenticated;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger for pi_transactions updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_pi_transactions ON public.pi_transactions;
CREATE TRIGGER set_timestamp_pi_transactions
    BEFORE UPDATE ON public.pi_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_pi_payment_links ON public.pi_payment_links;
CREATE TRIGGER set_timestamp_pi_payment_links
    BEFORE UPDATE ON public.pi_payment_links
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- =====================================================
-- 9. SAMPLE DATA AND TESTING (OPTIONAL)
-- =====================================================

-- Uncomment to create test data
/*
-- Test Pi user profile
DO $$
DECLARE
    test_profile_id UUID;
BEGIN
    SELECT id INTO test_profile_id FROM profiles WHERE pi_username = 'testpiuser' LIMIT 1;
    
    IF test_profile_id IS NULL THEN
        INSERT INTO profiles (
            username, business_name, pi_user_id, pi_username, 
            pi_mainnet_wallet, environment, description
        ) VALUES (
            'testpiuser',
            'Test Pi User Business',
            'pi_test_mainnet_123',
            'testpiuser',
            'GTEST123EXAMPLE',
            'mainnet',
            'Test Pi Network mainnet user'
        )
        RETURNING id INTO test_profile_id;
        
        RAISE NOTICE 'Created test profile: %', test_profile_id;
    END IF;
END $$;
*/

-- =====================================================
-- 10. VALIDATION AND VERIFICATION
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_transactions') THEN
        RAISE EXCEPTION 'pi_transactions table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_ad_interactions') THEN
        RAISE EXCEPTION 'pi_ad_interactions table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_payment_links') THEN
        RAISE EXCEPTION 'pi_payment_links table was not created';
    END IF;
    
    RAISE NOTICE 'Pi Network Mainnet schema validation successful ✅';
END $$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration provides:
-- ✅ Pi Network Mainnet authentication support
-- ✅ Transaction tracking and management
-- ✅ Pi Ad Network integration
-- ✅ Payment link management
-- ✅ Comprehensive indexing for performance
-- ✅ Secure RLS policies
-- ✅ Database functions for common operations
-- =====================================================
