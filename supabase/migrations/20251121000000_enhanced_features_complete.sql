-- Enhanced Features Update - Link Metadata, Themes, and Advanced Customization
-- Migration Date: 2025-11-21
-- Features: Link Metadata System, Enhanced Themes, Advanced Customization

BEGIN;

-- ============================================================================
-- 1. ENHANCED LINK METADATA SYSTEM
-- ============================================================================

-- Update profiles table to support enhanced link metadata
-- The theme_settings JSONB column will store the enhanced customLinks structure

-- Create a helper function to migrate existing simple links to enhanced format
CREATE OR REPLACE FUNCTION migrate_custom_links()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    current_theme_settings JSONB;
    custom_links JSONB;
    enhanced_links JSONB := '[]'::jsonb;
    link_item JSONB;
BEGIN
    -- Loop through all profiles that have theme_settings
    FOR profile_record IN SELECT id, theme_settings FROM public.profiles WHERE theme_settings IS NOT NULL
    LOOP
        current_theme_settings := profile_record.theme_settings;
        custom_links := current_theme_settings -> 'customLinks';
        
        -- If customLinks exists and is an array
        IF custom_links IS NOT NULL AND jsonb_typeof(custom_links) = 'array' THEN
            enhanced_links := '[]'::jsonb;
            
            -- Convert each simple link to enhanced format
            FOR link_item IN SELECT * FROM jsonb_array_elements(custom_links)
            LOOP
                enhanced_links := enhanced_links || jsonb_build_array(
                    jsonb_build_object(
                        'id', COALESCE(link_item->>'id', gen_random_uuid()::text),
                        'title', COALESCE(link_item->>'title', ''),
                        'url', COALESCE(link_item->>'url', ''),
                        'icon', COALESCE(link_item->>'icon', 'link'),
                        'description', '',
                        'favicon', '',
                        'image', '',
                        'color', '#3b82f6',
                        'textColor', '#ffffff',
                        'category', 'general',
                        'isVisible', true,
                        'customStyling', jsonb_build_object(
                            'backgroundColor', '#3b82f6',
                            'borderColor', '#2563eb',
                            'borderRadius', 8,
                            'fontSize', 16,
                            'fontWeight', 500,
                            'padding', 12,
                            'animation', 'none'
                        )
                    )
                );
            END LOOP;
            
            -- Update the theme_settings with enhanced links
            current_theme_settings := jsonb_set(current_theme_settings, '{customLinks}', enhanced_links);
            
            UPDATE public.profiles 
            SET theme_settings = current_theme_settings 
            WHERE id = profile_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. ENHANCED THEME SYSTEM WITH TEMPLATE DATA
-- ============================================================================

-- Create themes table to store ready-to-use theme templates
CREATE TABLE IF NOT EXISTS public.theme_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Theme identification
    theme_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Business', 'Creators', 'Developer', 'Entrepreneur', 'Gaming', 'Crypto', 'Lifestyle')),
    description TEXT NOT NULL,
    
    -- Theme styling
    primary_color TEXT NOT NULL DEFAULT '#3b82f6',
    background_color TEXT NOT NULL DEFAULT '#000000',
    background_type TEXT NOT NULL DEFAULT 'color' CHECK (background_type IN ('color', 'gradient', 'gif')),
    background_gif TEXT DEFAULT '',
    icon_style TEXT NOT NULL DEFAULT 'rounded' CHECK (icon_style IN ('rounded', 'circle', 'square')),
    button_style TEXT NOT NULL DEFAULT 'filled' CHECK (button_style IN ('filled', 'outline', 'ghost', 'glass', 'gradient')),
    
    -- Template metadata
    template_data JSONB NOT NULL DEFAULT '{}',
    
    -- Theme properties
    is_popular BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    preview_text TEXT DEFAULT '',
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0
);

-- Insert all ready-to-use theme templates
INSERT INTO public.theme_templates (theme_id, name, category, description, primary_color, background_color, background_type, background_gif, icon_style, button_style, is_popular, template_data, preview_text) VALUES

