-- Remove all access restrictions and complete database schema
-- This migration opens all features for all users regardless of subscription

-- First, let's add missing columns and update existing tables

-- Add Pi Network integration columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_user_id TEXT,
ADD COLUMN IF NOT EXISTS pi_username TEXT,
ADD COLUMN IF NOT EXISTS pi_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_verification JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"all": true}';

-- Create link_icons table for custom icons
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default link icons
INSERT INTO public.link_icons (name, icon_url, category, is_default) VALUES
('Twitter', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg', 'social', true),
('Instagram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg', 'social', true),
('Facebook', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg', 'social', true),
('LinkedIn', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg', 'social', true),
('YouTube', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg', 'social', true),
('TikTok', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg', 'social', true),
('Twitch', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg', 'social', true),
('Discord', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg', 'social', true),
('GitHub', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg', 'tech', true),
('Website', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlechrome.svg', 'general', true),
('Email', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg', 'contact', true),
('Phone', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/phone.svg', 'contact', true),
('WhatsApp', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg', 'contact', true),
('Telegram', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg', 'contact', true),
('Spotify', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg', 'music', true),
('Apple Music', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/applemusic.svg', 'music', true),
('SoundCloud', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/soundcloud.svg', 'music', true),
('Patreon', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/patreon.svg', 'monetization', true),
('PayPal', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paypal.svg', 'monetization', true),
('Venmo', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/venmo.svg', 'monetization', true),
('CashApp', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/cashapp.svg', 'monetization', true),
('OnlyFans', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/onlyfans.svg', 'monetization', true),
('Medium', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/medium.svg', 'content', true),
('Substack', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/substack.svg', 'content', true),
('Pinterest', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg', 'social', true),
('Snapchat', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg', 'social', true),
('Reddit', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg', 'social', true),
('Clubhouse', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/clubhouse.svg', 'social', true),
('Calendly', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/calendly.svg', 'productivity', true),
('Zoom', 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zoom.svg', 'productivity', true)
ON CONFLICT (name) DO NOTHING;

-- Update custom_links to include icon selection
ALTER TABLE public.profiles 
ALTER COLUMN custom_links TYPE JSONB USING custom_links::jsonb;

-- Create analytics_events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'click', 'view', 'share', etc.
    event_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT false,
    verification_code TEXT,
    ssl_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- Create backup_exports table
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL, -- 'full', 'analytics', 'content'
    file_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    reward_amount INTEGER DEFAULT 10, -- in tokens or credits
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_store_url ON public.profiles(store_url);
CREATE INDEX IF NOT EXISTS idx_analytics_profile_created ON public.analytics_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read ON public.notifications(profile_id, read);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);

-- Update RLS policies to be more permissive (remove restrictions)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for profile owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for profile owner" ON public.profiles;

-- Create permissive policies
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for profile owner or authenticated" ON public.profiles FOR UPDATE USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = pi_user_id OR
    auth.role() = 'authenticated'
);
CREATE POLICY "Enable delete for profile owner" ON public.profiles FOR DELETE USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = pi_user_id
);

-- Remove subscription restrictions from subscriptions table
DROP POLICY IF EXISTS "Enable read for subscription owner" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable update for subscription owner" ON public.subscriptions;

-- Create open subscription policies
CREATE POLICY "Enable full access to subscriptions" ON public.subscriptions FOR ALL USING (true);

-- Remove restrictions from analytics
DROP POLICY IF EXISTS "Enable read for analytics owner" ON public.analytics;
DROP POLICY IF EXISTS "Enable insert for all" ON public.analytics;

CREATE POLICY "Enable full access to analytics" ON public.analytics FOR ALL USING (true);

-- Remove restrictions from user_wallets
DROP POLICY IF EXISTS "Enable read for wallet owner" ON public.user_wallets;
DROP POLICY IF EXISTS "Enable update for wallet owner" ON public.user_wallets;

CREATE POLICY "Enable full access to user_wallets" ON public.user_wallets FOR ALL USING (true);

-- Add policies for new tables
ALTER TABLE public.link_icons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for link_icons" ON public.link_icons FOR SELECT USING (true);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to analytics_events" ON public.analytics_events FOR ALL USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for notification owner" ON public.notifications FOR SELECT USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);
CREATE POLICY "Enable insert for authenticated users" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for notification owner" ON public.notifications FOR UPDATE USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access to custom_domains" ON public.custom_domains FOR ALL USING (true);

ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for export owner" ON public.backup_exports FOR ALL USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all referral_codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Enable manage for referral owner" ON public.referral_codes FOR ALL USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()::text OR pi_user_id = auth.uid()::text
    )
);

-- Update the get_active_subscription function to always return premium access
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_profile_id uuid) 
RETURNS TABLE(plan_type text, billing_period text, end_date timestamp with time zone, status text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always return premium access for now
  RETURN QUERY
  SELECT 
    'premium'::text as plan_type,
    'lifetime'::text as billing_period,
    (now() + interval '100 years')::timestamptz as end_date,
    'active'::text as status;
END;
$$;

-- Create function to handle Pi user authentication
CREATE OR REPLACE FUNCTION public.handle_pi_auth(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_wallet_address TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Check if profile already exists
    SELECT id INTO profile_id
    FROM public.profiles
    WHERE pi_user_id = p_pi_user_id;
    
    IF profile_id IS NULL THEN
        -- Create new profile
        INSERT INTO public.profiles (
            pi_user_id,
            pi_username,
            pi_wallet_address,
            username,
            business_name,
            auth_provider,
            features_enabled
        ) VALUES (
            p_pi_user_id,
            p_pi_username,
            p_wallet_address,
            p_pi_username,
            p_pi_username || '''s Page',
            'pi_network',
            '{"all": true}'::jsonb
        ) RETURNING id INTO profile_id;
        
        -- Create default subscription (premium)
        INSERT INTO public.subscriptions (
            profile_id,
            plan_type,
            status,
            billing_period,
            amount,
            end_date
        ) VALUES (
            profile_id,
            'premium',
            'active',
            'lifetime',
            0,
            now() + interval '100 years'
        );
        
    ELSE
        -- Update existing profile
        UPDATE public.profiles
        SET 
            pi_username = p_pi_username,
            pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
            updated_at = now()
        WHERE id = profile_id;
    END IF;
    
    RETURN profile_id;
END;
$$;

-- Create function for email users to link Pi account
CREATE OR REPLACE FUNCTION public.link_pi_account(
    p_profile_id UUID,
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_wallet_address TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        pi_user_id = p_pi_user_id,
        pi_username = p_pi_username,
        pi_wallet_address = p_wallet_address,
        updated_at = now()
    WHERE id = p_profile_id;
    
    -- Upgrade to premium if not already
    INSERT INTO public.subscriptions (
        profile_id,
        plan_type,
        status,
        billing_period,
        amount,
        end_date
    ) VALUES (
        p_profile_id,
        'premium',
        'active',
        'lifetime',
        0,
        now() + interval '100 years'
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        plan_type = 'premium',
        status = 'active',
        end_date = now() + interval '100 years';
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;