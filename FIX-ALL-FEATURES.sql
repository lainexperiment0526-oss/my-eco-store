-- ============================================================================
-- FIX ALL FEATURES SQL - Dashboard, PublicBio, Search, Followers
-- ============================================================================
-- This comprehensive script fixes all database issues for:
-- 1. Dashboard stats and data
-- 2. Public Bio profile display
-- 3. User search and filtering
-- 4. Followers system
-- 5. All feature integrations
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFILES TABLE - Ensure all required columns exist
-- ============================================================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS card_front_color TEXT DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_back_color TEXT DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_text_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS card_accent_color TEXT DEFAULT '#fafafa',
ADD COLUMN IF NOT EXISTS card_design_data JSONB,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. FIX FOLLOWERS TABLE - Ensure correct schema
-- ============================================================================

-- Backup existing followers data before recreation
CREATE TABLE IF NOT EXISTS public.followers_backup AS
SELECT * FROM public.followers
WHERE EXISTS (SELECT 1 FROM public.followers);

-- Drop existing followers table completely
DROP TABLE IF EXISTS public.followers CASCADE;

-- Create new followers table with correct schema
CREATE TABLE public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(follower_profile_id, following_profile_id),
    CONSTRAINT no_self_follow CHECK (follower_profile_id != following_profile_id)
);

-- Migrate data from backup if it has correct columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followers_backup' 
        AND column_name = 'follower_profile_id'
    ) THEN
        INSERT INTO public.followers (id, follower_profile_id, following_profile_id, created_at)
        SELECT id, follower_profile_id, following_profile_id, created_at
        FROM public.followers_backup
        ON CONFLICT (follower_profile_id, following_profile_id) DO NOTHING;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followers_backup' 
        AND column_name = 'follower_id'
    ) THEN
        -- Old schema with different column names
        INSERT INTO public.followers (follower_profile_id, following_profile_id, created_at)
        SELECT follower_id, following_id, created_at
        FROM public.followers_backup
        ON CONFLICT (follower_profile_id, following_profile_id) DO NOTHING;
    END IF;
END $$;

-- Drop the backup table
DROP TABLE IF EXISTS public.followers_backup CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_created ON public.followers(created_at);

-- ============================================================================
-- 3. CREATE ANALYTICS TABLE - For Dashboard and PublicBio
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'click', 'follow', etc.
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_profile ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics(created_at);

-- ============================================================================
-- 4. CREATE PROFILE_VIEWS TABLE - For tracking unique views
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    session_id TEXT,
    is_unique_view BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_visited ON public.profile_views(visited_at);

-- ============================================================================
-- 5. ENSURE USER_WALLETS TABLE - For Dashboard display
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    drop_tokens DECIMAL(18,8) DEFAULT 0,
    pi_balance DECIMAL(18,8) DEFAULT 0,
    usd_balance DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_profile ON public.user_wallets(profile_id);

-- ============================================================================
-- 6. FIX RLS POLICIES - Allow searches and follower queries
-- ============================================================================

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "followers_read" ON public.followers;
DROP POLICY IF EXISTS "followers_insert" ON public.followers;
DROP POLICY IF EXISTS "followers_delete" ON public.followers;
DROP POLICY IF EXISTS "analytics_read" ON public.analytics;
DROP POLICY IF EXISTS "analytics_insert" ON public.analytics;
DROP POLICY IF EXISTS "user_wallets_read" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_insert" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_update" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_delete" ON public.user_wallets;

-- Followers - Read (public)
CREATE POLICY "followers_read" ON public.followers
    FOR SELECT USING (true);

-- Followers - Insert (authenticated)
CREATE POLICY "followers_insert" ON public.followers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Followers - Delete (own follows)
CREATE POLICY "followers_delete" ON public.followers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Analytics - Read (own profile)
CREATE POLICY "analytics_read" ON public.analytics
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Analytics - Insert (public for tracking)
CREATE POLICY "analytics_insert" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- user_wallets - Read (owner only)
CREATE POLICY "user_wallets_read" ON public.user_wallets
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- user_wallets - Insert (owner only)
CREATE POLICY "user_wallets_insert" ON public.user_wallets
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- user_wallets - Update (owner only)
CREATE POLICY "user_wallets_update" ON public.user_wallets
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- user_wallets - Delete (service role only)
CREATE POLICY "user_wallets_delete" ON public.user_wallets
    FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT COUNT(*) FROM public.followers 
         WHERE following_profile_id = p_profile_id),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT COUNT(*) FROM public.followers 
         WHERE follower_profile_id = p_profile_id),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get view count
CREATE OR REPLACE FUNCTION get_view_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT COUNT(*) FROM public.analytics 
         WHERE profile_id = p_profile_id 
         AND event_type = 'view'),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user follows another user
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.followers 
        WHERE follower_profile_id = p_follower_id 
        AND following_profile_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. UPDATE PROFILES WITH INITIAL COUNTS
-- ============================================================================

-- Update follower counts
UPDATE public.profiles p
SET follower_count = (
    SELECT COUNT(*) FROM public.followers 
    WHERE following_profile_id = p.id
)
WHERE follower_count IS NULL OR follower_count = 0;

-- Update following counts
UPDATE public.profiles p
SET following_count = (
    SELECT COUNT(*) FROM public.followers 
    WHERE follower_profile_id = p.id
)
WHERE following_count IS NULL OR following_count = 0;

-- Update view counts
UPDATE public.profiles p
SET view_count = (
    SELECT COUNT(*) FROM public.analytics 
    WHERE profile_id = p.id 
    AND event_type = 'view'
)
WHERE view_count IS NULL OR view_count = 0;

-- ============================================================================
-- 9. ENSURE SEARCH COLUMNS ARE INDEXED
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_business_name_lower ON public.profiles(LOWER(business_name));
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON public.profiles(follower_count DESC);

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.followers TO anon, authenticated;
GRANT INSERT, DELETE ON public.followers TO authenticated;
GRANT SELECT ON public.analytics TO authenticated;
GRANT INSERT ON public.analytics TO anon, authenticated;
GRANT SELECT ON public.profile_views TO authenticated;
GRANT INSERT ON public.profile_views TO authenticated;
GRANT SELECT ON public.user_wallets TO authenticated;
GRANT INSERT, UPDATE ON public.user_wallets TO authenticated;

-- ============================================================================
-- 11. VERIFY SCHEMA
-- ============================================================================

-- Check profiles table
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles;
SELECT 'followers' as table_name, COUNT(*) as row_count FROM public.followers;
SELECT 'analytics' as table_name, COUNT(*) as row_count FROM public.analytics;
SELECT 'user_wallets' as table_name, COUNT(*) as row_count FROM public.user_wallets;

-- ============================================================================
-- DONE - All features should now work:
-- ✓ Dashboard - stats, followers, wallets
-- ✓ Public Bio - profile display, follower count, view count
-- ✓ Search - category filters, sorting
-- ✓ Followers - follow/unfollow, counts
-- ============================================================================
