-- 15_user_preferences_controller.sql
-- User preferences management functions and triggers
-- Provides database-level control for user preference operations

-- Ensure user_preferences table has necessary triggers
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at_trigger ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at_trigger
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- Get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID, p_profile_id UUID)
RETURNS UUID AS $$
DECLARE
  v_pref_id UUID;
BEGIN
  SELECT id INTO v_pref_id FROM public.user_preferences
  WHERE user_id = p_user_id AND profile_id = p_profile_id;
  
  IF v_pref_id IS NULL THEN
    INSERT INTO public.user_preferences (user_id, profile_id)
    VALUES (p_user_id, p_profile_id)
    RETURNING id INTO v_pref_id;
  END IF;
  
  RETURN v_pref_id;
END;
$$ LANGUAGE plpgsql;

-- Get user preferences for a profile
CREATE OR REPLACE FUNCTION get_user_preferences(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  profile_id UUID,
  theme_mode TEXT,
  primary_color TEXT,
  background_color TEXT,
  store_settings JSONB,
  privacy_settings JSONB,
  notification_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.profile_id,
    up.theme_mode,
    up.primary_color,
    up.background_color,
    up.store_settings,
    up.privacy_settings,
    up.notification_settings,
    up.created_at,
    up.updated_at
  FROM public.user_preferences up
  WHERE up.profile_id = p_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Update store setting toggle (e.g., showFollowerCount, showVisitCount, etc.)
CREATE OR REPLACE FUNCTION update_store_setting(
  p_profile_id UUID,
  p_setting_key TEXT,
  p_setting_value BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.user_preferences
  SET store_settings = jsonb_set(
    COALESCE(store_settings, '{}'::jsonb),
    ARRAY[p_setting_key],
    to_jsonb(p_setting_value)
  )
  WHERE profile_id = p_profile_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Update privacy setting toggle
CREATE OR REPLACE FUNCTION update_privacy_setting(
  p_profile_id UUID,
  p_setting_key TEXT,
  p_setting_value BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.user_preferences
  SET privacy_settings = jsonb_set(
    COALESCE(privacy_settings, '{}'::jsonb),
    ARRAY[p_setting_key],
    to_jsonb(p_setting_value)
  )
  WHERE profile_id = p_profile_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Update notification setting toggle
CREATE OR REPLACE FUNCTION update_notification_setting(
  p_profile_id UUID,
  p_setting_key TEXT,
  p_setting_value BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.user_preferences
  SET notification_settings = jsonb_set(
    COALESCE(notification_settings, '{}'::jsonb),
    ARRAY[p_setting_key],
    to_jsonb(p_setting_value)
  )
  WHERE profile_id = p_profile_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Update theme and color settings
CREATE OR REPLACE FUNCTION update_theme_settings(
  p_profile_id UUID,
  p_theme_mode TEXT,
  p_primary_color TEXT,
  p_background_color TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.user_preferences
  SET 
    theme_mode = COALESCE(p_theme_mode, theme_mode),
    primary_color = COALESCE(p_primary_color, primary_color),
    background_color = COALESCE(p_background_color, background_color)
  WHERE profile_id = p_profile_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Get specific store setting value
CREATE OR REPLACE FUNCTION get_store_setting(
  p_profile_id UUID,
  p_setting_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT (store_settings -> p_setting_key)::BOOLEAN 
     FROM public.user_preferences 
     WHERE profile_id = p_profile_id),
    TRUE
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get specific privacy setting value
CREATE OR REPLACE FUNCTION get_privacy_setting(
  p_profile_id UUID,
  p_setting_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT (privacy_settings -> p_setting_key)::BOOLEAN 
     FROM public.user_preferences 
     WHERE profile_id = p_profile_id),
    TRUE
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS policy for user_preferences (already in 10_rls_policies.sql, but verify here)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_read" ON public.user_preferences;
CREATE POLICY "user_preferences_read" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_preferences.user_id);

DROP POLICY IF EXISTS "user_preferences_write" ON public.user_preferences;
CREATE POLICY "user_preferences_write" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_preferences.user_id);

DROP POLICY IF EXISTS "user_preferences_update" ON public.user_preferences;
CREATE POLICY "user_preferences_update" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_preferences.user_id)
  WITH CHECK (auth.uid() = user_preferences.user_id);

-- Verify user_preferences controller is ready
DO $$
BEGIN
  RAISE NOTICE '✅ User preferences controller functions created';
  RAISE NOTICE '   • get_or_create_user_preferences()';
  RAISE NOTICE '   • get_user_preferences()';
  RAISE NOTICE '   • update_store_setting() / get_store_setting()';
  RAISE NOTICE '   • update_privacy_setting() / get_privacy_setting()';
  RAISE NOTICE '   • update_notification_setting()';
  RAISE NOTICE '   • update_theme_settings()';
END $$;
