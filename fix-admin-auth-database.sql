-- ============================================================================
-- FIX ADMIN AUTH - Database Configuration
-- ============================================================================
-- Run this in Supabase SQL Editor to fix admin authentication issues
-- ============================================================================

-- 1. Drop and recreate the handle_new_user function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_profile_id UUID;
BEGIN
  -- Generate username from email or metadata
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );

  -- Check if profile already exists
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = NEW.id;

  -- Only create if doesn't exist
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (
      id,
      user_id,
      username,
      email,
      display_name,
      created_at,
      updated_at,
      category,
      follower_count,
      following_count,
      view_count,
      is_verified,
      subscription_status,
      auth_method
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      v_username,
      NEW.email,
      v_username,
      NOW(),
      NOW(),
      'other',
      0,
      0,
      0,
      FALSE,
      'free',
      CASE 
        WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
        ELSE 'email'
      END
    );
    
    RAISE NOTICE 'Created profile for user: %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- 2. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure RLS allows profile creation by service role
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (both old and new names)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

-- Create comprehensive policies
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view public profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (username IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 5. Verification
SELECT 'Admin Auth Database Fix Applied Successfully!' as status;
