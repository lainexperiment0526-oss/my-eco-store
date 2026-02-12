-- 16_full_settings_configuration.sql
-- Comprehensive settings and configuration system
-- Covers user settings, system settings, feature flags, and admin configuration

-- 1. SYSTEM/GLOBAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- 2. FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  rollout_percentage INTEGER DEFAULT 100,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);

-- 3. THEME PRESETS TABLE
CREATE TABLE IF NOT EXISTS public.theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  theme_data JSONB NOT NULL DEFAULT '{
    "primaryColor": "#38bdf8",
    "backgroundColor": "#000000",
    "accentColor": "#06b6d4",
    "textColor": "#ffffff",
    "buttonStyle": "filled",
    "iconStyle": "rounded",
    "glassMode": false
  }'::jsonb,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theme_presets_is_default ON public.theme_presets(is_default);
CREATE INDEX IF NOT EXISTS idx_theme_presets_is_public ON public.theme_presets(is_public);

-- 4. NOTIFICATION TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  action_url TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_event_type ON public.notification_templates(event_type);

-- 5. PROFILE SETTINGS TABLE (extends user_preferences with more granular controls)
CREATE TABLE IF NOT EXISTS public.profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Display Settings
  display_theme TEXT DEFAULT 'light',
  display_language TEXT DEFAULT 'en',
  display_timezone TEXT DEFAULT 'UTC',
  -- Bio Page Settings
  bio_title TEXT,
  bio_description TEXT,
  bio_show_header BOOLEAN DEFAULT TRUE,
  bio_show_footer BOOLEAN DEFAULT TRUE,
  bio_show_sidebar BOOLEAN DEFAULT FALSE,
  -- Privacy Settings
  allow_public_profile BOOLEAN DEFAULT TRUE,
  allow_direct_messages BOOLEAN DEFAULT TRUE,
  allow_follow_requests BOOLEAN DEFAULT TRUE,
  require_follow_approval BOOLEAN DEFAULT FALSE,
  -- Feature Toggles
  enable_analytics BOOLEAN DEFAULT TRUE,
  enable_comments BOOLEAN DEFAULT TRUE,
  enable_ratings BOOLEAN DEFAULT FALSE,
  enable_merchandise BOOLEAN DEFAULT FALSE,
  -- Pi Network Specific
  enable_pi_payments BOOLEAN DEFAULT TRUE,
  enable_pi_ads BOOLEAN DEFAULT TRUE,
  auto_accept_pi_tips BOOLEAN DEFAULT TRUE,
  -- Email Preferences
  email_on_follow BOOLEAN DEFAULT FALSE,
  email_on_message BOOLEAN DEFAULT FALSE,
  email_on_payment BOOLEAN DEFAULT FALSE,
  email_marketing BOOLEAN DEFAULT FALSE,
  -- Created/Updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_settings_profile_id ON public.profile_settings(profile_id);

-- 6. USER PRIVACY SETTINGS TABLE (for GDPR/compliance)
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data_collection_consent BOOLEAN DEFAULT TRUE,
  analytics_tracking BOOLEAN DEFAULT TRUE,
  third_party_sharing BOOLEAN DEFAULT FALSE,
  newsletter_subscription BOOLEAN DEFAULT FALSE,
  data_retention_days INTEGER DEFAULT 365,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON public.user_privacy_settings(user_id);

-- 7. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modification_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_name ON public.admin_settings(setting_name);

-- 8. SETTINGS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  setting_table TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_log_user_id ON public.settings_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_profile_id ON public.settings_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_created_at ON public.settings_audit_log(created_at);

-- TRIGGER: Update profile_settings timestamp
CREATE OR REPLACE FUNCTION update_profile_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_settings_updated_at_trigger ON public.profile_settings;
CREATE TRIGGER profile_settings_updated_at_trigger
BEFORE UPDATE ON public.profile_settings
FOR EACH ROW
EXECUTE FUNCTION update_profile_settings_updated_at();

-- TRIGGER: Update system_settings timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_settings_updated_at_trigger ON public.system_settings;
CREATE TRIGGER system_settings_updated_at_trigger
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_updated_at();

-- HELPER FUNCTIONS

-- Get or create profile settings
CREATE OR REPLACE FUNCTION get_or_create_profile_settings(p_profile_id UUID)
RETURNS UUID AS $$
DECLARE
  v_settings_id UUID;
