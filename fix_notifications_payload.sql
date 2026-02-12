-- Fix missing payload column in notifications table
-- Safe to run multiple times

-- Add payload column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'payload'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN payload JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Added payload column to notifications';
    ELSE
        RAISE NOTICE '✓ payload column already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
AND column_name IN ('payload', 'is_read', 'action_url', 'type')
ORDER BY column_name;

-- Test query to confirm table works
SELECT COUNT(*) as notification_count FROM public.notifications;
