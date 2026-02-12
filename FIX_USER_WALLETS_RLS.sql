-- Fix: user_wallets RLS policies for Pi Authentication
-- Issue: RLS policy was too restrictive during profile creation
-- Solution: Allow service_role to bypass RLS, and improve policy logic

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Enable full access to user_wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_insert" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_update" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_select" ON public.user_wallets;
DROP POLICY IF EXISTS "user_wallets_delete" ON public.user_wallets;

-- 2. Recreate with improved logic that allows service_role bypass and proper auth checks
-- INSERT policy: Allow if user owns the profile OR service role
CREATE POLICY "user_wallets_insert" ON public.user_wallets
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'  -- Allow service role (internal operations)
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- UPDATE policy: Allow if user owns the profile OR service role
CREATE POLICY "user_wallets_update" ON public.user_wallets
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- SELECT policy: Allow if user owns the profile OR service role
CREATE POLICY "user_wallets_select" ON public.user_wallets
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- DELETE policy: Allow if user owns the profile OR service role
CREATE POLICY "user_wallets_delete" ON public.user_wallets
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_wallets.profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO anon;
