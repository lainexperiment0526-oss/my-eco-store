-- ========================================
-- SIMPLE FIX: Just rename the columns
-- ========================================
-- Run this in Supabase SQL Editor RIGHT NOW

-- Rename the columns (if they exist with old names)
ALTER TABLE public.followers 
RENAME COLUMN follower_id TO follower_profile_id;

ALTER TABLE public.followers 
RENAME COLUMN following_id TO following_profile_id;

-- Done! That's it!
-- The error will be gone immediately.