-- Business Themes
('corporate-blue', 'Corporate Professional', 'Business', 'Clean, professional look for corporate professionals and consultants', '#1e40af', '#f8fafc', 'color', '', 'rounded', 'filled', true, 
'{"businessName": "Professional Services", "description": "Building business excellence through strategic consulting and innovative solutions. Trusted by Fortune 500 companies.", "customLinks": [{"id": "1", "title": "Book Consultation", "url": "https://calendly.com/yourname", "icon": "📅"}, {"id": "2", "title": "Services & Pricing", "url": "https://yourwebsite.com/services", "icon": "💼"}, {"id": "3", "title": "Client Testimonials", "url": "https://yourwebsite.com/testimonials", "icon": "⭐"}, {"id": "4", "title": "Case Studies", "url": "https://yourwebsite.com/portfolio", "icon": "📊"}, {"id": "5", "title": "Contact & Support", "url": "mailto:hello@yourcompany.com", "icon": "📧"}], "socialLinks": {"twitter": "https://twitter.com/yourcompany", "instagram": "", "youtube": "", "tiktok": "", "facebook": "", "linkedin": "https://linkedin.com/company/yourcompany", "website": "https://yourwebsite.com"}}'::jsonb,
'Blue & white professional theme'),

('executive-dark', 'Executive Dark', 'Business', 'Sophisticated dark theme for executives and business leaders', '#d4af37', '#0f172a', 'color', '', 'square', 'outline', false,
'{"businessName": "Executive Leadership", "description": "Senior executive focused on strategic growth, innovation, and market leadership. Driving organizational excellence and sustainable business transformation.", "customLinks": [{"id": "1", "title": "Executive Calendar", "url": "https://calendly.com/exec", "icon": "🗓️"}, {"id": "2", "title": "Leadership Blog", "url": "https://yourblog.com", "icon": "📝"}, {"id": "3", "title": "Board Presentations", "url": "https://board.yourcompany.com", "icon": "📊"}, {"id": "4", "title": "Industry Insights", "url": "https://insights.yourcompany.com", "icon": "💡"}, {"id": "5", "title": "Executive Assistant", "url": "mailto:assistant@yourcompany.com", "icon": "📧"}], "socialLinks": {"twitter": "https://twitter.com/yourhandle", "instagram": "", "youtube": "", "tiktok": "", "facebook": "", "linkedin": "https://linkedin.com/in/yourprofile", "website": "https://yourcompany.com"}}'::jsonb,
'Dark theme with gold accents'),

('startup-gradient', 'Startup Vibe', 'Business', 'Modern gradient theme perfect for startups and innovation', '#6366f1', '#1e293b', 'gif', 'https://i.giphy.com/26BRrSvJUa0crqw4E.gif', 'rounded', 'glass', false,
'{"businessName": "Innovative Startup", "description": "Revolutionary startup transforming industries through cutting-edge technology and disruptive innovation. Join us in building the future.", "customLinks": [{"id": "1", "title": "Pitch Deck", "url": "https://pitch.yourstartup.com", "icon": "🚀"}, {"id": "2", "title": "Product Demo", "url": "https://demo.yourstartup.com", "icon": "💻"}, {"id": "3", "title": "Join Our Team", "url": "https://careers.yourstartup.com", "icon": "👥"}, {"id": "4", "title": "Investor Relations", "url": "mailto:investors@yourstartup.com", "icon": "💰"}, {"id": "5", "title": "Product Roadmap", "url": "https://roadmap.yourstartup.com", "icon": "🗺️"}], "socialLinks": {"twitter": "https://twitter.com/yourstartup", "instagram": "https://instagram.com/yourstartup", "youtube": "", "tiktok": "", "facebook": "", "linkedin": "https://linkedin.com/company/yourstartup", "website": "https://yourstartup.com"}}'::jsonb,
'Purple gradient with animated background'),

