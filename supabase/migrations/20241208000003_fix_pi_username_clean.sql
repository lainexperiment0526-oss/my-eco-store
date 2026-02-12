-- Fix duplicate pi_username constraint issue - SIMPLIFIED VERSION
-- This migration handles cases where multiple profiles might have the same pi_username

-- Step 1: Drop the strict unique constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pi_username_key CASCADE;

-- Step 2: Create a partial unique index (allows NULL values, enforces unique on non-NULL)
DROP INDEX IF EXISTS public.profiles_pi_username_unique_idx;
CREATE UNIQUE INDEX profiles_pi_username_unique_idx 
ON public.profiles (pi_username) 
WHERE pi_username IS NOT NULL AND pi_user_id IS NOT NULL;

-- Step 3: Add composite unique constraint on pi_user_id + pi_username
-- This ensures each user has at most one profile per pi_username
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_pi_user_composite_key CASCADE;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pi_user_composite_key 
UNIQUE (pi_user_id, pi_username);

-- Step 4: Create index on pi_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles (pi_user_id) 
WHERE pi_user_id IS NOT NULL;

-- Step 5: Clean up any existing duplicates before the constraint takes effect
-- This preserves the most recent profile and renames older duplicates
WITH ranked_profiles AS (
  SELECT 
    id,
    pi_user_id,
    pi_username,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY pi_user_id, pi_username 
      ORDER BY created_at DESC NULLS LAST
    ) as row_num
  FROM public.profiles
  WHERE pi_user_id IS NOT NULL 
  AND pi_username IS NOT NULL
)
UPDATE public.profiles 
SET pi_username = public.profiles.pi_username || '_old_' || SUBSTRING(public.profiles.id::text, 1, 8)
FROM ranked_profiles
WHERE public.profiles.id = ranked_profiles.id 
AND ranked_profiles.row_num > 1;

-- Step 6: Add helpful documentation
COMMENT ON INDEX public.profiles_pi_username_unique_idx IS 
'Partial unique index on pi_username for non-NULL values from authenticated Pi users';
  
COMMENT ON CONSTRAINT profiles_pi_user_composite_key ON public.profiles IS 
'Composite unique constraint ensures each Pi user has one profile per username';

-- Step 7: Success notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration successful!';
  RAISE NOTICE '✅ Dropped old pi_username unique constraint';
  RAISE NOTICE '✅ Created composite unique constraint (pi_user_id, pi_username)';
  RAISE NOTICE '✅ Cleaned up duplicate profiles';
END $$;
