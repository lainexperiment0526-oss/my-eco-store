-- ========================================
-- ENABLE PROFILE CATEGORIES FOR USER SEARCH
-- ========================================
-- This ensures the category column exists and is properly indexed

-- Step 1: Add category column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Step 2: Add check constraint for valid categories
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_category_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_category_check;
    END IF;
    
    -- Add constraint with all valid categories
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_category_check 
    CHECK (category IN ('content_creator', 'business', 'gamer', 'developer', 'artist', 'musician', 'educator', 'influencer', 'entrepreneur', 'other'));
END $$;

-- Step 3: Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);

-- Step 4: Update NULL categories to 'other'
UPDATE public.profiles 
SET category = 'other' 
WHERE category IS NULL;

-- Step 5: Add documentation
COMMENT ON COLUMN public.profiles.category IS 'User profile category for search filtering: content_creator, business, gamer, developer, artist, musician, educator, influencer, entrepreneur, other';

-- Step 6: Verify setup
DO $$
DECLARE
    column_exists BOOLEAN;
    index_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'category'
    ) INTO column_exists;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_category'
    ) INTO index_exists;
    
    -- Check if constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_category_check'
    ) INTO constraint_exists;
    
    -- Output results
    RAISE NOTICE 'Category Setup Verification:';
    RAISE NOTICE '  Column exists: %', column_exists;
    RAISE NOTICE '  Index exists: %', index_exists;
    RAISE NOTICE '  Constraint exists: %', constraint_exists;
    
    IF column_exists AND index_exists AND constraint_exists THEN
        RAISE NOTICE '✅ Profile categories are fully enabled!';
    ELSE
        RAISE WARNING '⚠️ Profile categories setup incomplete';
    END IF;
END $$;
