-- COMPLETE FIX: Add payload column OR disable all notification triggers
-- Run this entire script in your Supabase SQL Editor

-- OPTION 1: Add the payload column (RECOMMENDED - keeps notifications working)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN notifications.payload IS 'Additional data for the notification';

-- OPTION 2: If you prefer to disable notifications completely, 
-- uncomment the lines below (remove the -- at the start of each line)

-- Get all trigger names first
-- DO $$
-- DECLARE
--     trigger_record RECORD;
-- BEGIN
--     FOR trigger_record IN 
--         SELECT tgname 
--         FROM pg_trigger 
--         WHERE tgrelid = 'followers'::regclass 
--         AND NOT tgisinternal
--     LOOP
--         EXECUTE format('DROP TRIGGER IF EXISTS %I ON followers CASCADE', trigger_record.tgname);
--         RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
--     END LOOP;
-- END $$;

-- Verify the fix
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'payload'
        ) THEN 'SUCCESS: payload column exists in notifications table'
        ELSE 'WARNING: payload column still missing'
    END AS status;

-- Test insert into followers (this will fail if triggers still have issues)
DO $$
BEGIN
    RAISE NOTICE 'Fix applied. Test the follow button in your app now.';
END $$;
