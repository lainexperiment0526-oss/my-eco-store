-- ========================================
-- FIX FOLLOW BUTTON - RUN THIS IN SUPABASE SQL EDITOR
-- Project: jzzbmoopwnvgxxirulga.supabase.co (YOUR OWN PROJECT)
-- ========================================

-- Step 1: Add the missing payload column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Step 2: Make sure the column is nullable (in case of issues)
ALTER TABLE public.notifications 
ALTER COLUMN payload DROP NOT NULL;

-- Step 3: Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'notifications' 
        AND column_name = 'payload'
    ) THEN
        RAISE NOTICE '✓ SUCCESS: payload column exists in notifications table';
    ELSE
        RAISE NOTICE '✗ ERROR: payload column was not created';
    END IF;
END $$;

-- Step 4: Show the notifications table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- ========================================
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/jzzbmoopwnvgxxirulga/sql/new
-- 2. Copy this ENTIRE file
-- 3. Paste it into the SQL Editor
-- 4. Click "RUN"
-- 5. You should see "✓ SUCCESS: payload column exists"
-- 6. RESTART your dev server: npm run dev
-- 7. Test the follow button in your app
-- ========================================
