-- Add follower counts and profile views to profiles table

-- Add category column for user categorization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add follower_count column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Add following_count column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add profile_views_count column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;

-- Add total_visits column for all-time tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;

-- Create profile_views table to track individual views
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    session_id TEXT,
    is_unique_view BOOLEAN DEFAULT false
);

-- Create followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Fix existing followers table schema if needed
DO $$ 
BEGIN
    -- Add follower_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'follower_id'
    ) THEN
        -- Check if old 'user_id' column exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'followers' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.followers RENAME COLUMN user_id TO follower_id;
        ELSE
            -- Add the column as nullable first
            ALTER TABLE public.followers 
            ADD COLUMN follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add following_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'following_id'
    ) THEN
        -- If old schema exists with 'followed_id', rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'followers' 
            AND column_name = 'followed_id'
        ) THEN
            ALTER TABLE public.followers RENAME COLUMN followed_id TO following_id;
        -- Or if 'profile_id' exists, rename it
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'followers' 
            AND column_name = 'profile_id'
        ) THEN
            ALTER TABLE public.followers RENAME COLUMN profile_id TO following_id;
        ELSE
            -- Add the column as nullable first
            ALTER TABLE public.followers 
            ADD COLUMN following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Make columns NOT NULL if they have data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'follower_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Delete rows with NULL follower_id (cleanup)
        DELETE FROM public.followers WHERE follower_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE public.followers ALTER COLUMN follower_id SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'followers' 
        AND column_name = 'following_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Delete rows with NULL following_id (cleanup)
        DELETE FROM public.followers WHERE following_id IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE public.followers ALTER COLUMN following_id SET NOT NULL;
    END IF;
END $$;

-- Add check constraint for valid categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_category_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_category_check 
        CHECK (category IN ('content_creator', 'business', 'gamer', 'developer', 'artist', 'musician', 'educator', 'influencer', 'entrepreneur', 'other'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON public.profiles(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_following_count ON public.profiles(following_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_views_count ON public.profiles(profile_views_count DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_visited_at ON public.profile_views(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- Function to track profile view
CREATE OR REPLACE FUNCTION track_profile_view(
    p_profile_id UUID,
    p_viewer_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_is_unique BOOLEAN := false;
    v_view_id UUID;
BEGIN
    -- Check if this is a unique view (first visit from this IP in last 24 hours)
    IF NOT EXISTS (
        SELECT 1 FROM public.profile_views
        WHERE profile_id = p_profile_id
        AND (
            (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
            OR (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
        )
        AND visited_at > NOW() - INTERVAL '24 hours'
    ) THEN
        v_is_unique := true;
    END IF;

    -- Insert view record
    INSERT INTO public.profile_views (
        profile_id,
        viewer_id,
        ip_address,
        user_agent,
        referrer,
        session_id,
        is_unique_view
    ) VALUES (
        p_profile_id,
        p_viewer_id,
        p_ip_address,
        p_user_agent,
        p_referrer,
        p_session_id,
        v_is_unique
    ) RETURNING id INTO v_view_id;

    -- Update profile view counts
    UPDATE public.profiles
    SET 
        total_visits = total_visits + 1,
        profile_views_count = CASE WHEN v_is_unique THEN profile_views_count + 1 ELSE profile_views_count END
    WHERE id = p_profile_id;

    RETURN jsonb_build_object(
        'success', true,
        'view_id', v_view_id,
        'is_unique', v_is_unique
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the profile being followed
        UPDATE public.profiles 
        SET follower_count = follower_count + 1 
        WHERE id = NEW.following_id;
        
        -- Increment following count for the follower
        UPDATE public.profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count
        UPDATE public.profiles 
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.following_id;
        
        -- Decrement following count
        UPDATE public.profiles 
        SET following_count = GREATEST(following_count - 1, 0)
        WHERE id = OLD.follower_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
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
    WHERE f.following_id = p.id
);

-- Recalculate existing following counts
UPDATE public.profiles p
SET following_count = (
    SELECT COUNT(*) 
    FROM public.followers f 
    WHERE f.follower_id = p.id
);

-- Recalculate existing profile views
UPDATE public.profiles p
SET profile_views_count = (
    SELECT COUNT(*) 
    FROM public.profile_views pv 
    WHERE pv.profile_id = p.id AND pv.is_unique_view = true
);

UPDATE public.profiles p
SET total_visits = (
    SELECT COUNT(*) 
    FROM public.profile_views pv 
    WHERE pv.profile_id = p.id
);

-- Enable RLS on new tables
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_views
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
CREATE POLICY "Anyone can insert profile views" ON public.profile_views
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profile owners can view their analytics" ON public.profile_views;
CREATE POLICY "Profile owners can view their analytics" ON public.profile_views
    FOR SELECT USING (
        profile_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    );

-- RLS policies for followers
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
CREATE POLICY "Anyone can view followers" ON public.followers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow" ON public.followers;
CREATE POLICY "Authenticated users can follow" ON public.followers
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        follower_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
CREATE POLICY "Users can unfollow" ON public.followers
    FOR DELETE USING (
        follower_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
    );

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.category IS 'User category: content_creator, business, gamer, developer, artist, musician, educator, influencer, entrepreneur, other';
COMMENT ON COLUMN public.profiles.follower_count IS 'Number of users following this profile';
COMMENT ON COLUMN public.profiles.following_count IS 'Number of users this profile is following';
COMMENT ON COLUMN public.profiles.profile_views_count IS 'Number of unique profile views (24h unique)';
COMMENT ON COLUMN public.profiles.total_visits IS 'Total number of all profile visits';
COMMENT ON TABLE public.profile_views IS 'Tracks individual profile view events with analytics data';
COMMENT ON TABLE public.followers IS 'Stores follower/following relationships between profiles';

-- Grant permissions
GRANT SELECT ON public.profile_views TO anon;
GRANT INSERT ON public.profile_views TO anon;
GRANT ALL ON public.profile_views TO authenticated;

GRANT SELECT ON public.followers TO anon;
GRANT INSERT, DELETE ON public.followers TO authenticated;

-- Success message
SELECT 'Follower counts and profile views added successfully! ✅' as status,
       'New columns: follower_count, following_count, profile_views_count, total_visits' as columns,
       'New tables: profile_views, followers' as tables,
       'Use track_profile_view() function to record visits' as usage;