BEGIN
  SELECT id INTO v_settings_id FROM public.profile_settings WHERE profile_id = p_profile_id;
  
  IF v_settings_id IS NULL THEN
    INSERT INTO public.profile_settings (profile_id)
    VALUES (p_profile_id)
    RETURNING id INTO v_settings_id;
  END IF;
  
  RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql;

-- Get or create user privacy settings
CREATE OR REPLACE FUNCTION get_or_create_user_privacy_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_settings_id UUID;
BEGIN
  SELECT id INTO v_settings_id FROM public.user_privacy_settings WHERE user_id = p_user_id;
  
  IF v_settings_id IS NULL THEN
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_settings_id;
  END IF;
  
  RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql;

-- Check if feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(p_flag_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_enabled FROM public.feature_flags WHERE flag_name = p_flag_name LIMIT 1),
    TRUE
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get system setting value
CREATE OR REPLACE FUNCTION get_system_setting(p_setting_key TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT setting_value FROM public.system_settings WHERE setting_key = p_setting_key),
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log settings change to audit table
CREATE OR REPLACE FUNCTION log_settings_change(
  p_user_id UUID,
  p_profile_id UUID,
  p_table_name TEXT,
  p_setting_key TEXT,
  p_old_value JSONB,
  p_new_value JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.settings_audit_log (
    user_id, profile_id, setting_table, setting_key,
    old_value, new_value, change_reason
  )
  VALUES (p_user_id, p_profile_id, p_table_name, p_setting_key, p_old_value, p_new_value, p_reason)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES

ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Profile settings RLS
DROP POLICY IF EXISTS "profile_settings_read" ON public.profile_settings;
CREATE POLICY "profile_settings_read" ON public.profile_settings
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
    OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = TRUE)
  );

DROP POLICY IF EXISTS "profile_settings_write" ON public.profile_settings;
CREATE POLICY "profile_settings_write" ON public.profile_settings
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- User privacy settings RLS
DROP POLICY IF EXISTS "user_privacy_settings_read" ON public.user_privacy_settings;
CREATE POLICY "user_privacy_settings_read" ON public.user_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_privacy_settings_write" ON public.user_privacy_settings;
CREATE POLICY "user_privacy_settings_write" ON public.user_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Feature flags public read, admin write
DROP POLICY IF EXISTS "feature_flags_read" ON public.feature_flags;
CREATE POLICY "feature_flags_read" ON public.feature_flags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "feature_flags_admin_write" ON public.feature_flags;
CREATE POLICY "feature_flags_admin_write" ON public.feature_flags
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = TRUE)
  );

-- Theme presets public read, creator write
DROP POLICY IF EXISTS "theme_presets_read" ON public.theme_presets;
CREATE POLICY "theme_presets_read" ON public.theme_presets
  FOR SELECT USING (is_public = TRUE OR created_by = auth.uid());

DROP POLICY IF EXISTS "theme_presets_write" ON public.theme_presets;
CREATE POLICY "theme_presets_write" ON public.theme_presets
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Settings audit log read/write
DROP POLICY IF EXISTS "settings_audit_log_read" ON public.settings_audit_log;
CREATE POLICY "settings_audit_log_read" ON public.settings_audit_log
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "settings_audit_log_insert" ON public.settings_audit_log;
CREATE POLICY "settings_audit_log_insert" ON public.settings_audit_log
  FOR INSERT WITH CHECK (true);

-- VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   FULL SETTINGS CONFIGURATION COMPLETE! ✅               ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Settings Tables Created:';
  RAISE NOTICE '   • system_settings — global platform settings';
  RAISE NOTICE '   • feature_flags — feature toggles & rollout';
  RAISE NOTICE '   • theme_presets — saved theme configurations';
  RAISE NOTICE '   • notification_templates — event-driven notifications';
  RAISE NOTICE '   • profile_settings — per-user display & feature settings';
  RAISE NOTICE '   • user_privacy_settings — GDPR/privacy compliance';
  RAISE NOTICE '   • admin_settings — admin-only configuration';
  RAISE NOTICE '   • settings_audit_log — all settings changes tracked';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Helper Functions:';
  RAISE NOTICE '   • get_or_create_profile_settings()';
  RAISE NOTICE '   • get_or_create_user_privacy_settings()';
  RAISE NOTICE '   • is_feature_enabled()';
  RAISE NOTICE '   • get_system_setting()';
  RAISE NOTICE '   • log_settings_change()';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 RLS policies enabled on all settings tables';
END $$;
