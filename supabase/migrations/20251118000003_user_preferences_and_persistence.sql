-- Enhanced Database Schema for User Preferences and Data Persistence
-- This migration adds comprehensive user preference storage that survives app updates

-- Create user_preferences table for persistent settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- App preferences
    theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
    primary_color TEXT DEFAULT '#3b82f6',
    background_color TEXT DEFAULT '#000000',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    
    -- Dashboard layout preferences
    dashboard_layout JSONB DEFAULT '{"sidebarCollapsed": false, "previewMode": "phone", "activeTab": "profile"}',
    
    -- Store preferences
    store_settings JSONB DEFAULT '{"showFollowerCount": true, "showVisitCount": true, "enableComments": true}',
    
    -- Social preferences  
    social_settings JSONB DEFAULT '{"allowFollows": true, "showOnline": true, "enableNotifications": true}',
    
    -- Content preferences
    content_settings JSONB DEFAULT '{"autoSave": true, "draftsEnabled": true, "backupEnabled": true}',
    
    -- Privacy settings
    privacy_settings JSONB DEFAULT '{"profileVisible": true, "analyticsEnabled": true, "dataCollection": true}',
    
    -- Notification preferences
    notification_settings JSONB DEFAULT '{"email": true, "browser": true, "marketing": false}',
    
    -- Feature flags and experiment participation
    feature_flags JSONB DEFAULT '{}',
    experiments JSONB DEFAULT '{}',
    
    -- App usage data (non-PII)
    usage_data JSONB DEFAULT '{"lastActive": null, "totalSessions": 0, "favoriteFeatures": []}',
    
    -- Custom user data
    custom_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON public.user_preferences(profile_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Enhanced profiles table with additional persistence fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_app_version TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_install_date TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feature_tour_completed JSONB DEFAULT '{}';

-- App version tracking table
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_number TEXT NOT NULL UNIQUE,
    release_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    features JSONB DEFAULT '[]',
    breaking_changes JSONB DEFAULT '[]',
    migration_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert current version
INSERT INTO public.app_versions (version_number, features, is_active) VALUES 
('1.0.0', '["Pi Network Integration", "Supabase Database", "User Profiles", "Analytics", "Social Features"]', true)
ON CONFLICT (version_number) DO NOTHING;

-- User sessions table for better session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_end TIMESTAMP WITH TIME ZONE,
    auth_method TEXT CHECK (auth_method IN ('pi_network', 'email', 'google')),
    device_info JSONB DEFAULT '{}',
    app_version TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_id ON public.user_sessions(profile_id);

-- Enhanced analytics with user journey tracking
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{}';
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.user_sessions(id);

-- User feedback and feature requests table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback_type TEXT CHECK (feedback_type IN ('bug', 'feature_request', 'improvement', 'compliment')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'completed', 'rejected')),
    votes INTEGER DEFAULT 0,
    admin_response TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature roadmap table (public visible)
CREATE TABLE IF NOT EXISTS public.feature_roadmap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'planned' CHECK (status IN ('idea', 'planned', 'in_development', 'testing', 'released')),
    target_quarter TEXT, -- e.g., 'Q1 2025'
    estimated_completion DATE,
    pi_earnings_potential TEXT, -- How this feature helps users earn Pi
    user_votes INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some example roadmap features
INSERT INTO public.feature_roadmap (title, description, category, status, pi_earnings_potential, is_public, tags) VALUES 
('Pi Network Marketplace Integration', 'Direct integration with Pi Network marketplace for selling products', 'commerce', 'planned', 'Earn Pi by selling products directly through your Droplink store', true, '{"pi-network", "commerce", "earnings"}'),
('Advanced Analytics Dashboard', 'Detailed analytics with revenue tracking and customer insights', 'analytics', 'in_development', 'Optimize your store performance to increase Pi earnings', true, '{"analytics", "insights", "optimization"}'),
('Social Commerce Features', 'Group buying, affiliate marketing, and social selling tools', 'social', 'planned', 'Earn commissions and bonuses through social selling', true, '{"social", "affiliate", "earning"}'),
('Pi Wallet Integration', 'Direct Pi wallet connection for seamless transactions', 'payments', 'planned', 'Accept Pi payments directly in your store', true, '{"pi-network", "payments", "wallet"}'),
('Creator Monetization Tools', 'Tools for content creators to monetize their audience', 'monetization', 'idea', 'New revenue streams for content creators using Pi Network', true, '{"creators", "monetization", "content"}')
ON CONFLICT DO NOTHING;

