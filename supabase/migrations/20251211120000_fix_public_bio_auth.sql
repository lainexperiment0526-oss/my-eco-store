-- Fix Public Bio Authentication and Database Issues
-- Created: December 11, 2025
-- Purpose: Ensure all tables exist with proper RLS policies for Pi authentication

-- 1. Ensure profiles table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Basic Info
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT '',
    business_name TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    
    -- Pi Network Integration
    pi_user_id TEXT UNIQUE,
    pi_username TEXT,
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    pi_access_token TEXT,
    display_name TEXT DEFAULT '',
    
    -- User Authentication (Supabase)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile Settings
    has_premium BOOLEAN DEFAULT false,
    youtube_video_url TEXT DEFAULT '',
    show_share_button BOOLEAN DEFAULT true,
    store_url TEXT,
    
    -- JSON Fields
    social_links JSONB DEFAULT '[]'::jsonb,
    theme_settings JSONB DEFAULT '{}'::jsonb,
    crypto_wallets JSONB DEFAULT '{}'::jsonb,
    bank_details JSONB DEFAULT '{}'::jsonb,
    background_music_url TEXT
);

-- 2. Ensure followers table exists
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    follower_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Prevent duplicate follows
    UNIQUE(follower_profile_id, following_profile_id),
    -- Prevent self-follows
    CHECK (follower_profile_id != following_profile_id)
);

-- 3. Ensure analytics table exists
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT DEFAULT '',
    ip_address INET,
    session_id TEXT DEFAULT ''
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_profile ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);

-- 5. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public insert access" ON public.profiles;
DROP POLICY IF EXISTS "Public update access" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public read access" ON public.followers;
DROP POLICY IF EXISTS "Users can follow others" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
DROP POLICY IF EXISTS "Enable all access for followers" ON public.followers;

DROP POLICY IF EXISTS "Public read access" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can track analytics" ON public.analytics;
DROP POLICY IF EXISTS "Enable all access for analytics" ON public.analytics;

-- 7. Create permissive RLS policies for profiles (allow both anon and authenticated)
CREATE POLICY "Enable all access for profiles"
    ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. Create permissive RLS policies for followers
CREATE POLICY "Enable all access for followers"
    ON public.followers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 9. Create permissive RLS policies for analytics
CREATE POLICY "Enable all access for analytics"
    ON public.analytics
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 10. Grant necessary permissions to anon and authenticated roles
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.followers TO anon, authenticated;
GRANT ALL ON public.analytics TO anon, authenticated;

-- 11. Grant usage on sequences (for UUID generation)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 12. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles for DropLink platform with Pi Network integration';
COMMENT ON TABLE public.followers IS 'Follow relationships between users';
COMMENT ON TABLE public.analytics IS 'Analytics and tracking events';
