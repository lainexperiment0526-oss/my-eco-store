-- Disable Follow Notifications to Fix Payload Column Error
-- Run this in your Supabase SQL Editor

-- Step 1: List all triggers on followers table
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'followers'::regclass
AND NOT tgisinternal;

-- Step 2: Drop all common trigger names that might exist
DROP TRIGGER IF EXISTS notify_on_follow ON followers CASCADE;
DROP TRIGGER IF EXISTS follow_notification_trigger ON followers CASCADE;
DROP TRIGGER IF EXISTS on_follow_created ON followers CASCADE;
DROP TRIGGER IF EXISTS create_follow_notification ON followers CASCADE;
DROP TRIGGER IF EXISTS handle_new_follower ON followers CASCADE;
DROP TRIGGER IF EXISTS on_follower_insert ON followers CASCADE;
DROP TRIGGER IF EXISTS trigger_follow_notification ON followers CASCADE;

-- Step 3: Drop common function names that create notifications
DROP FUNCTION IF EXISTS notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS create_follow_notification_func() CASCADE;
DROP FUNCTION IF EXISTS handle_follow_notification() CASCADE;
DROP FUNCTION IF EXISTS trigger_notification_on_follow() CASCADE;
DROP FUNCTION IF EXISTS handle_new_follower() CASCADE;
DROP FUNCTION IF EXISTS create_notification_on_follow() CASCADE;

-- Step 4: Verify all triggers are removed
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'followers'::regclass
AND NOT tgisinternal;

-- Step 5: If you see any remaining triggers in the output above, 
-- manually drop them using:
-- DROP TRIGGER IF EXISTS <trigger_name> ON followers CASCADE;
-- DROP FUNCTION IF EXISTS <function_name>() CASCADE;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Follow notification triggers have been disabled. The follow button should now work without payload errors.';
END $$;
