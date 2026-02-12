-- ========================================
-- SMART FIX: Handles all cases automatically
-- ========================================
-- This will work no matter what state your table is in

DO $$ 
DECLARE
    has_old_columns BOOLEAN;
    has_new_columns BOOLEAN;
BEGIN
    -- Check if old column names exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'followers' 
        AND column_name = 'following_id'
    ) INTO has_old_columns;
    
    -- Check if new column names exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'followers' 
        AND column_name = 'following_profile_id'
    ) INTO has_new_columns;
    
    -- Rename if old columns exist
    IF has_old_columns THEN
        RAISE NOTICE 'Found old column names, renaming now...';
        
        EXECUTE 'ALTER TABLE public.followers RENAME COLUMN follower_id TO follower_profile_id';
        RAISE NOTICE '✅ Renamed follower_id → follower_profile_id';
        
        EXECUTE 'ALTER TABLE public.followers RENAME COLUMN following_id TO following_profile_id';
        RAISE NOTICE '✅ Renamed following_id → following_profile_id';
        
    ELSIF has_new_columns THEN
        RAISE NOTICE '✅ Columns already have correct names!';
    ELSE
        RAISE EXCEPTION 'Table structure is unexpected. Please check manually.';
    END IF;
END $$;

-- Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'followers' 
ORDER BY ordinal_position;
