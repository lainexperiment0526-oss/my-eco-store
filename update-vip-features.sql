-- ============================================
-- UPDATE VIP FEATURES - UNLOCK ALL PREMIUM FEATURES
-- ============================================
-- This script unlocks VIP features for premium users including:
-- 1. Theme customization access
-- 2. VIP badge with gold border
-- 3. All premium plan features
-- 4. Custom themes and styling
-- ============================================

-- ============================================
-- SECTION 1: ADD VIP/PREMIUM COLUMNS
-- ============================================

-- Add has_premium column to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_premium BOOLEAN DEFAULT false;

-- Add vip_badge_enabled column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_badge_enabled BOOLEAN DEFAULT false;

-- Add vip_border_color column for gold border
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_border_color TEXT DEFAULT '#FFD700';

-- Add premium_expires_at for tracking subscription
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- Add premium_tier column (basic, premium, pro)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT 'free' 
CHECK (premium_tier IN ('free', 'basic', 'premium', 'pro', 'vip'));

-- Add features_enabled column for feature flags
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"all": true}';

COMMENT ON COLUMN profiles.has_premium IS 'User has active premium subscription';
COMMENT ON COLUMN profiles.vip_badge_enabled IS 'Shows VIP badge in search results and profile';
COMMENT ON COLUMN profiles.vip_border_color IS 'Border color for VIP badge (default gold #FFD700)';
COMMENT ON COLUMN profiles.premium_tier IS 'Premium tier: free, basic, premium, pro, vip';
COMMENT ON COLUMN profiles.features_enabled IS 'JSONB storage for enabled features and feature flags';

-- ============================================
-- SECTION 2: UPDATE SUBSCRIPTION FEATURES
-- ============================================

