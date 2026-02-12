-- ========================================
-- QUICK FIX FOR FOLLOW FUNCTIONALITY
-- Run this in Supabase SQL Editor
-- ========================================

-- Fix followers table column names
DO $$ 
BEGIN
    -- Check if old column names exist and rename them
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'follower_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'follower_profile_id'
    ) THEN
        ALTER TABLE public.followers RENAME COLUMN follower_id TO follower_profile_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'following_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'following_profile_id'
    ) THEN
        ALTER TABLE public.followers RENAME COLUMN following_id TO following_profile_id;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on followers table
DROP POLICY IF EXISTS "Users can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
DROP POLICY IF EXISTS "Anyone can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Anyone can unfollow" ON public.followers;
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
DROP POLICY IF EXISTS "Anyone can update followers" ON public.followers;

-- Create new policies that work with Pi Network authentication
-- Allow anyone to follow (Pi Network users don't have auth.uid())
CREATE POLICY "Anyone can follow profiles" 
ON public.followers 
FOR INSERT 
WITH CHECK (
    -- Ensure both profiles exist and prevent self-following
    follower_profile_id != following_profile_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = follower_profile_id) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = following_profile_id)
);

-- Allow anyone to unfollow
CREATE POLICY "Anyone can unfollow" 
ON public.followers 
FOR DELETE 
USING (true);

-- Allow anyone to view followers
CREATE POLICY "Anyone can view followers" 
ON public.followers 
FOR SELECT 
USING (true);

-- Allow anyone to update followers
CREATE POLICY "Anyone can update followers" 
ON public.followers 
FOR UPDATE 
USING (true);

-- Grant permissions to anon users (Pi Network users)
GRANT ALL ON public.followers TO anon;
GRANT ALL ON public.followers TO authenticated;

-- Also ensure profiles table is publicly readable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create public read policy
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Grant permissions
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
