-- Complete Subscription System & User Preferences
-- This migration ensures all subscription features and user preferences work correctly

-- Enhance subscriptions table with all needed fields
DO $$
BEGIN
    -- Add missing columns to subscriptions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'billing_period') THEN
        ALTER TABLE public.subscriptions ADD COLUMN billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'pi_amount') THEN
        ALTER TABLE public.subscriptions ADD COLUMN pi_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'pi_transaction_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN pi_transaction_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'auto_renew') THEN
        ALTER TABLE public.subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'trial_end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'metadata') THEN
        ALTER TABLE public.subscriptions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Enhance user_preferences table with subscription-related preferences
DO $$
BEGIN
    -- Add subscription preferences if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'subscription_preferences') THEN
        ALTER TABLE public.user_preferences ADD COLUMN subscription_preferences JSONB DEFAULT '{"emailUpdates": true, "renewalReminders": true, "usageAlerts": true}';
    END IF;
    
    -- Add feature usage tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'feature_usage') THEN
        ALTER TABLE public.user_preferences ADD COLUMN feature_usage JSONB DEFAULT '{"customLinks": 0, "socialLinks": 0, "analyticsViews": 0, "adsWatched": 0}';
    END IF;
    
    -- Add plan history
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'plan_history') THEN
        ALTER TABLE public.user_preferences ADD COLUMN plan_history JSONB DEFAULT '[]';
    END IF;
END $$;

