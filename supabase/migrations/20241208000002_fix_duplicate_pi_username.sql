-- Fix duplicate pi_username constraint issue
-- This migration handles cases where multiple profiles might have the same pi_username

-- Step 1: Drop the unique constraint on pi_username (it's not truly unique in Pi Network)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pi_username_key;

-- Step 2: Create a partial unique index that only applies to non-null pi_usernames
-- This allows multiple NULL values but ensures actual usernames are unique
DROP INDEX IF EXISTS profiles_pi_username_unique_idx;
CREATE UNIQUE INDEX profiles_pi_username_unique_idx 
ON profiles (pi_username) 
WHERE pi_username IS NOT NULL;

-- Step 3: Add a composite unique constraint on (pi_user_id, pi_username)
-- This ensures the combination is unique, preventing duplicate Pi users
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_pi_user_composite_key;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_pi_user_composite_key 
UNIQUE (pi_user_id, pi_username);

-- Step 4: Create an index on pi_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON profiles (pi_user_id) WHERE pi_user_id IS NOT NULL;

-- Step 5: Add a function to handle duplicate Pi users gracefully
CREATE OR REPLACE FUNCTION handle_duplicate_pi_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to insert a duplicate pi_username, update the existing record instead
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE pi_username = NEW.pi_username 
    AND pi_user_id = NEW.pi_user_id 
    AND id != NEW.id
  ) THEN
    -- Update existing profile instead of creating duplicate
    UPDATE profiles 
    SET 
      wallet_address = COALESCE(NEW.wallet_address, wallet_address),
      display_name = COALESCE(NEW.display_name, display_name),
      updated_at = NOW()
    WHERE pi_username = NEW.pi_username 
    AND pi_user_id = NEW.pi_user_id;
    
    -- Return NULL to cancel the INSERT
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_pi_user ON profiles;
CREATE TRIGGER prevent_duplicate_pi_user
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_duplicate_pi_user();

-- Step 7: Clean up any existing duplicates
-- Keep the most recent profile for each pi_user_id and merge data
WITH ranked_profiles AS (
  SELECT 
    id,
    pi_user_id,
    pi_username,
    ROW_NUMBER() OVER (
      PARTITION BY pi_user_id, pi_username 
      ORDER BY created_at DESC
    ) as rn
  FROM profiles
  WHERE pi_user_id IS NOT NULL 
  AND pi_username IS NOT NULL
),
duplicates AS (
  SELECT id FROM ranked_profiles WHERE rn > 1
)
-- Instead of deleting, we'll rename them as merged to preserve data
UPDATE profiles 
SET 
  pi_username = pi_username || '_merged_' || CAST(id AS TEXT)
WHERE id IN (SELECT id FROM duplicates);

-- Step 8: Add helpful comments
COMMENT ON INDEX profiles_pi_username_unique_idx IS 
  'Ensures pi_username uniqueness only for non-null values, allowing multiple NULL entries';
  
COMMENT ON CONSTRAINT profiles_pi_user_composite_key ON profiles IS 
  'Ensures the combination of pi_user_id and pi_username is unique, preventing duplicate Pi Network users';

COMMENT ON FUNCTION handle_duplicate_pi_user() IS 
  'Prevents duplicate Pi Network users by updating existing profiles instead of creating duplicates';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed duplicate pi_username constraint issue';
  RAISE NOTICE '✅ Created composite unique constraint on (pi_user_id, pi_username)';
  RAISE NOTICE '✅ Added trigger to prevent future duplicates';
  RAISE NOTICE '✅ Cleaned up existing duplicate profiles';
END $$;
