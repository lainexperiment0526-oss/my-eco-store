-- Complete Droplink Database Schema
-- This creates all required tables for the Droplink application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (main user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- User identification
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For email/Gmail users
    username TEXT UNIQUE NOT NULL,
    pi_user_id TEXT, -- For Pi Network users
    display_name TEXT DEFAULT NULL,
    
    -- Profile information
    business_name TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    
    -- Social links (stored as JSONB)
    social_links JSONB DEFAULT '{}',
    
    -- Theme settings (stored as JSONB)
    theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "backgroundColor": "#000000", "iconStyle": "rounded", "buttonStyle": "filled", "customLinks": []}',
    
    -- Premium features
    has_premium BOOLEAN DEFAULT false,
    show_share_button BOOLEAN DEFAULT true,
    
    -- Pi Network integration
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    
    -- Financial data (encrypted)
    crypto_wallets JSONB DEFAULT '{"wallets": []}',
    bank_details JSONB DEFAULT '{"accounts": []}',
    
    -- YouTube video
    youtube_video_url TEXT DEFAULT ''
);

-- Create products table (digital products for sale)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT NOT NULL DEFAULT '0',
    file_url TEXT DEFAULT '',
    
    -- Product settings
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0
);

-- Create followers table (user follow relationships)
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    follower_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Prevent duplicate follows
    UNIQUE(follower_profile_id, following_profile_id),
    -- Prevent self-follows
    CHECK (follower_profile_id != following_profile_id)
);

-- Create analytics table (page views and interactions)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'view', 'click', 'social_click', 'product_click', 'ai_chat'
    event_data JSONB DEFAULT '{}',
    
    -- Browser/session info
    user_agent TEXT DEFAULT '',
    ip_address INET,
    session_id TEXT DEFAULT ''
);

-- Create subscriptions table (premium plans)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
    
    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Payment info
    payment_method TEXT DEFAULT 'pi_network',
    amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD'
);

-- Create gifts table (Pi Network gifts between users)
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    gift_type TEXT NOT NULL DEFAULT 'pi_coins',
    amount DECIMAL(10,8) NOT NULL DEFAULT 0.00000001,
    message TEXT DEFAULT '',
    
    -- Pi Network transaction info
    pi_payment_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Create link_icons table (custom icons for links)
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    name TEXT UNIQUE NOT NULL,
    icon_data TEXT NOT NULL, -- SVG or icon identifier
    category TEXT DEFAULT 'custom'
);

-- Create notifications table (user notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    is_read BOOLEAN DEFAULT false,
    action_url TEXT DEFAULT ''
);

-- Create custom_domains table (user custom domains)
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT DEFAULT '',
    
    -- DNS settings
    dns_records JSONB DEFAULT '{}',
    ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed'))
);

-- Create backup_exports table (user data exports)
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL DEFAULT 'full' CHECK (export_type IN ('full', 'analytics', 'content')),
    file_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Export metadata
    file_size BIGINT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days')
);

-- Create referral_codes table (referral system)
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    
    -- Rewards
    reward_type TEXT DEFAULT 'premium_days',
    reward_value INTEGER DEFAULT 30, -- days, pi_coins, etc.
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 year')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products(profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sender_id ON public.gifts(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_gifts_receiver_id ON public.gifts(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_profile_id ON public.custom_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_subscriptions ON public.subscriptions;
CREATE TRIGGER set_timestamp_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_custom_domains ON public.custom_domains;
CREATE TRIGGER set_timestamp_custom_domains
    BEFORE UPDATE ON public.custom_domains
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Insert default link icons
INSERT INTO public.link_icons (name, icon_data, category) VALUES
('shop', 'shopping-bag', 'ecommerce'),
('mail', 'mail', 'contact'),
('phone', 'phone', 'contact'),
('calendar', 'calendar', 'booking'),
('download', 'download', 'files'),
('external', 'external-link', 'general'),
('heart', 'heart', 'social'),
('star', 'star', 'featured'),
('zap', 'zap', 'energy'),
('link', 'link', 'general'),
('wallet', 'wallet', 'payment'),
('gift', 'gift', 'special')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies (for development - can be tightened later)

-- Profiles: Public read, authenticated users can manage their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (true);

-- Products: Public read, profile owners can manage
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profile owners can manage their products" ON public.products;
CREATE POLICY "Profile owners can manage their products" ON public.products
    FOR ALL USING (true);

-- Followers: Public read, authenticated users can manage their relationships
DROP POLICY IF EXISTS "Followers are viewable by everyone" ON public.followers;
CREATE POLICY "Followers are viewable by everyone" ON public.followers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their follow relationships" ON public.followers;
CREATE POLICY "Users can manage their follow relationships" ON public.followers
    FOR ALL USING (true);

-- Analytics: Profile owners can view their analytics
DROP POLICY IF EXISTS "Analytics are viewable by profile owners" ON public.analytics;
CREATE POLICY "Analytics are viewable by profile owners" ON public.analytics
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Analytics can be inserted by anyone" ON public.analytics;
CREATE POLICY "Analytics can be inserted by anyone" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- Other tables: Permissive policies for development
DROP POLICY IF EXISTS "Subscriptions are manageable" ON public.subscriptions;
CREATE POLICY "Subscriptions are manageable" ON public.subscriptions
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Gifts are manageable" ON public.gifts;
CREATE POLICY "Gifts are manageable" ON public.gifts
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Notifications are manageable" ON public.notifications;
CREATE POLICY "Notifications are manageable" ON public.notifications
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Custom domains are manageable" ON public.custom_domains;
CREATE POLICY "Custom domains are manageable" ON public.custom_domains
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Backup exports are manageable" ON public.backup_exports;
CREATE POLICY "Backup exports are manageable" ON public.backup_exports
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Referral codes are manageable" ON public.referral_codes;
CREATE POLICY "Referral codes are manageable" ON public.referral_codes
    FOR ALL USING (true);

-- Link icons: Public read access
DROP POLICY IF EXISTS "Link icons are viewable by everyone" ON public.link_icons;
CREATE POLICY "Link icons are viewable by everyone" ON public.link_icons
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;

GRANT SELECT ON public.followers TO anon;
GRANT ALL ON public.followers TO authenticated;

GRANT SELECT, INSERT ON public.analytics TO anon;
GRANT ALL ON public.analytics TO authenticated;

GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.gifts TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.custom_domains TO authenticated;
GRANT ALL ON public.backup_exports TO authenticated;
GRANT ALL ON public.referral_codes TO authenticated;

GRANT SELECT ON public.link_icons TO anon;
GRANT SELECT ON public.link_icons TO authenticated;

-- Create sample data for testing (optional)
-- Uncomment if you want some sample data

/*
INSERT INTO public.profiles (username, business_name, description, pi_user_id) VALUES
('testuser', 'Test Business', 'A sample business profile for testing Droplink features.', 'pi_test_123')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.products (profile_id, title, description, price) 
SELECT id, 'Sample Digital Product', 'This is a sample product for testing.', '$9.99'
FROM public.profiles WHERE username = 'testuser'
ON CONFLICT DO NOTHING;
*/

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';