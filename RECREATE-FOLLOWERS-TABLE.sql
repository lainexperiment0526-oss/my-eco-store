-- ========================================
-- COMPLETE RECREATE: Followers Table
-- ========================================
-- This drops and recreates the entire followers table with correct names

-- Step 1: Drop the old table (this will delete all existing follows)
DROP TABLE IF EXISTS public.followers CASCADE;

-- Step 2: Create new table with correct column names
CREATE TABLE public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(follower_profile_id, following_profile_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_followers_follower_profile ON public.followers(follower_profile_id);
CREATE INDEX idx_followers_following_profile ON public.followers(following_profile_id);
CREATE INDEX idx_followers_created_at ON public.followers(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive policies (Pi Network compatible)
CREATE POLICY "Anyone can follow profiles" 
ON public.followers 
FOR INSERT 
WITH CHECK (
    follower_profile_id != following_profile_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = follower_profile_id) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = following_profile_id)
);

CREATE POLICY "Anyone can unfollow" 
ON public.followers 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can view followers" 
ON public.followers 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update followers" 
ON public.followers 
FOR UPDATE 
USING (true);

-- Step 6: Grant permissions
GRANT ALL ON public.followers TO authenticated;
GRANT ALL ON public.followers TO anon;

-- Step 7: Verify the table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'followers' 
ORDER BY ordinal_position;

-- ========================================
-- ✅ DONE! Fresh followers table created!
-- ========================================
-- Note: This deletes existing follow relationships
-- Follow functionality will work immediately after running this