-- Drop and recreate the get_user_subscription_status function with VIP features
CREATE OR REPLACE FUNCTION get_user_subscription_status(
    p_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data RECORD;
    subscription_data RECORD;
    result JSON;
BEGIN
    -- Get profile data with premium status
    SELECT * INTO profile_data
    FROM profiles
    WHERE id = p_profile_id;
    
    -- Get current active subscription
    SELECT * INTO subscription_data
    FROM subscriptions
    WHERE profile_id = p_profile_id
      AND status = 'active'
      AND end_date > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Build result based on profile premium status and subscription
    IF profile_data.has_premium = true OR subscription_data IS NOT NULL THEN
        -- Return premium/VIP subscription details with all features unlocked
        result := json_build_object(
            'plan', COALESCE(profile_data.premium_tier, subscription_data.plan_type, 'premium'),
            'status', 'active',
            'expires_at', COALESCE(profile_data.premium_expires_at, subscription_data.end_date, NOW() + INTERVAL '100 years'),
            'is_trial', false,
            'auto_renew', COALESCE(subscription_data.auto_renew, true),
            'billing_period', COALESCE(subscription_data.billing_period, 'lifetime'),
            'has_premium', true,
            'vip_badge_enabled', COALESCE(profile_data.vip_badge_enabled, true),
            'vip_border_color', COALESCE(profile_data.vip_border_color, '#FFD700'),
            'features', json_build_object(
                -- Unlimited features
                'customLinks', -1,
                'socialLinks', -1,
                
                -- Theme & Customization (UNLOCKED)
                'customThemes', true,
                'themeCustomization', true,
                'customCSS', true,
                'backgroundImages', true,
                'gradientBackgrounds', true,
                'customFonts', true,
                
                -- VIP Badge & Styling (UNLOCKED)
                'vipBadge', true,
                'goldBorder', true,
                'customBorderColor', true,
                'profileHighlight', true,
                
                -- Analytics & Insights
                'analytics', true,
                'detailedAnalytics', true,
                'aiAnalytics', true,
                'exportAnalytics', true,
                
                -- Integrations
                'youtubeIntegration', true,
                'apiAccess', true,
                'webhooks', true,
                
                -- Advanced Features
                'adFree', true,
                'prioritySupport', true,
                'customDomain', true,
                'dropTokens', true,
                'bulkManagement', true,
                'whiteLabel', true,
                'advancedExports', true,
                'customBranding', true,
                
                -- AI Features
                'aiChat', true,
                'aiSuggestions', true,
                'aiContentGeneration', true
            )
        );
    ELSE
        -- Return free plan with limited features
        result := json_build_object(
            'plan', 'free',
            'status', 'active',
            'expires_at', NULL,
            'is_trial', false,
            'auto_renew', false,
            'has_premium', false,
            'vip_badge_enabled', false,
            'vip_border_color', NULL,
            'features', json_build_object(
                'customLinks', 1,
                'socialLinks', 1,
                'customThemes', false,
                'themeCustomization', false,
                'vipBadge', false,
                'goldBorder', false,
                'analytics', false,
                'youtubeIntegration', false,
                'adFree', false,
                'apiAccess', false,
                'prioritySupport', false
            )
        );
    END IF;
    
    RETURN result;
END;
$$;

-- ============================================
-- SECTION 3: GRANT VIP ACCESS TO ALL USERS (DEV MODE)
-- ============================================

-- For development/testing: Grant premium access to ALL users
-- Comment out these lines in production!
UPDATE public.profiles
SET 
    has_premium = true,
    vip_badge_enabled = true,
    vip_border_color = '#FFD700',
    premium_tier = 'vip',
    premium_expires_at = NOW() + INTERVAL '100 years',
    features_enabled = jsonb_build_object(
        'all', true,
        'customThemes', true,
        'vipBadge', true,
        'goldBorder', true,
        'analytics', true,
        'customDomain', true
    )
WHERE has_premium IS NULL OR has_premium = false;

-- ============================================
-- SECTION 4: CREATE VIP HELPER FUNCTIONS
-- ============================================

-- Function to check if user has VIP access
CREATE OR REPLACE FUNCTION has_vip_access(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_vip BOOLEAN;
BEGIN
    SELECT 
        has_premium = true AND 
        (premium_expires_at IS NULL OR premium_expires_at > NOW())
    INTO is_vip
    FROM profiles
    WHERE id = p_profile_id;
    
    RETURN COALESCE(is_vip, false);
END;
$$;

-- Function to grant VIP access to a user
CREATE OR REPLACE FUNCTION grant_vip_access(
    p_profile_id UUID,
    p_duration INTERVAL DEFAULT '1 year',
    p_tier TEXT DEFAULT 'premium',
    p_border_color TEXT DEFAULT '#FFD700'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET 
        has_premium = true,
        vip_badge_enabled = true,
        vip_border_color = p_border_color,
        premium_tier = p_tier,
        premium_expires_at = NOW() + p_duration,
        features_enabled = jsonb_build_object(
            'all', true,
            'customThemes', true,
            'vipBadge', true,
            'goldBorder', true
        )
    WHERE id = p_profile_id;
    
    RETURN FOUND;
END;
$$;

-- Function to revoke VIP access
CREATE OR REPLACE FUNCTION revoke_vip_access(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET 
        has_premium = false,
        vip_badge_enabled = false,
        premium_tier = 'free',
        premium_expires_at = NULL
    WHERE id = p_profile_id;
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- SECTION 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_has_premium ON profiles(has_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_tier ON profiles(premium_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires ON profiles(premium_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_vip_badge ON profiles(vip_badge_enabled);

-- ============================================
-- SECTION 6: CREATE VIEW FOR VIP USERS
-- ============================================

-- Create a view to easily query VIP users
CREATE OR REPLACE VIEW vip_users AS
SELECT 
    p.id,
    p.username,
    p.email,
    p.display_name,
    p.has_premium,
    p.vip_badge_enabled,
    p.vip_border_color,
    p.premium_tier,
    p.premium_expires_at,
    p.theme_settings,
    p.features_enabled,
    p.created_at,
    CASE 
        WHEN p.premium_expires_at IS NULL THEN true
        WHEN p.premium_expires_at > NOW() THEN true
        ELSE false
    END as is_active
FROM profiles p
WHERE p.has_premium = true
ORDER BY p.created_at DESC;

-- ============================================
-- SECTION 7: SAMPLE VIP THEME SETTINGS
-- ============================================

-- Function to apply VIP theme template
CREATE OR REPLACE FUNCTION apply_vip_theme(
    p_profile_id UUID,
    p_theme_name TEXT DEFAULT 'gold_luxury'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    theme_settings JSONB;
BEGIN
    -- Define VIP theme templates
    theme_settings := CASE p_theme_name
        WHEN 'gold_luxury' THEN jsonb_build_object(
            'primaryColor', '#FFD700',
            'secondaryColor', '#FFA500',
            'backgroundColor', '#1a1a1a',
            'textColor', '#ffffff',
            'borderColor', '#FFD700',
            'borderWidth', '3px',
            'borderStyle', 'solid',
            'backgroundStyle', 'gradient',
            'gradient', 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            'vipBadge', true,
            'badgeColor', '#FFD700',
            'badgeGlow', true
        )
        WHEN 'diamond_blue' THEN jsonb_build_object(
            'primaryColor', '#00D4FF',
            'secondaryColor', '#0088FF',
            'backgroundColor', '#0a0e27',
            'textColor', '#ffffff',
            'borderColor', '#00D4FF',
            'borderWidth', '2px',
            'borderStyle', 'solid',
            'backgroundStyle', 'gradient',
            'gradient', 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
            'vipBadge', true,
            'badgeColor', '#00D4FF',
            'badgeGlow', true
        )
        WHEN 'royal_purple' THEN jsonb_build_object(
            'primaryColor', '#9D4EDD',
            'secondaryColor', '#C77DFF',
            'backgroundColor', '#10002B',
            'textColor', '#ffffff',
            'borderColor', '#9D4EDD',
            'borderWidth', '2px',
            'borderStyle', 'solid',
            'backgroundStyle', 'gradient',
            'gradient', 'linear-gradient(135deg, #10002B 0%, #240046 100%)',
            'vipBadge', true,
            'badgeColor', '#9D4EDD',
            'badgeGlow', true
        )
        ELSE jsonb_build_object(
            'primaryColor', '#FFD700',
            'secondaryColor', '#FFA500',
            'backgroundColor', '#1a1a1a',
            'textColor', '#ffffff',
            'vipBadge', true
        )
    END;
    
    UPDATE profiles
    SET theme_settings = theme_settings
    WHERE id = p_profile_id;
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- SECTION 8: DEPLOYMENT SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'VIP FEATURES UPDATE - DEPLOYMENT COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Features Unlocked:';
  RAISE NOTICE '  ✓ Theme Customization: UNLOCKED';
  RAISE NOTICE '  ✓ VIP Badge: ENABLED';
  RAISE NOTICE '  ✓ Gold Border: ENABLED (color: #FFD700)';
  RAISE NOTICE '  ✓ Custom CSS: UNLOCKED';
  RAISE NOTICE '  ✓ Premium Analytics: UNLOCKED';
  RAISE NOTICE '  ✓ Custom Domains: UNLOCKED';
  RAISE NOTICE '  ✓ All Premium Features: UNLOCKED';
  RAISE NOTICE '';
  RAISE NOTICE 'Database Changes:';
  RAISE NOTICE '  • Added has_premium column';
  RAISE NOTICE '  • Added vip_badge_enabled column';
  RAISE NOTICE '  • Added vip_border_color column';
  RAISE NOTICE '  • Added premium_tier column';
  RAISE NOTICE '  • Added premium_expires_at column';
  RAISE NOTICE '  • Updated get_user_subscription_status function';
  RAISE NOTICE '  • Created VIP helper functions';
  RAISE NOTICE '  • Created vip_users view';
  RAISE NOTICE '  • Created VIP theme templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions Created:';
  RAISE NOTICE '  • has_vip_access(profile_id) - Check VIP status';
  RAISE NOTICE '  • grant_vip_access(profile_id, duration, tier, color) - Grant VIP';
  RAISE NOTICE '  • revoke_vip_access(profile_id) - Revoke VIP';
  RAISE NOTICE '  • apply_vip_theme(profile_id, theme_name) - Apply VIP theme';
  RAISE NOTICE '';
  RAISE NOTICE 'VIP Theme Templates:';
  RAISE NOTICE '  • gold_luxury - Gold theme with dark background';
  RAISE NOTICE '  • diamond_blue - Blue diamond theme';
  RAISE NOTICE '  • royal_purple - Royal purple theme';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Examples:';
  RAISE NOTICE '  -- Grant VIP for 1 year with gold border:';
  RAISE NOTICE '  SELECT grant_vip_access(profile_id, ''1 year''::interval, ''vip'', ''#FFD700'');';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Apply gold luxury theme:';
  RAISE NOTICE '  SELECT apply_vip_theme(profile_id, ''gold_luxury'');';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Check if user has VIP:';
  RAISE NOTICE '  SELECT has_vip_access(profile_id);';
  RAISE NOTICE '';
  RAISE NOTICE '  -- View all VIP users:';
  RAISE NOTICE '  SELECT * FROM vip_users;';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DEV MODE: All users granted VIP access!';
  RAISE NOTICE 'To restrict in production, comment out Section 3';
  RAISE NOTICE '================================================';
END $$;
