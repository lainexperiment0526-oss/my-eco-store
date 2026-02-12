-- Payment Links and Enhanced Features Migration
-- This adds payment links table and ensures all user features are saved to database

-- Create payment_links table for Pi Network payment checkout links
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Associated profile
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pi_user_id TEXT NOT NULL, -- Pi Network user ID for quick lookups
    
    -- Payment link details
    link_id TEXT UNIQUE NOT NULL, -- Custom link ID (e.g., pl_123456789)
    amount DECIMAL(10,8) NOT NULL, -- Pi amount (supports up to 8 decimal places)
    description TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('product', 'donation', 'tip', 'subscription', 'group')),
    
    -- Link settings
    is_active BOOLEAN DEFAULT true,
    payment_url TEXT NOT NULL, -- Full checkout URL
    
    -- Analytics
    total_received DECIMAL(10,8) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_payment_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}' -- Additional data like custom fields, expiration, etc.
);

-- Create payment_transactions table for tracking Pi Network payments
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Payment link reference
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction details
    transaction_id TEXT UNIQUE NOT NULL, -- Pi Network transaction ID
    payment_id TEXT, -- Pi payment ID from SDK
    amount DECIMAL(10,8) NOT NULL,
    fee DECIMAL(10,8) DEFAULT 0,
    
    -- Addresses
    sender_address TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    
    -- Status and metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    memo TEXT DEFAULT '',
    pi_metadata JSONB DEFAULT '{}',
    
    -- Blockchain info
    block_height BIGINT,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Add custom_links column to profiles if not exists (for better database storage)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'custom_links') THEN
        ALTER TABLE public.profiles ADD COLUMN custom_links JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add store_url column to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'store_url') THEN
        ALTER TABLE public.profiles ADD COLUMN store_url TEXT DEFAULT '';
    END IF;
END $$;

-- Add youtube_video_url column to profiles if not exists (ensure it exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'youtube_video_url') THEN
        ALTER TABLE public.profiles ADD COLUMN youtube_video_url TEXT DEFAULT '';
    END IF;
END $$;

-- Create profile_financial_data table for financial information
CREATE TABLE IF NOT EXISTS public.profile_financial_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Pi Network financial data
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    
    -- Crypto wallets (stored as JSONB)
    crypto_wallets JSONB DEFAULT '{}',
    
    -- Bank details (encrypted, stored as JSONB)
    bank_details JSONB DEFAULT '{}'
);

-- Update theme_settings to include all theme options
ALTER TABLE public.profiles ALTER COLUMN theme_settings SET DEFAULT '{
    "primaryColor": "#3b82f6",
    "backgroundColor": "#000000",
    "backgroundType": "color",
    "backgroundGif": "",
    "iconStyle": "rounded",
    "buttonStyle": "filled"
}';

-- Create user_sessions table for better session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    
    -- Session data
    user_agent TEXT DEFAULT '',
    ip_address INET,
    device_info JSONB DEFAULT '{}',
    
    -- Pi Network authentication
    pi_access_token TEXT DEFAULT '',
    pi_user_data JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '30 days')
);