-- User achievements and gamification
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    category TEXT DEFAULT 'general',
    points INTEGER DEFAULT 0,
    pi_bonus DECIMAL(10,8) DEFAULT 0, -- Potential Pi rewards
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_feedback
CREATE POLICY "Users can view own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for roadmap and app versions
CREATE POLICY "Everyone can view roadmap" ON public.feature_roadmap
    FOR SELECT USING (is_public = true);

CREATE POLICY "Everyone can view app versions" ON public.app_versions
    FOR SELECT USING (true);

-- RLS Policies for user_achievements  
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default preferences when a new profile is created
    INSERT INTO public.user_preferences (
        user_id, 
        profile_id,
        dashboard_layout,
        store_settings,
        social_settings,
        content_settings,
        privacy_settings,
        notification_settings
    ) VALUES (
        NEW.user_id,
        NEW.id,
        '{"sidebarCollapsed": false, "previewMode": "phone", "activeTab": "profile"}',
        '{"showFollowerCount": true, "showVisitCount": true, "enableComments": true}',
        '{"allowFollows": true, "showOnline": true, "enableNotifications": true}',
        '{"autoSave": true, "draftsEnabled": true, "backupEnabled": true}',
        '{"profileVisible": true, "analyticsEnabled": true, "dataCollection": true}',
        '{"email": true, "browser": true, "marketing": false}'
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preferences for new profiles
CREATE TRIGGER trigger_create_default_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_preferences();

-- Function to track user login
CREATE OR REPLACE FUNCTION track_user_login(user_uuid UUID, auth_method_param TEXT DEFAULT 'unknown')
RETURNS UUID AS $$
DECLARE
    session_uuid UUID;
    profile_record RECORD;
BEGIN
    -- Get user's profile
    SELECT * INTO profile_record FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
    
    IF profile_record.id IS NOT NULL THEN
        -- Update profile login stats
        UPDATE public.profiles 
        SET total_logins = COALESCE(total_logins, 0) + 1,
            last_login = now(),
            last_app_version = '1.0.0'
        WHERE user_id = user_uuid;
        
        -- Create session record
        INSERT INTO public.user_sessions (
            user_id, 
            profile_id, 
            auth_method, 
            app_version
        ) VALUES (
            user_uuid,
            profile_record.id,
            auth_method_param,
            '1.0.0'
        ) RETURNING id INTO session_uuid;
    END IF;
    
    RETURN session_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.user_preferences IS 'Stores all user preferences and settings that persist across app updates and sign-outs';
COMMENT ON TABLE public.user_sessions IS 'Tracks user login sessions for analytics and security';
COMMENT ON TABLE public.feature_roadmap IS 'Public roadmap of planned features and Pi earning opportunities';
COMMENT ON TABLE public.user_feedback IS 'User feedback, feature requests, and bug reports';
COMMENT ON TABLE public.user_achievements IS 'User achievements and gamification elements';

-- Create view for user dashboard data
CREATE OR REPLACE VIEW public.user_dashboard_data AS
SELECT 
    p.id as profile_id,
    p.username,
    p.business_name,
    p.total_logins,
    p.last_login,
    p.onboarding_completed,
    up.theme_mode,
    up.dashboard_layout,
    up.store_settings,
    up.usage_data,
    COUNT(DISTINCT f.id) as followers_count,
    COUNT(DISTINCT a.id) as analytics_count,
    COUNT(DISTINCT ua.id) as achievements_count
FROM public.profiles p
LEFT JOIN public.user_preferences up ON up.profile_id = p.id
LEFT JOIN public.followers f ON f.following_profile_id = p.id
LEFT JOIN public.analytics a ON a.profile_id = p.id
LEFT JOIN public.user_achievements ua ON ua.profile_id = p.id
GROUP BY p.id, p.username, p.business_name, p.total_logins, p.last_login, p.onboarding_completed,
         up.theme_mode, up.dashboard_layout, up.store_settings, up.usage_data;