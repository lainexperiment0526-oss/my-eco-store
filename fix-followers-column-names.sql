-- ========================================
-- URGENT FIX: Followers Table Column Names
-- ========================================
-- This fixes the error: "null value in column 'following_id'"
-- Problem: Database has follower_id/following_id but code uses follower_profile_id/following_profile_id

-- Step 1: Check current column names
DO $$ 
BEGIN
    -- If columns already have correct names, skip rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followers' 
        AND column_name = 'follower_profile_id'
    ) THEN
        RAISE NOTICE 'Columns already renamed correctly!';
    ELSE
        -- Rename follower_id to follower_profile_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'followers' 
            AND column_name = 'follower_id'
        ) THEN
            ALTER TABLE public.followers RENAME COLUMN follower_id TO follower_profile_id;
            RAISE NOTICE 'Renamed follower_id to follower_profile_id';
        END IF;
        
        -- Rename following_id to following_profile_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'followers' 
            AND column_name = 'following_id'
        ) THEN
            ALTER TABLE public.followers RENAME COLUMN following_id TO following_profile_id;
            RAISE NOTICE 'Renamed following_id to following_profile_id';
        END IF;
    END IF;
END $$;

-- Step 2: Ensure table has correct structure
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(follower_profile_id, following_profile_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_profile ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_profile ON public.followers(following_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop all existing policies
DROP POLICY IF EXISTS "Users can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
DROP POLICY IF EXISTS "Anyone can follow profiles" ON public.followers;
DROP POLICY IF EXISTS "Anyone can unfollow" ON public.followers;
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
DROP POLICY IF EXISTS "Anyone can update followers" ON public.followers;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.followers;

-- Step 6: Create new permissive policies (Pi Network auth compatible)
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

-- Step 7: Grant permissions
GRANT ALL ON public.followers TO authenticated;
GRANT ALL ON public.followers TO anon;

-- Step 8: Verify the fix
DO $$ 
BEGIN
    -- Check if columns exist with correct names
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followers' 
        AND column_name = 'follower_profile_id'
    ) THEN
        RAISE EXCEPTION 'follower_profile_id column missing!';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followers' 
        AND column_name = 'following_profile_id'
    ) THEN
        RAISE EXCEPTION 'following_profile_id column missing!';
    END IF;
    
    RAISE NOTICE '✅ All columns exist with correct names!';
END $$;

-- Step 9: Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'followers' 
ORDER BY ordinal_position;

-- ========================================
-- SUMMARY OF CHANGES
-- ========================================
-- ✅ Renamed follower_id → follower_profile_id
-- ✅ Renamed following_id → following_profile_id
-- ✅ Added indexes for performance
-- ✅ Enabled RLS
-- ✅ Created permissive policies for Pi Network users
-- ✅ Granted permissions to anon and authenticated
-- ✅ Verified table structure
-- ========================================

-- Expected result: Follow functionality will now work!