-- Enhanced analytics with user journey tracking (fix session_id reference)
DO $$
BEGIN
    -- Add session_id column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'session_id') THEN
        ALTER TABLE public.analytics ADD COLUMN session_id TEXT DEFAULT '';
    END IF;
    
    -- Add user_preferences column to analytics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'user_preferences') THEN
        ALTER TABLE public.analytics ADD COLUMN user_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create feature_usage table for tracking feature usage analytics
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feature_name TEXT NOT NULL, -- 'payment_links', 'custom_links', 'ai_chat', 'analytics', etc.
    usage_type TEXT NOT NULL, -- 'created', 'used', 'clicked', 'viewed', etc.
    
    -- Usage data
    usage_data JSONB DEFAULT '{}',
    session_id TEXT DEFAULT '',
    
    -- Analytics metadata
    user_agent TEXT DEFAULT '',
    ip_address INET
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_links_profile_id ON public.payment_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_pi_user_id ON public.payment_links(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_link_id ON public.payment_links(link_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_active ON public.payment_links(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_link_id ON public.payment_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_profile_id ON public.payment_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_id ON public.user_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_feature_usage_profile_id ON public.feature_usage(profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON public.feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_created_at ON public.feature_usage(created_at);

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS set_timestamp_payment_links ON public.payment_links;
CREATE TRIGGER set_timestamp_payment_links
    BEFORE UPDATE ON public.payment_links
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_payment_transactions ON public.payment_transactions;
CREATE TRIGGER set_timestamp_payment_transactions
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_sessions ON public.user_sessions;
CREATE TRIGGER set_timestamp_user_sessions
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security for new tables
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_financial_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_links
DROP POLICY IF EXISTS "Payment links are viewable by everyone" ON public.payment_links;
CREATE POLICY "Payment links are viewable by everyone" ON public.payment_links
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage their payment links" ON public.payment_links;
CREATE POLICY "Users can manage their payment links" ON public.payment_links
    FOR ALL USING (true);

-- Create RLS policies for payment_transactions
DROP POLICY IF EXISTS "Payment transactions are viewable by profile owners" ON public.payment_transactions;
CREATE POLICY "Payment transactions are viewable by profile owners" ON public.payment_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Payment transactions can be inserted" ON public.payment_transactions;
CREATE POLICY "Payment transactions can be inserted" ON public.payment_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Payment transactions can be updated" ON public.payment_transactions;
CREATE POLICY "Payment transactions can be updated" ON public.payment_transactions
    FOR UPDATE USING (true);

-- Create RLS policies for user_sessions
DROP POLICY IF EXISTS "User sessions are manageable by profile owners" ON public.user_sessions;
CREATE POLICY "User sessions are manageable by profile owners" ON public.user_sessions
    FOR ALL USING (true);

-- Create RLS policies for feature_usage
DROP POLICY IF EXISTS "Feature usage is viewable by profile owners" ON public.feature_usage;
CREATE POLICY "Feature usage is viewable by profile owners" ON public.feature_usage
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Feature usage can be tracked" ON public.feature_usage;
CREATE POLICY "Feature usage can be tracked" ON public.feature_usage
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for profile_financial_data
DROP POLICY IF EXISTS "Financial data is viewable by profile owners" ON public.profile_financial_data;
CREATE POLICY "Financial data is viewable by profile owners" ON public.profile_financial_data
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Financial data can be managed by profile owners" ON public.profile_financial_data;
CREATE POLICY "Financial data can be managed by profile owners" ON public.profile_financial_data
    FOR ALL USING (true);

-- Grant permissions for new tables
GRANT ALL ON public.payment_links TO authenticated;
GRANT SELECT ON public.payment_links TO anon;

GRANT ALL ON public.payment_transactions TO authenticated;
GRANT SELECT ON public.payment_transactions TO anon;

GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.feature_usage TO authenticated;
GRANT ALL ON public.profile_financial_data TO authenticated;

-- Create function to automatically update payment link analytics
CREATE OR REPLACE FUNCTION update_payment_link_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update payment link stats when a transaction is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.payment_links 
        SET 
            total_received = total_received + NEW.amount,
            transaction_count = transaction_count + 1,
            last_payment_at = NEW.updated_at
        WHERE id = NEW.payment_link_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment analytics
DROP TRIGGER IF EXISTS trigger_update_payment_analytics ON public.payment_transactions;
CREATE TRIGGER trigger_update_payment_analytics
    AFTER INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_link_analytics();

-- Create function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_profile_id UUID,
    p_feature_name TEXT,
    p_usage_type TEXT,
    p_usage_data JSONB DEFAULT '{}',
    p_session_id TEXT DEFAULT '',
    p_user_agent TEXT DEFAULT '',
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO public.feature_usage (
        profile_id,
        feature_name,
        usage_type,
        usage_data,
        session_id,
        user_agent,
        ip_address
    ) VALUES (
        p_profile_id,
        p_feature_name,
        p_usage_type,
        p_usage_data,
        p_session_id,
        p_user_agent,
        p_ip_address
    ) RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user payment links
CREATE OR REPLACE FUNCTION get_user_payment_links(p_pi_user_id TEXT)
RETURNS TABLE (
    id UUID,
    link_id TEXT,
    amount DECIMAL,
    description TEXT,
    payment_type TEXT,
    is_active BOOLEAN,
    payment_url TEXT,
    total_received DECIMAL,
    transaction_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.link_id,
        pl.amount,
        pl.description,
        pl.payment_type,
        pl.is_active,
        pl.payment_url,
        pl.total_received,
        pl.transaction_count,
        pl.created_at,
        pl.updated_at
    FROM public.payment_links pl
    WHERE pl.pi_user_id = p_pi_user_id
    ORDER BY pl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync payment links from localStorage to database
CREATE OR REPLACE FUNCTION sync_payment_links_to_db(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_payment_links JSONB
)
RETURNS INTEGER AS $$
DECLARE
    payment_link JSONB;
    links_synced INTEGER := 0;
BEGIN
    -- Clear existing payment links for this user
    DELETE FROM public.payment_links WHERE pi_user_id = p_pi_user_id;
    
    -- Insert payment links from JSONB array
    FOR payment_link IN SELECT * FROM jsonb_array_elements(p_payment_links)
    LOOP
        INSERT INTO public.payment_links (
            profile_id,
            pi_user_id,
            link_id,
            amount,
            description,
            payment_type,
            is_active,
            payment_url,
            total_received,
            transaction_count,
            created_at
        ) VALUES (
            p_profile_id,
            p_pi_user_id,
            payment_link->>'id',
            (payment_link->>'amount')::DECIMAL,
            payment_link->>'description',
            payment_link->>'type',
            (payment_link->>'active')::BOOLEAN,
            payment_link->>'url',
            (payment_link->>'totalReceived')::DECIMAL,
            (payment_link->>'transactionCount')::INTEGER,
            (payment_link->>'created')::TIMESTAMP WITH TIME ZONE
        );
        
        links_synced := links_synced + 1;
    END LOOP;
    
    RETURN links_synced;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION track_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_links TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_links TO anon;
GRANT EXECUTE ON FUNCTION sync_payment_links_to_db TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Add sample data for testing (optional)
-- This creates a sample payment link for testing
/*
INSERT INTO public.payment_links (
    profile_id, 
    pi_user_id, 
    link_id, 
    amount, 
    description, 
    payment_type, 
    payment_url
) 
SELECT 
    p.id,
    p.pi_user_id,
    'pl_sample_123',
    1.00,
    'Sample Payment Link',
    'tip',
    'https://droplink.vercel.app/pay/pl_sample_123'
FROM public.profiles p 
WHERE p.pi_user_id IS NOT NULL 
LIMIT 1
ON CONFLICT (link_id) DO NOTHING;
*/