-- 09_helper_functions.sql
-- Shared helper functions

-- Drop existing helpers to allow signature changes when re-running
DROP FUNCTION IF EXISTS public.get_follower_count(UUID);
DROP FUNCTION IF EXISTS public.get_following_count(UUID);
DROP FUNCTION IF EXISTS public.get_view_count(UUID);
DROP FUNCTION IF EXISTS public.is_user_following(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_active_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_profile_badges(UUID);
DROP FUNCTION IF EXISTS public.has_badge(UUID, TEXT);
DROP FUNCTION IF EXISTS public.grant_badge(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_profile_stats(UUID);

-- Get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.followers WHERE following_profile_id = p_profile_id
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get following count
CREATE OR REPLACE FUNCTION get_following_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.followers WHERE follower_profile_id = p_profile_id
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get view count
CREATE OR REPLACE FUNCTION get_view_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.analytics WHERE profile_id = p_profile_id AND event_type = 'view'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if user is following another user
CREATE OR REPLACE FUNCTION is_user_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.followers
    WHERE follower_profile_id = p_follower_id AND following_profile_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get active subscription plan
CREATE OR REPLACE FUNCTION get_active_subscription(p_profile_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT plan FROM public.subscriptions
     WHERE profile_id = p_profile_id AND status = 'active'
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY updated_at DESC LIMIT 1),
    'free'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get badges for profile
CREATE OR REPLACE FUNCTION get_profile_badges(p_profile_id UUID)
RETURNS TABLE (
  badge_type TEXT,
  badge_name TEXT,
  badge_icon TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.badge_type, b.badge_name, b.badge_icon, b.badge_color
  FROM public.badges b
  WHERE b.profile_id = p_profile_id
  ORDER BY b.earned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Check if user has specific badge
CREATE OR REPLACE FUNCTION has_badge(p_profile_id UUID, p_badge_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.badges
    WHERE profile_id = p_profile_id AND badge_type = p_badge_type
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant badge to profile
CREATE OR REPLACE FUNCTION grant_badge(
  p_profile_id UUID,
  p_badge_type TEXT,
  p_badge_name TEXT,
  p_badge_icon TEXT,
  p_badge_color TEXT DEFAULT '#3B82F6'
)
RETURNS UUID AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  INSERT INTO public.badges (profile_id, badge_type, badge_name, badge_icon, badge_color, earned_at)
  VALUES (p_profile_id, p_badge_type, p_badge_name, p_badge_icon, p_badge_color, NOW())
  ON CONFLICT (profile_id, badge_type) DO UPDATE
  SET earned_at = NOW()
  RETURNING id INTO v_badge_id;
  RETURN v_badge_id;
END;
$$ LANGUAGE plpgsql;

-- Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_profile_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO public.notifications (
    profile_id, notification_type, title, message,
    actor_profile_id, related_id
  )
  VALUES (p_profile_id, p_type, p_title, p_message, p_actor_id, p_related_id)
  RETURNING id INTO v_notif_id;
  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql;

-- Profile stats helper
CREATE OR REPLACE FUNCTION get_profile_stats(p_profile_id UUID)
RETURNS TABLE (
  username TEXT,
  followers_count INTEGER,
  following_count INTEGER,
  views_count INTEGER,
  messages_count INTEGER,
  links_count INTEGER,
  products_count INTEGER,
  subscription_plan TEXT,
  badge_count INTEGER,
  unread_notifications INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    get_follower_count(p.id),
    get_following_count(p.id),
    get_view_count(p.id),
    (SELECT COUNT(*) FROM public.messages WHERE receiver_profile_id = p.id)::INTEGER,
    (SELECT COUNT(*) FROM public.links WHERE profile_id = p.id)::INTEGER,
    (SELECT COUNT(*) FROM public.products WHERE profile_id = p.id)::INTEGER,
    get_active_subscription(p.id),
    (SELECT COUNT(*) FROM public.badges WHERE profile_id = p.id)::INTEGER,
    (SELECT COUNT(*) FROM public.notifications WHERE profile_id = p.id AND is_read = FALSE)::INTEGER
  FROM public.profiles p
  WHERE p.id = p_profile_id;
END;
$$ LANGUAGE plpgsql;
