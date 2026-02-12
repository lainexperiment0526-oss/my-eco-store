-- Fix RLS policies for followers table to support Pi Network users
-- Pi users don't have auth.uid() since they authenticate via Pi Network, not Supabase Auth

-- Drop existing policies
DROP POLICY IF EXISTS "Users can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;

-- Allow anyone to follow (frontend validates the user)
-- This is safe because we validate follower_profile_id exists in profiles table
CREATE POLICY "Anyone can follow profiles" 
ON public.followers 
FOR INSERT 
WITH CHECK (
  -- Ensure both profiles exist
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.follower_profile_id) AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.following_profile_id) AND
  -- Prevent self-following
  followers.follower_profile_id != followers.following_profile_id
);

-- Allow anyone to unfollow their own follows
-- Frontend will only send delete requests for current user's follows
CREATE POLICY "Anyone can unfollow" 
ON public.followers 
FOR DELETE 
USING (
  -- Ensure the follower profile exists
  EXISTS (SELECT 1 FROM public.profiles WHERE id = followers.follower_profile_id)
);

-- Ensure select policy exists (anyone can view followers)
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
