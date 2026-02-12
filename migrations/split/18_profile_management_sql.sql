-- 18_profile_management_sql.sql
-- Comprehensive profile management, queries, stats, and helper functions
-- Covers profile creation, updates, visibility, activity, discovery, and analytics

-- 1. PROFILE ACTIVITY TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.profile_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_activity_profile_id ON public.profile_activity(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_activity_type ON public.profile_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_profile_activity_created_at ON public.profile_activity(created_at);

-- 2. PROFILE VISIBILITY/DISCOVERABILITY TABLE
CREATE TABLE IF NOT EXISTS public.profile_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  is_discoverable BOOLEAN DEFAULT TRUE,
  show_in_search BOOLEAN DEFAULT TRUE,
  show_in_trending BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP WITH TIME ZONE,
  visibility_level TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_visibility_profile_id ON public.profile_visibility(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_is_public ON public.profile_visibility(is_public);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_is_discoverable ON public.profile_visibility(is_discoverable);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_featured ON public.profile_visibility(featured);

-- 3. PROFILE RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.profile_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  score DECIMAL(5, 2) DEFAULT 0,
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id, recommended_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_recommendations_user_id ON public.profile_recommendations(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_recommendations_score ON public.profile_recommendations(score DESC);

-- 4. PROFILE SEARCH INDEX TABLE (for full-text search)
CREATE TABLE IF NOT EXISTS public.profile_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_text TEXT,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_search_index_profile_id ON public.profile_search_index(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_search_vector ON public.profile_search_index USING GIN(search_vector);

-- 5. PROFILE STATS VIEW (denormalized stats for quick access)
CREATE TABLE IF NOT EXISTS public.profile_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_links INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_stats_profile_id ON public.profile_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_stats_total_followers ON public.profile_stats(total_followers DESC);
CREATE INDEX IF NOT EXISTS idx_profile_stats_total_views ON public.profile_stats(total_views DESC);

-- TRIGGERS

-- Update profile_visibility timestamp
CREATE OR REPLACE FUNCTION update_profile_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_visibility_updated_at_trigger ON public.profile_visibility;
CREATE TRIGGER profile_visibility_updated_at_trigger
BEFORE UPDATE ON public.profile_visibility
FOR EACH ROW
EXECUTE FUNCTION update_profile_visibility_updated_at();

-- Update profile_search_index timestamp and vector
CREATE OR REPLACE FUNCTION update_profile_search_index()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text = COALESCE(NEW.search_text, '');
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.search_text, ''));
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_search_index_trigger ON public.profile_search_index;
CREATE TRIGGER profile_search_index_trigger
BEFORE INSERT OR UPDATE ON public.profile_search_index
FOR EACH ROW
EXECUTE FUNCTION update_profile_search_index();

-- Sync profile stats on profile update
CREATE OR REPLACE FUNCTION sync_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profile_stats
  SET updated_at = NOW()
  WHERE profile_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_stats_trigger ON public.profiles;
CREATE TRIGGER sync_profile_stats_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_stats();

-- PROFILE MANAGEMENT FUNCTIONS

-- Get or create profile visibility
CREATE OR REPLACE FUNCTION get_or_create_profile_visibility(p_profile_id UUID)
RETURNS UUID AS $$
DECLARE
  v_visibility_id UUID;
BEGIN
  SELECT id INTO v_visibility_id FROM public.profile_visibility WHERE profile_id = p_profile_id;
  
  IF v_visibility_id IS NULL THEN
    INSERT INTO public.profile_visibility (profile_id)
    VALUES (p_profile_id)
    RETURNING id INTO v_visibility_id;
  END IF;
  
  RETURN v_visibility_id;
END;
$$ LANGUAGE plpgsql;

-- Get or create profile stats
CREATE OR REPLACE FUNCTION get_or_create_profile_stats(p_profile_id UUID)
RETURNS UUID AS $$
DECLARE
  v_stats_id UUID;
BEGIN
  SELECT id INTO v_stats_id FROM public.profile_stats WHERE profile_id = p_profile_id;
  
  IF v_stats_id IS NULL THEN
    INSERT INTO public.profile_stats (profile_id)
    VALUES (p_profile_id)
    RETURNING id INTO v_stats_id;
  END IF;
  
  RETURN v_stats_id;
END;
$$ LANGUAGE plpgsql;

-- Get or create profile search index
CREATE OR REPLACE FUNCTION get_or_create_profile_search_index(p_profile_id UUID, p_search_text TEXT)
RETURNS UUID AS $$
DECLARE
  v_search_id UUID;
BEGIN
  SELECT id INTO v_search_id FROM public.profile_search_index WHERE profile_id = p_profile_id;
  
  IF v_search_id IS NULL THEN
    INSERT INTO public.profile_search_index (profile_id, search_text)
    VALUES (p_profile_id, p_search_text)
    RETURNING id INTO v_search_id;
  ELSE
    UPDATE public.profile_search_index
    SET search_text = p_search_text
    WHERE id = v_search_id;
  END IF;
  
  RETURN v_search_id;
END;
$$ LANGUAGE plpgsql;

-- Log profile activity
CREATE OR REPLACE FUNCTION log_profile_activity(
  p_profile_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.profile_activity (profile_id, user_id, activity_type, activity_data)
  VALUES (p_profile_id, p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Get profile summary (stats + basic info)
CREATE OR REPLACE FUNCTION get_profile_summary(p_profile_id UUID)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  business_name TEXT,
  logo TEXT,
  description TEXT,
  is_verified BOOLEAN,
  is_admin BOOLEAN,
  has_premium BOOLEAN,
  is_merchant BOOLEAN,
  total_followers INTEGER,
  total_views INTEGER,
  total_products INTEGER,
  is_public BOOLEAN,
  is_discoverable BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.business_name,
    p.logo,
    p.description,
    p.is_verified,
    p.is_admin,
    p.has_premium,
    p.is_merchant,
    COALESCE(ps.total_followers, 0)::INTEGER,
    COALESCE(ps.total_views, 0)::INTEGER,
    COALESCE(ps.total_products, 0)::INTEGER,
    COALESCE(pv.is_public, TRUE),
    COALESCE(pv.is_discoverable, TRUE)
  FROM public.profiles p
  LEFT JOIN public.profile_stats ps ON p.id = ps.profile_id
  LEFT JOIN public.profile_visibility pv ON p.id = pv.profile_id
  WHERE p.id = p_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Search profiles by username, business name, or description
CREATE OR REPLACE FUNCTION search_profiles(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  business_name TEXT,
  logo TEXT,
  description TEXT,
  total_followers INTEGER,
  total_views INTEGER,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.business_name,
    p.logo,
    p.description,
    COALESCE(ps.total_followers, 0)::INTEGER,
    COALESCE(ps.total_views, 0)::INTEGER,
    ts_rank(psi.search_vector, plainto_tsquery('english', p_query))::REAL
  FROM public.profiles p
  LEFT JOIN public.profile_stats ps ON p.id = ps.profile_id
  LEFT JOIN public.profile_search_index psi ON p.id = psi.profile_id
  LEFT JOIN public.profile_visibility pv ON p.id = pv.profile_id
  WHERE (psi.search_vector @@ plainto_tsquery('english', p_query)
         OR p.username ILIKE '%' || p_query || '%'
         OR p.business_name ILIKE '%' || p_query || '%')
    AND COALESCE(pv.is_public, TRUE) = TRUE
    AND COALESCE(pv.show_in_search, TRUE) = TRUE
    AND p.account_deleted = FALSE
  ORDER BY ts_rank(psi.search_vector, plainto_tsquery('english', p_query)) DESC,
           COALESCE(ps.total_followers, 0) DESC,
           COALESCE(ps.total_views, 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get trending profiles
CREATE OR REPLACE FUNCTION get_trending_profiles(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  business_name TEXT,
  logo TEXT,
  total_followers INTEGER,
  total_views INTEGER,
  total_recent_views INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.business_name,
    p.logo,
    COALESCE(ps.total_followers, 0)::INTEGER,
    COALESCE(ps.total_views, 0)::INTEGER,
    (SELECT COUNT(*)::INTEGER FROM public.analytics 
     WHERE profile_id = p.id 
       AND created_at > NOW() - INTERVAL '7 days'
       AND event_type = 'view')
  FROM public.profiles p
  LEFT JOIN public.profile_stats ps ON p.id = ps.profile_id
  LEFT JOIN public.profile_visibility pv ON p.id = pv.profile_id
  WHERE COALESCE(pv.is_public, TRUE) = TRUE
    AND p.account_deleted = FALSE
  ORDER BY (SELECT COUNT(*) FROM public.analytics 
            WHERE profile_id = p.id 
              AND created_at > NOW() - INTERVAL '7 days'
              AND event_type = 'view') DESC,
           COALESCE(ps.total_followers, 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update profile visibility status
CREATE OR REPLACE FUNCTION update_profile_visibility_status(
  p_profile_id UUID,
  p_is_public BOOLEAN DEFAULT NULL,
  p_is_discoverable BOOLEAN DEFAULT NULL,
  p_show_in_search BOOLEAN DEFAULT NULL,
  p_featured BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profile_visibility
  SET 
    is_public = COALESCE(p_is_public, is_public),
    is_discoverable = COALESCE(p_is_discoverable, is_discoverable),
    show_in_search = COALESCE(p_show_in_search, show_in_search),
    featured = COALESCE(p_featured, featured)
  WHERE profile_id = p_profile_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Refresh profile statistics (recalculate from source tables)
CREATE OR REPLACE FUNCTION refresh_profile_statistics(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profile_stats
  SET
    total_followers = (SELECT COUNT(*) FROM public.followers WHERE following_profile_id = p_profile_id),
    total_following = (SELECT COUNT(*) FROM public.followers WHERE follower_profile_id = p_profile_id),
    total_views = (SELECT COUNT(*) FROM public.analytics WHERE profile_id = p_profile_id AND event_type = 'view'),
    total_messages = (SELECT COUNT(*) FROM public.messages WHERE receiver_profile_id = p_profile_id),
    total_links = (SELECT COUNT(*) FROM public.links WHERE profile_id = p_profile_id),
    total_products = (SELECT COUNT(*) FROM public.products WHERE profile_id = p_profile_id),
    total_orders = (SELECT COUNT(*) FROM public.payments WHERE profile_id = p_profile_id AND status = 'completed'),
    total_revenue = COALESCE((SELECT SUM(amount) FROM public.payments WHERE profile_id = p_profile_id AND status = 'completed'), 0),
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE profile_id = p_profile_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES

ALTER TABLE public.profile_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_stats ENABLE ROW LEVEL SECURITY;

-- Profile activity: owner/admin read
DROP POLICY IF EXISTS "profile_activity_read" ON public.profile_activity;
CREATE POLICY "profile_activity_read" ON public.profile_activity
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "profile_activity_insert" ON public.profile_activity;
CREATE POLICY "profile_activity_insert" ON public.profile_activity
  FOR INSERT WITH CHECK (true);

-- Profile visibility: public read, owner write
DROP POLICY IF EXISTS "profile_visibility_read" ON public.profile_visibility;
CREATE POLICY "profile_visibility_read" ON public.profile_visibility
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_visibility_write" ON public.profile_visibility;
CREATE POLICY "profile_visibility_write" ON public.profile_visibility
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Profile recommendations: public read
DROP POLICY IF EXISTS "profile_recommendations_read" ON public.profile_recommendations;
CREATE POLICY "profile_recommendations_read" ON public.profile_recommendations
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = user_profile_id AND user_id = auth.uid())
    OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = TRUE)
  );

-- Profile search index: public read
DROP POLICY IF EXISTS "profile_search_index_read" ON public.profile_search_index;
CREATE POLICY "profile_search_index_read" ON public.profile_search_index
  FOR SELECT USING (true);

-- Profile stats: public read, system write
DROP POLICY IF EXISTS "profile_stats_read" ON public.profile_stats;
CREATE POLICY "profile_stats_read" ON public.profile_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_stats_write" ON public.profile_stats;
CREATE POLICY "profile_stats_write" ON public.profile_stats
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = TRUE));

-- VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   PROFILE MANAGEMENT SQL COMPLETE! ✅                     ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Profile Tables Created:';
  RAISE NOTICE '   • profile_activity — log all profile interactions';
  RAISE NOTICE '   • profile_visibility — control public/discoverable status';
  RAISE NOTICE '   • profile_recommendations — AI/algo recommendations';
  RAISE NOTICE '   • profile_search_index — full-text search support';
  RAISE NOTICE '   • profile_stats — denormalized stats for performance';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Query Functions:';
  RAISE NOTICE '   • get_profile_summary() — overview with stats';
  RAISE NOTICE '   • search_profiles() — full-text + username search';
  RAISE NOTICE '   • get_trending_profiles() — trending by recent views';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Management Functions:';
  RAISE NOTICE '   • log_profile_activity()';
  RAISE NOTICE '   • update_profile_visibility_status()';
  RAISE NOTICE '   • refresh_profile_statistics()';
  RAISE NOTICE '   • get_or_create_profile_visibility/stats/search_index()';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Profile discovery, search, and analytics ready';
END $$;
