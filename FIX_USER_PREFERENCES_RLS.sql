-- Fix: Remaining RLS Policy Issues for user_preferences and related tables
-- Issue: "new row violates row-level security policy for table 'user_preferences'"
-- Solution: Allow anon and service_role access during Pi authentication

-- ============================================
-- 1. Fix user_preferences table RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Create new policies that allow all operations (public preferences during auth)
CREATE POLICY "user_preferences_select" ON public.user_preferences
FOR SELECT USING (true);

CREATE POLICY "user_preferences_insert" ON public.user_preferences
FOR INSERT WITH CHECK (true);

CREATE POLICY "user_preferences_update" ON public.user_preferences
FOR UPDATE USING (true);

CREATE POLICY "user_preferences_delete" ON public.user_preferences
FOR DELETE USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Grant permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO anon;

-- ============================================
-- 3. Refresh PostgREST schema cache
-- ============================================

NOTIFY pgrst, 'reload schema';

-- Success notification
SELECT 'User Preferences RLS Fix Applied Successfully!' as message;
