-- Fix notifications table to add missing payload column
-- Run this in your Supabase SQL Editor

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
        RAISE NOTICE 'Added payload column to notifications table';
    ELSE
        RAISE NOTICE 'payload column already exists';
    END IF;
END $$;

-- Add is_read column if it doesn't exist (in case it's named differently)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_read column to notifications table';
    ELSE
        RAISE NOTICE 'is_read column already exists';
    END IF;
END $$;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;
