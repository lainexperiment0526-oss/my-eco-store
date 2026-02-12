-- Comprehensive Fix for Pi Authentication Sign-In Issues
-- Problem: RLS policies prevent profile creation during Pi Network authentication
-- Solution: Add service_role bypass and anonymous profile creation policies

-- ============================================
-- 1. Fix profiles table RLS for Pi Auth
-- ============================================

-- Drop problematic INSERT policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

-- Create new INSERT policy that allows:
-- 1. Service role (for internal operations/Pi auth)
-- 2. Authenticated users creating their own profile
-- 3. Anonymous users during Pi authentication flow
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'  -- Allow service role for internal operations
  OR (auth.role() = 'authenticated' AND auth.uid() = user_id)  -- Authenticated users own profile
  OR (auth.role() = 'anon' AND user_id IS NULL)  -- Allow Pi auth flow
);

-- ============================================
-- 2. Fix user_wallets table RLS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Enable full access to user_wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_read" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_insert" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_update" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_delete" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_select" ON public.user_wallets;

-- INSERT: Allow service role and users with matching profile
CREATE POLICY "user_wallets_insert" ON public.user_wallets
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'  -- Allow during Pi auth
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- UPDATE: Allow service role and users with matching profile
CREATE POLICY "user_wallets_update" ON public.user_wallets
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- SELECT: Allow service role and users with matching profile
CREATE POLICY "user_wallets_select" ON public.user_wallets
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- DELETE: Allow service role and users with matching profile
CREATE POLICY "user_wallets_delete" ON public.user_wallets
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Success notification
SELECT 'Pi Authentication RLS Fix Applied Successfully!' as message;