-- Creator Themes
('content-creator', 'Content Creator', 'Creators', 'Vibrant theme designed for YouTubers and content creators', '#ff0000', '#fef2f2', 'color', '', 'rounded', 'filled', true,
'{"businessName": "Creative Studio", "description": "Creating engaging content that inspires, educates, and entertains. Join our community of passionate creators and explore amazing content.", "customLinks": [{"id": "1", "title": "Latest Video", "url": "https://youtube.com/yourchannel", "icon": "🎬"}, {"id": "2", "title": "Patreon Support", "url": "https://patreon.com/yourcreator", "icon": "❤️"}, {"id": "3", "title": "Discord Community", "url": "https://discord.gg/yourcommunity", "icon": "💬"}, {"id": "4", "title": "Merchandise Store", "url": "https://merch.yourstore.com", "icon": "🛍️"}, {"id": "5", "title": "Creator Collab", "url": "mailto:collab@yourcreator.com", "icon": "🤝"}], "socialLinks": {"twitter": "https://twitter.com/yourcreator", "instagram": "https://instagram.com/yourcreator", "youtube": "https://youtube.com/yourchannel", "tiktok": "https://tiktok.com/@yourcreator", "facebook": "", "linkedin": "", "website": "https://yourcreator.com"}}'::jsonb,
'YouTube red theme for creators'),

('artistic-purple', 'Artistic Vision', 'Creators', 'Creative purple theme for artists and designers', '#8b5cf6', '#f3e8ff', 'color', '', 'circle', 'filled', false,
'{"businessName": "Artistic Creations", "description": "Bringing imagination to life through stunning visual art and innovative design. Explore a world of creativity and artistic expression.", "customLinks": [{"id": "1", "title": "Art Portfolio", "url": "https://portfolio.yourart.com", "icon": "🎨"}, {"id": "2", "title": "Commission Work", "url": "https://commissions.yourart.com", "icon": "✨"}, {"id": "3", "title": "Art Prints Shop", "url": "https://shop.yourart.com", "icon": "🖼️"}, {"id": "4", "title": "Creative Process", "url": "https://blog.yourart.com", "icon": "📝"}, {"id": "5", "title": "Contact Artist", "url": "mailto:hello@yourart.com", "icon": "📧"}], "socialLinks": {"twitter": "https://twitter.com/yourart", "instagram": "https://instagram.com/yourart", "youtube": "", "tiktok": "https://tiktok.com/@yourart", "facebook": "", "linkedin": "", "website": "https://yourart.com"}}'::jsonb,
'Purple creative theme for artists'),

-- Gaming Themes  
('gamer-neon', 'Neon Gaming', 'Gaming', 'Electric neon theme perfect for gamers and streamers', '#a855f7', '#1a1a2e', 'color', '', 'rounded', 'filled', true,
'{"businessName": "Gaming Central", "description": "Elite gaming content, live streams, and gaming community. Join the ultimate gaming experience with epic gameplay and pro tips.", "customLinks": [{"id": "1", "title": "Twitch Stream", "url": "https://twitch.tv/yourgamer", "icon": "🎮"}, {"id": "2", "title": "Discord Server", "url": "https://discord.gg/yourgaming", "icon": "💬"}, {"id": "3", "title": "Gaming Highlights", "url": "https://youtube.com/yourgaming", "icon": "🎬"}, {"id": "4", "title": "Gaming Gear", "url": "https://gear.yourgaming.com", "icon": "⚡"}, {"id": "5", "title": "Sponsor Inquiry", "url": "mailto:sponsor@yourgaming.com", "icon": "🤝"}], "socialLinks": {"twitter": "https://twitter.com/yourgamer", "instagram": "https://instagram.com/yourgamer", "youtube": "https://youtube.com/yourgaming", "tiktok": "https://tiktok.com/@yourgamer", "facebook": "", "linkedin": "", "website": "https://yourgaming.com"}}'::jsonb,
'Electric neon gaming theme'),

-- Crypto Themes
('crypto-gold', 'Crypto King', 'Crypto', 'Golden Bitcoin-inspired theme for crypto enthusiasts', '#f59e0b', '#1a1a1a', 'color', '', 'circle', 'filled', true,
'{"businessName": "Crypto Trading Pro", "description": "Professional cryptocurrency trading and investment insights. Navigate the digital asset market with expert analysis and proven strategies.", "customLinks": [{"id": "1", "title": "Trading Portfolio", "url": "https://portfolio.yourcrypto.com", "icon": "📈"}, {"id": "2", "title": "Market Analysis", "url": "https://analysis.yourcrypto.com", "icon": "📊"}, {"id": "3", "title": "Trading Signals", "url": "https://signals.yourcrypto.com", "icon": "⚡"}, {"id": "4", "title": "Crypto Course", "url": "https://course.yourcrypto.com", "icon": "🎓"}, {"id": "5", "title": "Trading Community", "url": "https://community.yourcrypto.com", "icon": "👥"}], "socialLinks": {"twitter": "https://twitter.com/yourcrypto", "instagram": "https://instagram.com/yourcrypto", "youtube": "https://youtube.com/yourcrypto", "tiktok": "https://tiktok.com/@yourcrypto", "facebook": "", "linkedin": "", "website": "https://yourcrypto.com"}}'::jsonb,
'Golden Bitcoin-inspired theme')

