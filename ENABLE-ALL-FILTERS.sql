-- ========================================
-- ENABLE ALL SEARCH FILTERS
-- ========================================
-- This adds category column and makes search filters work

-- Step 1: Add category column to profiles (from add-categories.sql)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Step 2: Add check constraint for valid categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_category_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_category_check 
        CHECK (category IN ('content_creator', 'business', 'gamer', 'developer', 'artist', 'musician', 'educator', 'influencer', 'entrepreneur', 'other'));
    END IF;
END $$;

-- Step 3: Create index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);

-- Step 4: Add documentation comment
COMMENT ON COLUMN public.profiles.category IS 'User category: content_creator, business, gamer, developer, artist, musician, educator, influencer, entrepreneur, other';

-- Step 5: Verify the column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'category';

-- ========================================
-- ✅ DONE! Category filtering enabled!
-- ========================================
-- Now users can:
-- 1. Select their category in Dashboard
-- 2. Filter by category in /search-users
-- 3. Search by username A-Z, most followers, most recent
