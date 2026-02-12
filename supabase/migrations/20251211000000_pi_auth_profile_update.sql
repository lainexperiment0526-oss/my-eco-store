-- =====================================================
-- Pi Authentication Profile Update
-- Date: December 11, 2025
-- Purpose: Ensure profiles table properly handles Pi auth users
-- =====================================================

-- Ensure pi_user_id and pi_username columns exist and are properly indexed
DO $$
BEGIN
    -- Add pi_user_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_user_id TEXT;
        CREATE UNIQUE INDEX idx_profiles_pi_user_id_unique ON public.profiles(pi_user_id) 
        WHERE pi_user_id IS NOT NULL;
    END IF;
    
    -- Add pi_username if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_username') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_username TEXT;
        CREATE UNIQUE INDEX idx_profiles_pi_username_unique ON public.profiles(pi_username) 
        WHERE pi_username IS NOT NULL;
    END IF;
    
    -- Add pi_access_token if not exists (for secure token storage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_access_token') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token TEXT;
    END IF;
    
    -- Add pi_access_token_expiry if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_access_token_expiry') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token_expiry TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add last_pi_auth tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_pi_auth') THEN
        ALTER TABLE public.profiles ADD COLUMN last_pi_auth TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add display_name for better user experience
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
    END IF;
    
    -- Add environment tracking (mainnet/testnet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'environment') THEN
        ALTER TABLE public.profiles ADD COLUMN environment TEXT DEFAULT 'mainnet' 
        CHECK (environment IN ('mainnet', 'testnet'));
    END IF;
END $$;

-- Create indexes for efficient Pi user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id) 
WHERE pi_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_pi_username ON public.profiles(pi_username) 
WHERE pi_username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- Add helpful comments
COMMENT ON COLUMN public.profiles.pi_user_id IS 'Unique Pi Network user identifier (uid from Pi authentication)';
COMMENT ON COLUMN public.profiles.pi_username IS 'Pi Network username for user lookup';
COMMENT ON COLUMN public.profiles.pi_access_token IS 'Encrypted Pi Network access token for API calls';
COMMENT ON COLUMN public.profiles.last_pi_auth IS 'Last successful Pi authentication timestamp';
COMMENT ON COLUMN public.profiles.display_name IS 'User-friendly display name (can differ from username)';

-- =====================================================
-- Update RLS Policies for Pi Auth Users
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all profiles (needed for PublicBio page)
CREATE POLICY "Anyone can read profiles"
ON public.profiles FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own profile
-- This works for both Supabase auth and Pi auth users
CREATE POLICY "Authenticated users can insert profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    -- For Supabase auth users: user_id matches
    (auth.uid() = user_id)
    OR
    -- For Pi auth users: allow if user_id is NULL (Pi users don't have Supabase user_id)
    (user_id IS NULL AND pi_username IS NOT NULL)
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    -- For Supabase auth users
    (auth.uid() = user_id)
    OR
    -- For Pi auth users (match by pi_username or pi_user_id)
    (user_id IS NULL AND pi_username IS NOT NULL)
)
WITH CHECK (
    -- Same conditions for update
    (auth.uid() = user_id)
    OR
    (user_id IS NULL AND pi_username IS NOT NULL)
);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (
    (auth.uid() = user_id)
    OR
    (user_id IS NULL AND pi_username IS NOT NULL)
);

-- =====================================================
-- Create helper function for Pi user profile lookup
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_profile_by_pi_username(p_username TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    pi_user_id TEXT,
    pi_username TEXT,
    business_name TEXT,
    description TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.pi_user_id,
        p.pi_username,
        p.business_name,
        p.description,
        p.email,
        p.avatar_url,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.pi_username = p_username
       OR p.username = p_username
    LIMIT 1;
END;
$$;

-- =====================================================
-- Create helper function for Pi user upsert
-- =====================================================

CREATE OR REPLACE FUNCTION public.upsert_pi_user_profile(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_access_token TEXT DEFAULT NULL,
    p_token_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Try to find existing profile by pi_user_id or pi_username
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE pi_user_id = p_pi_user_id 
       OR pi_username = p_pi_username
    LIMIT 1;
    
    IF v_profile_id IS NOT NULL THEN
        -- Update existing profile
        UPDATE public.profiles
        SET 
            pi_user_id = p_pi_user_id,
            pi_username = p_pi_username,
            display_name = COALESCE(p_display_name, display_name, p_pi_username),
            pi_access_token = COALESCE(p_access_token, pi_access_token),
            pi_access_token_expiry = COALESCE(p_token_expiry, pi_access_token_expiry),
            last_pi_auth = NOW(),
            updated_at = NOW()
        WHERE id = v_profile_id;
    ELSE
        -- Create new profile
        INSERT INTO public.profiles (
            username,
            pi_user_id,
            pi_username,
            business_name,
            display_name,
            pi_access_token,
            pi_access_token_expiry,
            last_pi_auth,
            description,
            email
        ) VALUES (
            LOWER(p_pi_username),
            p_pi_user_id,
            p_pi_username,
            p_pi_username,
            COALESCE(p_display_name, p_pi_username),
            p_access_token,
            p_token_expiry,
            NOW(),
            '',
            ''
        )
        RETURNING id INTO v_profile_id;
    END IF;
    
    RETURN v_profile_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_profile_by_pi_username(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_pi_user_profile(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- =====================================================
-- Create indexes for followers table if it exists
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
        CREATE INDEX IF NOT EXISTS idx_followers_follower_profile_id 
        ON public.followers(follower_profile_id);
        
        CREATE INDEX IF NOT EXISTS idx_followers_following_profile_id 
        ON public.followers(following_profile_id);
        
        CREATE INDEX IF NOT EXISTS idx_followers_composite 
        ON public.followers(follower_profile_id, following_profile_id);
    END IF;
END $$;

-- =====================================================
-- Create indexes for analytics table if it exists
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics') THEN
        CREATE INDEX IF NOT EXISTS idx_analytics_profile_id 
        ON public.analytics(profile_id);
        
        CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
        ON public.analytics(event_type);
        
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
        ON public.analytics(created_at DESC);
    END IF;
END $$;

-- =====================================================
-- Verification
-- =====================================================

-- Verify columns exist
DO $$
DECLARE
    v_result TEXT;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY column_name)
    INTO v_result
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name IN ('pi_user_id', 'pi_username', 'pi_access_token', 'display_name', 'environment');
    
    RAISE NOTICE 'Pi auth columns in profiles table: %', v_result;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Pi authentication profile update completed successfully';
    RAISE NOTICE '📋 Profiles table updated with Pi Network authentication support';
    RAISE NOTICE '🔒 RLS policies updated for Pi users';
    RAISE NOTICE '🔧 Helper functions created for Pi user management';
END $$;