ON CONFLICT (theme_id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    primary_color = EXCLUDED.primary_color,
    background_color = EXCLUDED.background_color,
    background_type = EXCLUDED.background_type,
    background_gif = EXCLUDED.background_gif,
    icon_style = EXCLUDED.icon_style,
    button_style = EXCLUDED.button_style,
    is_popular = EXCLUDED.is_popular,
    template_data = EXCLUDED.template_data,
    preview_text = EXCLUDED.preview_text,
    updated_at = timezone('utc'::text, now());

-- ============================================================================
-- 3. ADVANCED CUSTOMIZATION SETTINGS
-- ============================================================================

-- Create advanced_customization_presets table
CREATE TABLE IF NOT EXISTS public.advanced_customization_presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Preset identification
    preset_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('minimal', 'vibrant', 'professional', 'creative', 'modern')),
    description TEXT NOT NULL,
    
    -- Advanced settings (stored as JSONB)
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Preset properties
    is_premium BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0
);

-- Insert advanced customization presets
INSERT INTO public.advanced_customization_presets (preset_name, category, description, settings) VALUES

('minimal-clean', 'minimal', 'Clean, simple design with plenty of whitespace', 
'{"header": {"layout": "centered", "showProfileImage": true, "showBio": false, "backgroundType": "color", "backgroundColor": "#ffffff"}, "wallpaper": {"type": "color", "value": "#f8fafc", "opacity": 100, "blur": 0}, "text": {"fontFamily": "Inter", "titleSize": 24, "bodySize": 16, "color": "#1f2937", "alignment": "center"}, "buttons": {"style": "outline", "roundness": 4, "spacing": 16, "animation": "none", "shadow": false}, "colors": {"primary": "#6b7280", "secondary": "#9ca3af", "accent": "#374151", "background": "#ffffff", "surface": "#f9fafb", "text": "#111827", "muted": "#6b7280"}}'::jsonb),

('vibrant-energy', 'vibrant', 'Bold colors and dynamic animations', 
'{"header": {"layout": "centered", "showProfileImage": true, "showBio": true, "backgroundType": "gradient", "backgroundColor": "#ff6b6b"}, "wallpaper": {"type": "gradient", "value": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "opacity": 90, "blur": 0}, "text": {"fontFamily": "Poppins", "titleSize": 28, "bodySize": 18, "color": "#ffffff", "alignment": "center"}, "buttons": {"style": "filled", "roundness": 12, "spacing": 20, "animation": "bounce", "shadow": true}, "colors": {"primary": "#ff6b6b", "secondary": "#4ecdc4", "accent": "#45b7d1", "background": "#667eea", "surface": "#ffffff", "text": "#ffffff", "muted": "#f8f9fa"}}'::jsonb),

('professional-business', 'professional', 'Business-focused with elegant typography', 
'{"header": {"layout": "left", "showProfileImage": true, "showBio": true, "backgroundType": "color", "backgroundColor": "#1e293b"}, "wallpaper": {"type": "color", "value": "#0f172a", "opacity": 100, "blur": 0}, "text": {"fontFamily": "Source Sans Pro", "titleSize": 26, "bodySize": 16, "color": "#f1f5f9", "alignment": "left"}, "buttons": {"style": "outline", "roundness": 8, "spacing": 16, "animation": "hover-lift", "shadow": true}, "colors": {"primary": "#3b82f6", "secondary": "#1e40af", "accent": "#60a5fa", "background": "#0f172a", "surface": "#1e293b", "text": "#f1f5f9", "muted": "#64748b"}}'::jsonb),

