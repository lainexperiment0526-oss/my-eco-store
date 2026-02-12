-- Add follower and following counts to profiles table
-- This version uses the correct column names: follower_profile_id and following_profile_id

-- Add follower_count column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Add following_count column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON public.profiles(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_following_count ON public.profiles(following_count DESC);

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the profile being followed
    UPDATE public.profiles 
    SET follower_count = follower_count + 1 
    WHERE id = NEW.following_profile_id;
    
    -- Increment following count for the follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_profile_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE public.profiles 
    SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.following_profile_id;
    
    -- Decrement following count
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_profile_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on followers table
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON public.followers;
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Recalculate existing follower counts
UPDATE public.profiles p
SET follower_count = (
  SELECT COUNT(*) 
  FROM public.followers f 
  WHERE f.following_profile_id = p.id
);

-- Recalculate existing following counts
UPDATE public.profiles p
SET following_count = (
  SELECT COUNT(*) 
  FROM public.followers f 
  WHERE f.follower_profile_id = p.id
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.follower_count IS 'Number of users following this profile';
COMMENT ON COLUMN public.profiles.following_count IS 'Number of users this profile is following';

-- Success message
SELECT 'Follower and following counts added to profiles! ✅' as status;