-- Create subscription management functions
CREATE OR REPLACE FUNCTION get_user_subscription_status(
    p_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_data RECORD;
    result JSON;
BEGIN
    -- Get current active subscription
    SELECT * INTO subscription_data
    FROM subscriptions
    WHERE profile_id = p_profile_id
      AND status = 'active'
      AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF subscription_data IS NULL THEN
        -- No active subscription, return free plan
        result := json_build_object(
            'plan', 'free',
            'status', 'active',
            'expires_at', NULL,
            'is_trial', false,
            'auto_renew', false,
            'features', json_build_object(
                'customLinks', 1,
                'socialLinks', 1,
                'analytics', false,
                'youtubeIntegration', false,
                'customThemes', false,
                'adFree', false,
                'apiAccess', false,
                'prioritySupport', false
            )
        );
    ELSE
        -- Return subscription details with features based on plan
        result := json_build_object(
            'plan', subscription_data.plan_type,
            'status', subscription_data.status,
            'expires_at', subscription_data.end_date,
            'is_trial', subscription_data.trial_end_date IS NOT NULL AND subscription_data.trial_end_date > NOW(),
            'auto_renew', subscription_data.auto_renew,
            'billing_period', subscription_data.billing_period,
            'pi_amount', subscription_data.pi_amount,
            'features', CASE 
                WHEN subscription_data.plan_type = 'premium' THEN json_build_object(
                    'customLinks', -1,
                    'socialLinks', -1,
                    'analytics', true,
                    'youtubeIntegration', true,
                    'customThemes', true,
                    'adFree', true,
                    'apiAccess', false,
                    'prioritySupport', true,
                    'customDomain', true,
                    'dropTokens', true
                )
                WHEN subscription_data.plan_type = 'pro' THEN json_build_object(
                    'customLinks', -1,
                    'socialLinks', -1,
                    'analytics', true,
                    'youtubeIntegration', true,
                    'customThemes', true,
                    'adFree', true,
                    'apiAccess', true,
                    'prioritySupport', true,
                    'customDomain', true,
                    'dropTokens', true,
                    'aiAnalytics', true,
                    'bulkManagement', true,
                    'whiteLabel', true,
                    'advancedExports', true
                )
                ELSE json_build_object(
                    'customLinks', 1,
                    'socialLinks', 1,
                    'analytics', false,
                    'youtubeIntegration', false,
                    'customThemes', false,
                    'adFree', false,
                    'apiAccess', false,
                    'prioritySupport', false
                )
            END
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to create or update subscription
CREATE OR REPLACE FUNCTION create_or_update_subscription(
    p_profile_id UUID,
    p_plan_type TEXT,
    p_billing_period TEXT DEFAULT 'monthly',
    p_pi_amount DECIMAL DEFAULT 0.00,
    p_pi_transaction_id TEXT DEFAULT NULL,
    p_auto_renew BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_id UUID;
    end_date TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Calculate end date based on billing period
    IF p_billing_period = 'yearly' THEN
        end_date := NOW() + INTERVAL '1 year';
    ELSE
        end_date := NOW() + INTERVAL '1 month';
    END IF;
    
    -- For free plan, set far future date
    IF p_plan_type = 'free' THEN
        end_date := NOW() + INTERVAL '100 years';
        p_pi_amount := 0.00;
    END IF;
    
    -- Cancel any existing active subscriptions
    UPDATE subscriptions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE profile_id = p_profile_id 
      AND status = 'active';
    
    -- Create new subscription
    INSERT INTO subscriptions (
        profile_id,
        plan_type,
        billing_period,
        pi_amount,
        pi_transaction_id,
        auto_renew,
        start_date,
        end_date,
        status,
        metadata
    ) VALUES (
        p_profile_id,
        p_plan_type,
        p_billing_period,
        p_pi_amount,
        p_pi_transaction_id,
        p_auto_renew,
        NOW(),
        end_date,
        'active',
        json_build_object(
            'created_via', 'api',
            'payment_method', 'pi_network',
            'upgrade_from', 'free'
        )
    ) RETURNING id INTO subscription_id;
    
    result := json_build_object(
        'success', true,
        'subscription_id', subscription_id,
        'plan_type', p_plan_type,
        'expires_at', end_date,
        'message', 'Subscription created successfully'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to create subscription: ' || SQLERRM
    );
END;
$$;

-- Function to check feature access based on subscription
CREATE OR REPLACE FUNCTION check_feature_access(
    p_profile_id UUID,
    p_feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_plan TEXT;
    has_access BOOLEAN := false;
BEGIN
    -- Get user's current plan
    SELECT plan_type INTO user_plan
    FROM subscriptions
    WHERE profile_id = p_profile_id
      AND status = 'active'
      AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Default to free if no subscription found
    user_plan := COALESCE(user_plan, 'free');
    
    -- Check feature access based on plan
    CASE p_feature_name
        WHEN 'unlimited_custom_links' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'unlimited_social_links' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'youtube_integration' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'custom_themes' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'analytics_access' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'ad_free_experience' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'custom_domain' THEN
            has_access := user_plan IN ('premium', 'pro');
        WHEN 'api_access' THEN
            has_access := user_plan = 'pro';
        WHEN 'ai_analytics' THEN
            has_access := user_plan = 'pro';
        WHEN 'bulk_management' THEN
            has_access := user_plan = 'pro';
        WHEN 'white_label' THEN
            has_access := user_plan = 'pro';
        WHEN 'priority_support' THEN
            has_access := user_plan IN ('premium', 'pro');
        ELSE
            has_access := true; -- Default to allowing basic features
    END CASE;
    
    RETURN has_access;
END;
$$;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    p_user_id UUID,
    p_profile_id UUID,
    p_preferences JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Insert or update user preferences
    INSERT INTO user_preferences (
        user_id,
        profile_id,
        theme_mode,
        primary_color,
        background_color,
        font_size,
        dashboard_layout,
        store_settings,
        social_settings,
        content_settings,
        privacy_settings,
        notification_settings,
        subscription_preferences,
        feature_usage,
        custom_data,
        updated_at
    ) VALUES (
        p_user_id,
        p_profile_id,
        COALESCE(p_preferences->>'theme_mode', 'system'),
        COALESCE(p_preferences->>'primary_color', '#3b82f6'),
        COALESCE(p_preferences->>'background_color', '#000000'),
        COALESCE(p_preferences->>'font_size', 'medium'),
        COALESCE((p_preferences->>'dashboard_layout')::JSONB, '{"sidebarCollapsed": false, "previewMode": "phone", "activeTab": "profile"}'::JSONB),
        COALESCE((p_preferences->>'store_settings')::JSONB, '{"showFollowerCount": true, "showVisitCount": true, "enableComments": true}'::JSONB),
        COALESCE((p_preferences->>'social_settings')::JSONB, '{"allowFollows": true, "showOnline": true, "enableNotifications": true}'::JSONB),
        COALESCE((p_preferences->>'content_settings')::JSONB, '{"autoSave": true, "draftsEnabled": true, "backupEnabled": true}'::JSONB),
        COALESCE((p_preferences->>'privacy_settings')::JSONB, '{"profileVisible": true, "analyticsEnabled": true, "dataCollection": true}'::JSONB),
        COALESCE((p_preferences->>'notification_settings')::JSONB, '{"email": true, "browser": true, "marketing": false}'::JSONB),
        COALESCE((p_preferences->>'subscription_preferences')::JSONB, '{"emailUpdates": true, "renewalReminders": true, "usageAlerts": true}'::JSONB),
        COALESCE((p_preferences->>'feature_usage')::JSONB, '{"customLinks": 0, "socialLinks": 0, "analyticsViews": 0, "adsWatched": 0}'::JSONB),
        COALESCE((p_preferences->>'custom_data')::JSONB, '{}'::JSONB),
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        theme_mode = COALESCE(EXCLUDED.theme_mode, user_preferences.theme_mode),
        primary_color = COALESCE(EXCLUDED.primary_color, user_preferences.primary_color),
        background_color = COALESCE(EXCLUDED.background_color, user_preferences.background_color),
        font_size = COALESCE(EXCLUDED.font_size, user_preferences.font_size),
        dashboard_layout = COALESCE(EXCLUDED.dashboard_layout, user_preferences.dashboard_layout),
        store_settings = COALESCE(EXCLUDED.store_settings, user_preferences.store_settings),
        social_settings = COALESCE(EXCLUDED.social_settings, user_preferences.social_settings),
        content_settings = COALESCE(EXCLUDED.content_settings, user_preferences.content_settings),
        privacy_settings = COALESCE(EXCLUDED.privacy_settings, user_preferences.privacy_settings),
        notification_settings = COALESCE(EXCLUDED.notification_settings, user_preferences.notification_settings),
        subscription_preferences = COALESCE(EXCLUDED.subscription_preferences, user_preferences.subscription_preferences),
        feature_usage = COALESCE(EXCLUDED.feature_usage, user_preferences.feature_usage),
        custom_data = COALESCE(EXCLUDED.custom_data, user_preferences.custom_data),
        updated_at = NOW();
    
    result := json_build_object(
        'success', true,
        'message', 'User preferences updated successfully'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to update preferences: ' || SQLERRM
    );
END;
$$;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prefs RECORD;
    result JSON;
BEGIN
    SELECT * INTO prefs 
    FROM user_preferences 
    WHERE user_id = p_user_id;
    
    IF prefs IS NULL THEN
        -- Return default preferences if none exist
        result := json_build_object(
            'theme_mode', 'system',
            'primary_color', '#3b82f6',
            'background_color', '#000000',
            'font_size', 'medium',
            'dashboard_layout', json_build_object('sidebarCollapsed', false, 'previewMode', 'phone', 'activeTab', 'profile'),
            'store_settings', json_build_object('showFollowerCount', true, 'showVisitCount', true, 'enableComments', true),
            'social_settings', json_build_object('allowFollows', true, 'showOnline', true, 'enableNotifications', true),
            'content_settings', json_build_object('autoSave', true, 'draftsEnabled', true, 'backupEnabled', true),
            'privacy_settings', json_build_object('profileVisible', true, 'analyticsEnabled', true, 'dataCollection', true),
            'notification_settings', json_build_object('email', true, 'browser', true, 'marketing', false),
            'subscription_preferences', json_build_object('emailUpdates', true, 'renewalReminders', true, 'usageAlerts', true),
            'feature_usage', json_build_object('customLinks', 0, 'socialLinks', 0, 'analyticsViews', 0, 'adsWatched', 0)
        );
    ELSE
        result := json_build_object(
            'theme_mode', prefs.theme_mode,
            'primary_color', prefs.primary_color,
            'background_color', prefs.background_color,
            'font_size', prefs.font_size,
            'dashboard_layout', prefs.dashboard_layout,
            'store_settings', prefs.store_settings,
            'social_settings', prefs.social_settings,
            'content_settings', prefs.content_settings,
            'privacy_settings', prefs.privacy_settings,
            'notification_settings', prefs.notification_settings,
            'subscription_preferences', prefs.subscription_preferences,
            'feature_usage', prefs.feature_usage,
            'custom_data', prefs.custom_data
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_profile_id UUID,
    p_feature_name TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update feature usage counter
    UPDATE user_preferences 
    SET feature_usage = jsonb_set(
        COALESCE(feature_usage, '{}'::jsonb),
        ARRAY[p_feature_name],
        (COALESCE((feature_usage->>p_feature_name)::INTEGER, 0) + p_increment)::text::jsonb
    ),
    updated_at = NOW()
    WHERE profile_id = p_profile_id;
    
    -- If no row updated, user doesn't have preferences yet, so create them
    IF NOT FOUND THEN
        INSERT INTO user_preferences (profile_id, feature_usage)
        VALUES (p_profile_id, json_build_object(p_feature_name, p_increment)::jsonb)
        ON CONFLICT (profile_id) DO UPDATE SET
        feature_usage = jsonb_set(
            COALESCE(user_preferences.feature_usage, '{}'::jsonb),
            ARRAY[p_feature_name],
            (COALESCE((user_preferences.feature_usage->>p_feature_name)::INTEGER, 0) + p_increment)::text::jsonb
        );
    END IF;
END;
$$;

-- Add subscription status to profiles view
CREATE OR REPLACE VIEW profile_with_subscription AS
SELECT 
    p.*,
    s.plan_type,
    s.status as subscription_status,
    s.end_date as subscription_end_date,
    s.auto_renew,
    up.theme_mode as preferred_theme,
    up.feature_usage
FROM profiles p
LEFT JOIN subscriptions s ON s.profile_id = p.id 
    AND s.status = 'active' 
    AND s.end_date > NOW()
LEFT JOIN user_preferences up ON up.profile_id = p.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_status ON subscriptions(profile_id, status, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON user_preferences(profile_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_update_subscription(UUID, TEXT, TEXT, DECIMAL, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_preferences(UUID, UUID, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_feature_usage(UUID, TEXT, INTEGER) TO authenticated;

GRANT SELECT ON profile_with_subscription TO authenticated;
GRANT SELECT ON profile_with_subscription TO anon;

-- Add RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Add helpful comments
COMMENT ON FUNCTION get_user_subscription_status IS 'Get complete subscription status and feature access for a user';
COMMENT ON FUNCTION create_or_update_subscription IS 'Create or update user subscription with Pi Network payment';
COMMENT ON FUNCTION check_feature_access IS 'Check if user has access to specific premium features';
COMMENT ON FUNCTION update_user_preferences IS 'Update all user preferences with auto-save functionality';
COMMENT ON FUNCTION get_user_preferences IS 'Retrieve all user preferences with defaults';
COMMENT ON FUNCTION track_feature_usage IS 'Track usage of premium features for analytics';

-- Final verification
SELECT 'Complete Subscription System & User Preferences installed successfully! 🚀' AS status;