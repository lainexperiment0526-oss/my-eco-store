-- ============================================================================
-- FIX PI AUTH PROFILE CREATION - Critical Database Triggers & Functions
-- ============================================================================
-- This script ensures that Pi authenticated users are properly created in
-- the profiles table and database setup is handled correctly
-- ============================================================================

-- ============================================================================
-- 1. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
-- ============================================================================

-- Function to create profile for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- For Pi-authenticated users, set username from custom_claims
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    'user_' || substring(NEW.id::text, 1, 8)
  );

  -- Create profile for new user
  INSERT INTO public.profiles (
    id,
    user_id,
    username,
    email,
    created_at,
    updated_at,
    category,
    follower_count,
    following_count,
    view_count,
    is_verified,
    subscription_status
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    v_username,
    NEW.email,
    NOW(),
    NOW(),
    'other',
    0,
    0,
    0,
    FALSE,
    'free'
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. CREATE FUNCTION FOR PI USER REGISTRATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_pi_user(
  p_pi_uid TEXT,
  p_username TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  created BOOLEAN
) AS $$
DECLARE
  v_profile_id UUID;
  v_user_id UUID;
  v_created BOOLEAN := FALSE;
BEGIN
  -- Check if profile already exists with this username
  SELECT id INTO v_profile_id FROM public.profiles 
  WHERE username = p_username;

  IF v_profile_id IS NOT NULL THEN
    RETURN QUERY SELECT v_profile_id, p_username, FALSE;
    RETURN;
  END IF;

  -- Check if auth user exists for this Pi UID
  SELECT id INTO v_user_id FROM auth.users 
  WHERE id::text = p_pi_uid;

  IF v_user_id IS NULL THEN
    -- Create a new auth user for Pi login
    -- Note: In production, this should be done via Supabase Auth API
    v_user_id := gen_random_uuid();
  END IF;

  -- Create new profile
  v_profile_id := gen_random_uuid();
  
  INSERT INTO public.profiles (
    id,
    user_id,
    username,
    email,
    created_at,
    updated_at,
    category,
    follower_count,
    following_count,
    view_count,
    is_verified,
    subscription_status
  ) VALUES (
    v_profile_id,
    v_user_id,
    p_username,
    p_email,
    NOW(),
    NOW(),
    'other',
    0,
    0,
    0,
    FALSE,
    'free'
  );

  v_created := TRUE;

  RETURN QUERY SELECT v_profile_id, p_username, v_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE FUNCTION FOR UPSERT PROFILE (Safe Pi Auth)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upsert_pi_profile(
  p_username TEXT,
  p_email TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_pi_wallet TEXT DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_profile_id UUID;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Try to find existing profile
  SELECT id INTO v_profile_id FROM public.profiles 
  WHERE username = p_username
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    -- Create new profile
    v_profile_id := gen_random_uuid();
    
    INSERT INTO public.profiles (
      id,
      username,
      email,
      business_name,
      pi_wallet_address,
      created_at,
      updated_at,
      category,
      follower_count,
      following_count,
      view_count,
      is_verified,
      subscription_status,
      bio
    ) VALUES (
      v_profile_id,
      p_username,
      p_email,
      p_display_name,
      p_pi_wallet,
      NOW(),
      NOW(),
      'other',
      0,
      0,
      0,
      FALSE,
      'free',
      'Welcome to DropLink!'
    );

    v_is_new := TRUE;
    
    -- Create wallet entry
    -- Insert wallet row with whatever columns exist (profile_id is required)
    INSERT INTO public.user_wallets (profile_id)
    VALUES (v_profile_id)
    ON CONFLICT (profile_id) DO NOTHING;
    
  ELSE
    -- Update existing profile if needed
    UPDATE public.profiles 
    SET 
      email = COALESCE(p_email, email),
      business_name = COALESCE(p_display_name, business_name),
      pi_wallet_address = COALESCE(p_pi_wallet, pi_wallet_address),
      updated_at = NOW()
    WHERE id = v_profile_id;
  END IF;

  RETURN QUERY SELECT v_profile_id, p_username, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FIX PROFILES TABLE CONSTRAINTS
-- ============================================================================

-- Ensure username is unique using index (safer than constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
ON public.profiles(username);

-- Ensure email is unique if present
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
ON public.profiles(email) 
WHERE email IS NOT NULL;

-- ============================================================================
-- 5. CREATE FUNCTION TO CHECK DATABASE SETUP STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_database_setup()
RETURNS TABLE (
  is_ready BOOLEAN,
  missing_tables TEXT[],
  missing_columns TEXT[]
) AS $$
DECLARE
  v_missing_tables TEXT[] := ARRAY[]::TEXT[];
  v_missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for required tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    v_missing_tables := array_append(v_missing_tables, 'profiles');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followers') THEN
    v_missing_tables := array_append(v_missing_tables, 'followers');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_wallets') THEN
    v_missing_tables := array_append(v_missing_tables, 'user_wallets');
  END IF;

  -- Check for required columns in profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    v_missing_columns := array_append(v_missing_columns, 'profiles.username');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'follower_count') THEN
    v_missing_columns := array_append(v_missing_columns, 'profiles.follower_count');
  END IF;

  RETURN QUERY SELECT 
    (array_length(v_missing_tables, 1) IS NULL AND array_length(v_missing_columns, 1) IS NULL),
    v_missing_tables,
    v_missing_columns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FIX RLS POLICIES FOR PROFILE CREATION
-- ============================================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Profiles - Read (public - everyone can see profiles)
CREATE POLICY "profiles_read" ON public.profiles
    FOR SELECT USING (true);

-- Profiles - Insert (system and authenticated users can create)
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR auth.role() = 'service_role'
    );

-- Profiles - Update (authenticated users can update own profile)
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR auth.role() = 'service_role'
    );