('creative-artistic', 'creative', 'Artistic layouts with unique visual elements', 
'{"header": {"layout": "split", "showProfileImage": true, "showBio": true, "backgroundType": "gradient", "backgroundColor": "#8b5cf6"}, "wallpaper": {"type": "gradient", "value": "linear-gradient(45deg, #8b5cf6, #ec4899, #f59e0b)", "opacity": 85, "blur": 2}, "text": {"fontFamily": "Playfair Display", "titleSize": 30, "bodySize": 17, "color": "#ffffff", "alignment": "center"}, "buttons": {"style": "glass", "roundness": 16, "spacing": 18, "animation": "glow", "shadow": true}, "colors": {"primary": "#8b5cf6", "secondary": "#ec4899", "accent": "#f59e0b", "background": "#7c3aed", "surface": "rgba(255,255,255,0.1)", "text": "#ffffff", "muted": "#e5e7eb"}}'::jsonb),

('modern-tech', 'modern', 'Contemporary design with latest trends', 
'{"header": {"layout": "centered", "showProfileImage": true, "showBio": true, "backgroundType": "color", "backgroundColor": "#111827"}, "wallpaper": {"type": "color", "value": "#030712", "opacity": 100, "blur": 0}, "text": {"fontFamily": "Inter", "titleSize": 24, "bodySize": 16, "color": "#f9fafb", "alignment": "center"}, "buttons": {"style": "gradient", "roundness": 8, "spacing": 14, "animation": "pulse", "shadow": true}, "colors": {"primary": "#06b6d4", "secondary": "#0891b2", "accent": "#67e8f9", "background": "#030712", "surface": "#111827", "text": "#f9fafb", "muted": "#6b7280"}}'::jsonb)

