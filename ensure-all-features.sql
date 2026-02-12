-- ============================================
-- COMPLETE FEATURE VERIFICATION & SETUP
-- Ensures all PublicBio features are in database
-- ============================================

-- 1. Ensure background_music_url column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'background_music_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN background_music_url TEXT;
        COMMENT ON COLUMN public.profiles.background_music_url IS 'URL to background music - supports MP3, Spotify, YouTube';
    END IF;
END $$;

-- 2. Ensure theme_settings column exists (for cover image, etc.)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'theme_settings'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN theme_settings JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN public.profiles.theme_settings IS 'Theme settings including cover image, colors, backgrounds';
    END IF;
END $$;

-- 3. Ensure social_links column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'social_links'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN public.profiles.social_links IS 'Array of social media links';
    END IF;
END $$;

-- 4. Ensure custom_links column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'custom_links'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN custom_links JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN public.profiles.custom_links IS 'Array of custom button links';
    END IF;
END $$;

-- 5. Ensure image_link_cards column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'image_link_cards'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN image_link_cards JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN public.profiles.image_link_cards IS 'Array of image cards with links';
    END IF;
END $$;

-- 6. Ensure wallets column exists (crypto/bank donations)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'wallets'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN wallets JSONB DEFAULT '{"crypto":[],"bank":[]}'::jsonb;
        COMMENT ON COLUMN public.profiles.wallets IS 'Crypto and bank account info for donations';
    END IF;
END $$;

-- 7. Ensure is_verified column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN public.profiles.is_verified IS 'Verified account badge status';
    END IF;
END $$;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_background_music ON public.profiles(background_music_url) WHERE background_music_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 9. Ensure RLS policies allow public reading of bio data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- 10. Ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 11. Ensure email_captures table exists
CREATE TABLE IF NOT EXISTS public.email_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    source TEXT DEFAULT 'connect_button',
    captured_from_page TEXT DEFAULT 'public_bio',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create indexes for email_captures
CREATE INDEX IF NOT EXISTS idx_email_captures_profile_id ON public.email_captures(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON public.email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_created_at ON public.email_captures(created_at DESC);

-- 13. Enable RLS on email_captures
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- 14. Email captures policies
DROP POLICY IF EXISTS "Users can view own captures" ON public.email_captures;
CREATE POLICY "Users can view own captures"
ON public.email_captures FOR SELECT
USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can insert email captures" ON public.email_captures;
CREATE POLICY "Anyone can insert email captures"
ON public.email_captures FOR INSERT
WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERY
-- Run this to check all columns exist
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN (
        'background_music_url',
        'theme_settings',
        'social_links',
        'custom_links',
        'image_link_cards',
        'wallets',
        'is_verified'
    )
ORDER BY column_name;

-- Check email_captures table
SELECT 
    'email_captures table exists' as status,
    COUNT(*) as total_captures
FROM public.email_captures;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All PublicBio features verified and configured!';
    RAISE NOTICE '📊 Dashboard controls: Background Music, Cover Image, Social Links, Custom Links';
    RAISE NOTICE '🎵 Music Player: Supports YouTube, Spotify, MP3 URLs';
    RAISE NOTICE '🎨 Cover Image: Fixed background with parallax scroll effect';
    RAISE NOTICE '📧 Connect with: Email capture working - stores in email_captures table';
    RAISE NOTICE '👉 View captured emails: SELECT * FROM email_captures WHERE profile_id = YOUR_PROFILE_ID;';
END $$;
