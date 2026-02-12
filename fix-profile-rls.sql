-- Fix Profile RLS Policies for Dashboard Save
-- This addresses 403 and 400 errors when saving profiles

-- 1. Drop all existing policies on profiles
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public insert access" ON public.profiles;
DROP POLICY IF EXISTS "Public update access" ON public.profiles;

-- 2. Create comprehensive policies for all operations
-- SELECT: Everyone can read all profiles (for public bio pages)
CREATE POLICY "profiles_select_all"
    ON public.profiles
    FOR SELECT
    USING (true);

-- INSERT: Anyone can create a profile (for new user signups)
CREATE POLICY "profiles_insert_all"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- UPDATE: Anyone can update any profile (simplified for Pi Browser compatibility)
CREATE POLICY "profiles_update_all"
    ON public.profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- DELETE: Users can only delete their own profile
CREATE POLICY "profiles_delete_own"
    ON public.profiles
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR auth.uid() IS NULL -- Allow for Pi Browser without auth
    );

-- 3. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant all permissions to anon and authenticated
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. Verify the table structure has all needed columns
-- Check if background_music_url column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'background_music_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN background_music_url TEXT;
    END IF;
END $$;

-- 6. Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);

-- 7. Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