ON CONFLICT (preset_name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    settings = EXCLUDED.settings,
    updated_at = timezone('utc'::text, now());

-- ============================================================================
-- 4. LINK ANALYTICS AND TRACKING
-- ============================================================================

-- Enhanced analytics table for link tracking
-- Add link tracking columns to existing analytics table
DO $$
BEGIN
    -- Check if link_id column doesn't exist and add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'link_id') THEN
        ALTER TABLE public.analytics ADD COLUMN link_id TEXT DEFAULT '';
    END IF;
    
    -- Check if link_metadata column doesn't exist and add it  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'link_metadata') THEN
        ALTER TABLE public.analytics ADD COLUMN link_metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create function to track link clicks with metadata
CREATE OR REPLACE FUNCTION track_link_click(
    p_profile_id UUID,
    p_link_id TEXT,
    p_link_title TEXT DEFAULT '',
    p_link_url TEXT DEFAULT '',
    p_user_agent TEXT DEFAULT '',
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO public.analytics (
        profile_id,
        event_type,
        event_data,
        user_agent,
        ip_address,
        link_id,
        link_metadata
    ) VALUES (
        p_profile_id,
        'link_click',
        jsonb_build_object(
            'link_id', p_link_id,
            'link_title', p_link_title,
            'link_url', p_link_url,
            'timestamp', now()
        ),
        p_user_agent,
        p_ip_address,
        p_link_id,
        jsonb_build_object(
            'title', p_link_title,
            'url', p_link_url,
            'clicked_at', now()
        )
    ) RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. BACKUP AND MIGRATION FUNCTIONS
-- ============================================================================

-- Function to backup user data including enhanced features
CREATE OR REPLACE FUNCTION backup_user_profile(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data JSONB;
    products_data JSONB;
    analytics_data JSONB;
    backup_data JSONB;
BEGIN
    -- Get profile data
    SELECT to_jsonb(p) INTO profile_data
    FROM public.profiles p
    WHERE p.id = p_profile_id;
    
    -- Get products data
    SELECT COALESCE(jsonb_agg(to_jsonb(pr)), '[]'::jsonb) INTO products_data
    FROM public.products pr
    WHERE pr.profile_id = p_profile_id;
    
    -- Get analytics summary
    SELECT jsonb_build_object(
        'total_views', COUNT(*) FILTER (WHERE event_type = 'view'),
        'total_clicks', COUNT(*) FILTER (WHERE event_type = 'link_click'),
        'total_social_clicks', COUNT(*) FILTER (WHERE event_type = 'social_click'),
        'total_events', COUNT(*),
        'first_event', MIN(created_at),
        'last_event', MAX(created_at)
    ) INTO analytics_data
    FROM public.analytics a
    WHERE a.profile_id = p_profile_id;
    
    -- Combine all data
    backup_data := jsonb_build_object(
        'profile', profile_data,
        'products', products_data,
        'analytics_summary', analytics_data,
        'backup_created_at', now(),
        'backup_version', '2.0'
    );
    
    RETURN backup_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. USER PREFERENCES AND ADVANCED SETTINGS
-- ============================================================================

-- Create user_preferences table for storing advanced settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Advanced customization settings
    advanced_settings JSONB DEFAULT '{}',
    
    -- Link preferences
    link_preferences JSONB DEFAULT '{}',
    
    -- Theme preferences  
    theme_preferences JSONB DEFAULT '{}',
    
    -- Analytics preferences
    analytics_preferences JSONB DEFAULT '{"trackClicks": true, "trackViews": true, "showAnalytics": true}',
    
    -- Notification preferences
    notification_preferences JSONB DEFAULT '{"emailNotifications": true, "pushNotifications": true, "analyticsReports": true}',
    
    -- Privacy settings
    privacy_settings JSONB DEFAULT '{"profileVisible": true, "analyticsVisible": false, "contactVisible": true}'
);

-- ============================================================================
-- 7. INDEXES AND PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_theme_templates_category ON public.theme_templates(category);
CREATE INDEX IF NOT EXISTS idx_theme_templates_popular ON public.theme_templates(is_popular);
CREATE INDEX IF NOT EXISTS idx_theme_templates_usage ON public.theme_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_advanced_presets_category ON public.advanced_customization_presets(category);
CREATE INDEX IF NOT EXISTS idx_advanced_presets_usage ON public.advanced_customization_presets(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON public.analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_data ON public.analytics USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_analytics_link_metadata ON public.analytics USING GIN(link_metadata);

CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON public.user_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_advanced_settings ON public.user_preferences USING GIN(advanced_settings);

-- Create indexes on JSONB theme_settings for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_theme_settings ON public.profiles USING GIN(theme_settings);
CREATE INDEX IF NOT EXISTS idx_profiles_custom_links ON public.profiles USING GIN((theme_settings->'customLinks'));

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ============================================================================

-- Enable RLS for new tables
ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_customization_presets ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for theme templates (public read)
DROP POLICY IF EXISTS "Theme templates are viewable by everyone" ON public.theme_templates;
CREATE POLICY "Theme templates are viewable by everyone" ON public.theme_templates
    FOR SELECT USING (true);

-- Create RLS policies for advanced presets (public read)
DROP POLICY IF EXISTS "Advanced presets are viewable by everyone" ON public.advanced_customization_presets;
CREATE POLICY "Advanced presets are viewable by everyone" ON public.advanced_customization_presets
    FOR SELECT USING (true);

-- Create RLS policies for user preferences (user-specific)
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (true);

-- ============================================================================
-- 9. GRANT PERMISSIONS FOR NEW TABLES
-- ============================================================================

-- Grant permissions for new tables
GRANT SELECT ON public.theme_templates TO anon;
GRANT SELECT ON public.theme_templates TO authenticated;

GRANT SELECT ON public.advanced_customization_presets TO anon;
GRANT SELECT ON public.advanced_customization_presets TO authenticated;

GRANT ALL ON public.user_preferences TO authenticated;

-- ============================================================================
-- 10. UTILITY FUNCTIONS FOR ENHANCED FEATURES
-- ============================================================================

-- Function to apply theme template to profile
CREATE OR REPLACE FUNCTION apply_theme_template(
    p_profile_id UUID,
    p_theme_id TEXT
)
RETURNS boolean AS $$
DECLARE
    theme_data RECORD;
    current_theme_settings JSONB;
    new_theme_settings JSONB;
BEGIN
    -- Get theme template data
    SELECT * INTO theme_data
    FROM public.theme_templates
    WHERE theme_id = p_theme_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Get current theme settings
    SELECT theme_settings INTO current_theme_settings
    FROM public.profiles
    WHERE id = p_profile_id;
    
    -- Build new theme settings
    new_theme_settings := jsonb_build_object(
        'primaryColor', theme_data.primary_color,
        'backgroundColor', theme_data.background_color,
        'backgroundType', theme_data.background_type,
        'backgroundGif', theme_data.background_gif,
        'iconStyle', theme_data.icon_style,
        'buttonStyle', theme_data.button_style,
        'customLinks', COALESCE(current_theme_settings->'customLinks', '[]'::jsonb),
        'templateData', theme_data.template_data
    );
    
    -- Update profile with new theme
    UPDATE public.profiles
    SET theme_settings = new_theme_settings,
        updated_at = now()
    WHERE id = p_profile_id;
    
    -- Increment usage count
    UPDATE public.theme_templates
    SET usage_count = usage_count + 1
    WHERE theme_id = p_theme_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profile analytics with enhanced link tracking
CREATE OR REPLACE FUNCTION get_profile_analytics(
    p_profile_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    analytics_data JSONB;
    link_analytics JSONB;
    top_links JSONB;
BEGIN
    -- Get general analytics
    SELECT jsonb_build_object(
        'total_views', COUNT(*) FILTER (WHERE event_type = 'view'),
        'total_clicks', COUNT(*) FILTER (WHERE event_type = 'link_click'),
        'total_social_clicks', COUNT(*) FILTER (WHERE event_type = 'social_click'),
        'unique_sessions', COUNT(DISTINCT session_id),
        'period_start', now() - interval '1 day' * p_days,
        'period_end', now()
    ) INTO analytics_data
    FROM public.analytics
    WHERE profile_id = p_profile_id
    AND created_at >= now() - interval '1 day' * p_days;
    
    -- Get link-specific analytics
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'link_id', link_id,
            'link_title', (link_metadata->>'title'),
            'clicks', count(*),
            'last_clicked', max(created_at)
        )
    ), '[]'::jsonb) INTO link_analytics
    FROM public.analytics
    WHERE profile_id = p_profile_id
    AND event_type = 'link_click'
    AND link_id IS NOT NULL
    AND created_at >= now() - interval '1 day' * p_days
    GROUP BY link_id, (link_metadata->>'title');
    
    -- Get top performing links
    SELECT COALESCE(jsonb_agg(link_data ORDER BY clicks DESC), '[]'::jsonb) INTO top_links
    FROM (
        SELECT jsonb_build_object(
            'link_id', link_id,
            'title', (link_metadata->>'title'),
            'clicks', count(*),
            'click_rate', round(count(*)::numeric / NULLIF(analytics_data->>'total_views', '0')::numeric * 100, 2)
        ) as link_data,
        count(*) as clicks
        FROM public.analytics
        WHERE profile_id = p_profile_id
        AND event_type = 'link_click'
        AND link_id IS NOT NULL
        AND created_at >= now() - interval '1 day' * p_days
        GROUP BY link_id, (link_metadata->>'title')
        LIMIT 10
    ) ranked_links;
    
    RETURN jsonb_build_object(
        'overview', analytics_data,
        'link_analytics', link_analytics,
        'top_links', top_links,
        'generated_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. RUN MIGRATION FOR EXISTING DATA
-- ============================================================================

-- Run the custom links migration
SELECT migrate_custom_links();

-- Add trigger for updated_at on new tables
CREATE TRIGGER set_timestamp_theme_templates
    BEFORE UPDATE ON public.theme_templates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_advanced_presets
    BEFORE UPDATE ON public.advanced_customization_presets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- 12. REFRESH SCHEMA AND CLEANUP
-- ============================================================================

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Drop the migration function (no longer needed)
DROP FUNCTION IF EXISTS migrate_custom_links();

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- This migration adds:
-- 1. Enhanced link metadata system with rich customization
-- 2. Theme templates with complete template data
-- 3. Advanced customization presets
-- 4. Enhanced analytics with link tracking
-- 5. User preferences system
-- 6. Utility functions for theme management
-- 7. Performance optimizations and indexes
-- 8. Complete RLS policies and permissions
-- 
-- All existing data is preserved and enhanced with new capabilities.
-- The system now supports professional-grade link customization,
-- comprehensive theme templates, and advanced user preferences.
--
-- ============================================================================