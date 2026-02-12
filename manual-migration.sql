-- User Preferences and Persistence System Migration
-- Execute this in Supabase SQL Editor

-- 1. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Theme and Appearance
  theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  primary_color TEXT DEFAULT '#3b82f6',
  background_color TEXT DEFAULT '#000000',
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  
  -- Dashboard Layout
  dashboard_layout JSONB DEFAULT '{
    "sidebarCollapsed": false,
    "previewMode": "phone",
    "activeTab": "profile"
  }'::jsonb,
  
  -- Store Settings
  store_settings JSONB DEFAULT '{
    "showFollowerCount": true,
    "showVisitCount": true,
    "enableComments": true,
    "allowGifts": true,
    "showSocialLinks": true
  }'::jsonb,
  
  -- Social Settings
  social_settings JSONB DEFAULT '{
    "allowFollows": true,
    "showOnline": true,
    "enableNotifications": true,
    "allowMessages": true
  }'::jsonb,
  
  -- Content Settings
  content_settings JSONB DEFAULT '{
    "autoSave": true,
    "draftsEnabled": true,
    "backupEnabled": true,
    "autoPublish": false
  }'::jsonb,
  
  -- Privacy Settings
  privacy_settings JSONB DEFAULT '{
    "profileVisible": true,
    "analyticsEnabled": true,
    "dataCollection": true,
    "showInSearch": true
  }'::jsonb,
  
  -- Notification Settings
  notification_settings JSONB DEFAULT '{
    "email": true,
    "browser": true,
    "marketing": false,
    "follows": true,
    "comments": true
  }'::jsonb,
  
  -- Feature Flags and Experiments
  feature_flags JSONB DEFAULT '{}'::jsonb,
  experiments JSONB DEFAULT '{}'::jsonb,
  
  -- Usage Data
  usage_data JSONB DEFAULT '{
    "lastActive": null,
    "totalSessions": 0,
    "favoriteFeatures": []
  }'::jsonb,
  
  -- Custom Data
  custom_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 2. Create user_sessions table for tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  device_info JSONB DEFAULT '{}'::jsonb,
  browser_info JSONB DEFAULT '{}'::jsonb,
  location_info JSONB DEFAULT '{}'::jsonb,
  
  pages_visited TEXT[] DEFAULT ARRAY[]::TEXT[],
  features_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  pi_earned DECIMAL(10,4) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create feature_roadmap table
CREATE TABLE IF NOT EXISTS feature_roadmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_development', 'testing', 'coming_soon', 'released')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  estimated_release DATE,
  actual_release DATE,
  
  pi_earning_potential INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  requirements JSONB DEFAULT '{}'::jsonb,
  technical_notes JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('bug', 'feature', 'improvement', 'general')),
  title TEXT NOT NULL,
  description TEXT,
  
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'completed', 'rejected')),
  
  feature_id UUID REFERENCES feature_roadmap(id) ON DELETE SET NULL,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  admin_response TEXT,
  admin_response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  
  pi_reward DECIMAL(10,4) DEFAULT 0,
  unlock_date TIMESTAMPTZ DEFAULT NOW(),
  
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  version_number TEXT NOT NULL UNIQUE,
  release_date DATE DEFAULT CURRENT_DATE,
  
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  bug_fixes TEXT[] DEFAULT ARRAY[]::TEXT[],
  breaking_changes TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  migration_notes TEXT,
  rollback_notes TEXT,
  
  is_current BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for feature_roadmap (public read, admin write)
CREATE POLICY "Anyone can view roadmap" ON feature_roadmap FOR SELECT TO PUBLIC USING (true);

-- RLS Policies for user_feedback
CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON user_feedback FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for app_versions (public read)
CREATE POLICY "Anyone can view app versions" ON app_versions FOR SELECT TO PUBLIC USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_feature_roadmap_status ON feature_roadmap(status);
CREATE INDEX IF NOT EXISTS idx_feature_roadmap_priority ON feature_roadmap(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, profile_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when profile is created
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON profiles;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

-- Function to track user login sessions
CREATE OR REPLACE FUNCTION track_user_login(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_sessions (user_id, profile_id)
  SELECT user_uuid, id FROM profiles WHERE user_id = user_uuid
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session end time
CREATE OR REPLACE FUNCTION end_user_session(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions
  SET session_end = NOW(),
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - session_start))::INTEGER
  WHERE id = session_uuid AND session_end IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for dashboard data
CREATE OR REPLACE VIEW dashboard_user_data AS
SELECT
  p.id as profile_id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.store_url,
  p.pi_wallet_address,
  up.theme_mode,
  up.dashboard_layout,
  up.store_settings,
  up.privacy_settings,
  (SELECT COUNT(*) FROM user_sessions WHERE user_id = p.user_id) as total_sessions,
  (SELECT SUM(pi_earned) FROM user_sessions WHERE user_id = p.user_id) as total_pi_earned,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.user_id) as achievement_count,
  (SELECT COUNT(*) FROM followers WHERE following_profile_id = p.id) as followers_count,
  (SELECT COUNT(*) FROM followers WHERE follower_profile_id = p.id) as following_count
FROM profiles p
LEFT JOIN user_preferences up ON p.user_id = up.user_id;

-- Insert some sample roadmap features
INSERT INTO feature_roadmap (title, description, status, priority, estimated_release, pi_earning_potential, category, progress_percentage)
VALUES
  ('Advanced AI Content Generation', 'AI-powered bio content creation and optimization with personalized suggestions', 'in_development', 'high', '2024-12-15', 50, 'AI & Automation', 75),
  ('NFT Marketplace Integration', 'Display and sell NFTs directly from your bio page with Pi Network payments', 'planned', 'medium', '2025-01-30', 100, 'Web3 & Crypto', 25),
  ('Multi-language Support', 'Full internationalization with 20+ languages supported', 'planned', 'medium', '2024-12-30', 25, 'Accessibility', 40),
  ('Mobile App Release', 'Native iOS and Android apps with offline capabilities', 'testing', 'critical', '2025-02-01', 150, 'Mobile', 90),
  ('Enterprise Team Features', 'Team collaboration, white-label options, and advanced analytics', 'planned', 'high', '2025-03-15', 200, 'Business', 15),
  ('Cross-chain Crypto Support', 'Accept payments in Bitcoin, Ethereum, and other major cryptocurrencies', 'planned', 'medium', '2025-04-01', 75, 'Web3 & Crypto', 5)
ON CONFLICT DO NOTHING;

-- Insert current app version
INSERT INTO app_versions (version_number, features, is_current)
VALUES ('2.1.0', ARRAY[
  'User Preferences System',
  'About Modal with App Information', 
  'Professional Homepage',
  'Future Features Dashboard',
  'Comprehensive Database Schema'
], true)
ON CONFLICT (version_number) DO UPDATE SET is_current = true;

-- Set other versions to not current
UPDATE app_versions SET is_current = false WHERE version_number != '2.1.0';

COMMENT ON TABLE user_preferences IS 'Stores user preferences and settings that persist across sessions and app updates';
COMMENT ON TABLE user_sessions IS 'Tracks user session data for analytics and Pi earning calculations';
COMMENT ON TABLE feature_roadmap IS 'Public roadmap of planned features with Pi earning potential';
COMMENT ON TABLE user_feedback IS 'User feedback and feature requests';
COMMENT ON TABLE user_achievements IS 'User achievements and Pi rewards';
COMMENT ON TABLE app_versions IS 'App version tracking for migration and rollback support';