-- Profiles - Delete (only service role can delete)
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (
        auth.role() = 'service_role'
    );

-- ============================================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.register_pi_user TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.upsert_pi_profile TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.check_database_setup TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_wallets TO authenticated;

-- ============================================================================
-- 8. CREATE HELPER VIEW FOR PROFILE STATS
-- ============================================================================

CREATE OR REPLACE VIEW public.profile_stats AS
SELECT 
  p.id,
  p.username,
  p.email,
  p.follower_count,
  p.following_count,
  p.view_count,
  (SELECT COUNT(*) FROM public.followers WHERE following_profile_id = p.id) AS actual_followers,
  (SELECT COUNT(*) FROM public.followers WHERE follower_profile_id = p.id) AS actual_following,
  (SELECT COUNT(*) FROM public.analytics WHERE profile_id = p.id AND event_type = 'view') AS actual_views,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Grant access to the view
GRANT SELECT ON public.profile_stats TO authenticated, anon;

-- ============================================================================
-- 9. INITIAL DATA FIXES
-- ============================================================================

-- Fix any null usernames
UPDATE public.profiles 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Fix null counts
UPDATE public.profiles 
SET 
  follower_count = COALESCE(follower_count, 0),
  following_count = COALESCE(following_count, 0),
  view_count = COALESCE(view_count, 0),
  is_verified = COALESCE(is_verified, FALSE),
  subscription_status = COALESCE(subscription_status, 'free')
WHERE follower_count IS NULL 
   OR following_count IS NULL 
   OR view_count IS NULL;

-- Ensure all profiles have wallet entries
INSERT INTO public.user_wallets (profile_id)
SELECT p.id
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_wallets w WHERE w.profile_id = p.id)
ON CONFLICT (profile_id) DO NOTHING;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Check database setup status
SELECT * FROM public.check_database_setup();

-- Show profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Show sample profile stats
SELECT * FROM public.profile_stats LIMIT 5;

-- ============================================================================
-- DONE - Pi Auth Profile Creation Now Fixed:
-- ✓ Automatic profile creation on user signup
-- ✓ Pi user registration function
-- ✓ Safe upsert for profile data
-- ✓ Database setup status check
-- ✓ Proper RLS policies
-- ✓ Wallet creation on profile creation
-- ============================================================================
