-- ============================================================================
-- COMPLETE FEATURE MIGRATION - All Dashboard Features
-- ============================================================================
-- This migration ensures all dashboard features are properly stored in database
-- Covers: Bio Templates, Social Links, Image Cards, Custom Links, Payment Links, etc.
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Core Profile Data
-- ============================================================================

-- Ensure all essential columns exist (these should already exist, but verify)
DO $$ 
BEGIN
    -- Add bio column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    
    -- Add follower_count if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'follower_count') THEN
        ALTER TABLE public.profiles ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add view_count if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'view_count') THEN
        ALTER TABLE public.profiles ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 2. THEME_SETTINGS JSONB - All Design & Feature Data
-- ============================================================================

-- The theme_settings JSONB column stores ALL customization data:
-- {
--   "bioTemplate": "cards" | "minimal" | "grid" | "gallery",
--   "primaryColor": "#38bdf8",
--   "backgroundColor": "#000000",
--   "backgroundType": "color" | "gif" | "video",
--   "backgroundGif": "url",
--   "backgroundVideo": "url",
--   "iconStyle": "rounded" | "circle" | "square",
--   "buttonStyle": "filled" | "outlined",
--   "glassMode": true | false,
--   "coverImage": "url",
--   "customLinks": [{id, title, url, icon, color}],
--   "imageLinkCards": [{id, title, imageUrl, linkUrl, description}],
--   "paymentLinks": [{id, amount, description, type, url, active, totalReceived, transactionCount}]
-- }

COMMENT ON COLUMN public.profiles.theme_settings IS 
'JSONB column containing all theme and design settings including: 
- bioTemplate (string): Layout template (cards, minimal, grid, gallery)
- primaryColor (string): Primary theme color
- backgroundColor (string): Background color
- backgroundType (string): Type of background (color, gif, video)
- backgroundGif (string): GIF background URL
- backgroundVideo (string): Video background URL
- iconStyle (string): Icon border style (rounded, circle, square)
- buttonStyle (string): Button style (filled, outlined)
- glassMode (boolean): Glass morphism effect
- coverImage (string): Cover image URL
- customLinks (array): Custom link buttons [{id, title, url, icon, color}]
- imageLinkCards (array): Image link cards [{id, title, imageUrl, linkUrl, description}]
- paymentLinks (array): Payment links [{id, amount, description, type, url, active, totalReceived, transactionCount}]';

-- ============================================================================
-- 3. SOCIAL_LINKS JSONB - Social Media Platforms (45+)
-- ============================================================================

-- Social links are stored in profiles.social_links as JSONB array:
-- [
--   {type: "twitter", url: "...", icon: "twitter", followers: 1000},
--   {type: "instagram", url: "...", icon: "instagram", followers: 5000},
--   ...
-- ]

COMMENT ON COLUMN public.profiles.social_links IS 
'JSONB array of social media links supporting 45+ platforms including:
Social: Twitter/X, Instagram, Facebook, TikTok, Snapchat, Threads, Bluesky
Professional: LinkedIn, GitHub, GitLab, Stack Overflow
Content: YouTube, Twitch, Kick, Vimeo
Messaging: Discord, Telegram, WhatsApp, Slack
Creative: Behance, Dribbble, DeviantArt, Medium
Music: Spotify, SoundCloud, Bandcamp, Apple Music
Monetization: Patreon, OnlyFans, Ko-fi, Substack
Business: Shopify, Etsy, Amazon
Each link: {type, url, icon, followers}';

-- ============================================================================
-- 4. PRODUCTS TABLE - Digital Products & Services
-- ============================================================================

-- Ensure products table exists with all features
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    file_url TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
    -- Add is_active if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add image_url if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add sales_count if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'sales_count') THEN
        ALTER TABLE public.products ADD COLUMN sales_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 5. MEMBERSHIPS TABLE - Membership Tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL,
    tier_level INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    benefits JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
    -- Add is_active if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'memberships' AND column_name = 'is_active') THEN
        ALTER TABLE public.memberships ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add member_count if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'memberships' AND column_name = 'member_count') THEN
        ALTER TABLE public.memberships ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================================
-- 6. ANALYTICS TABLE - Profile Analytics & Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. WITHDRAWALS TABLE - Payment Withdrawals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. FOLLOWERS TABLE - User Follow Relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'followers_follower_id_following_id_key'
    ) THEN
        ALTER TABLE public.followers 
        ADD CONSTRAINT followers_follower_id_following_id_key 
        UNIQUE(follower_id, following_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- ============================================================================
-- 9. PERFORMANCE INDEXES
-- ============================================================================

-- Bio template lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_template 
ON public.profiles(username, ((theme_settings->>'bioTemplate')));

-- Social links search
CREATE INDEX IF NOT EXISTS idx_profiles_social_links 
ON public.profiles USING GIN (social_links);

-- Theme settings search
CREATE INDEX IF NOT EXISTS idx_profiles_theme_settings 
ON public.profiles USING GIN (theme_settings);

-- Products by profile
CREATE INDEX IF NOT EXISTS idx_products_profile_id 
ON public.products(profile_id);

CREATE INDEX IF NOT EXISTS idx_products_active 
ON public.products(profile_id, is_active) WHERE is_active = true;

-- Memberships by profile
CREATE INDEX IF NOT EXISTS idx_memberships_profile_id 
ON public.memberships(profile_id);

CREATE INDEX IF NOT EXISTS idx_memberships_active 
ON public.memberships(profile_id, is_active) WHERE is_active = true;

-- Analytics by profile and date
CREATE INDEX IF NOT EXISTS idx_analytics_profile_date 
ON public.analytics(profile_id, created_at DESC);

-- Followers indexes
CREATE INDEX IF NOT EXISTS idx_followers_follower_id 
ON public.followers(follower_id);

CREATE INDEX IF NOT EXISTS idx_followers_following_id 
ON public.followers(following_id);

-- Username lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles(LOWER(username));

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Get template usage statistics
CREATE OR REPLACE FUNCTION get_template_stats()
RETURNS TABLE (template text, count bigint, percentage numeric) AS $$
  WITH total AS (
    SELECT COUNT(*) as total_count 
    FROM public.profiles 
    WHERE deleted_at IS NULL
  )
  SELECT 
    COALESCE(theme_settings->>'bioTemplate', 'cards') as template,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / total.total_count), 2) as percentage
  FROM public.profiles, total
  WHERE deleted_at IS NULL
  GROUP BY theme_settings->>'bioTemplate', total.total_count
  ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

-- Get profile analytics summary
CREATE OR REPLACE FUNCTION get_profile_analytics(p_profile_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  last_event TIMESTAMPTZ
) AS $$
  SELECT 
    event_type,
    COUNT(*) as event_count,
    MAX(created_at) as last_event
  FROM public.analytics
  WHERE profile_id = p_profile_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY event_type
  ORDER BY event_count DESC;
$$ LANGUAGE SQL STABLE;

-- Update follower counts (trigger function)
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the followed profile
    UPDATE public.profiles
    SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for the unfollowed profile
    UPDATE public.profiles
    SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.followers;
CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables (only if they exist)
DO $$ 
BEGIN
    -- Enable RLS on profiles
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on products
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on memberships
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'memberships' AND schemaname = 'public') THEN
        ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on analytics
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analytics' AND schemaname = 'public') THEN
        ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on followers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'followers' AND schemaname = 'public') THEN
        ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on withdrawals
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'withdrawals' AND schemaname = 'public') THEN
        ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Profiles: Public read, owner write
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Products: Public read active, owner full access
DROP POLICY IF EXISTS "Active products are publicly readable" ON public.products;
CREATE POLICY "Active products are publicly readable" 
ON public.products FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" 
ON public.products FOR ALL 
USING (auth.uid() = profile_id);

-- Memberships: Similar to products
DROP POLICY IF EXISTS "Active memberships are publicly readable" ON public.memberships;
CREATE POLICY "Active memberships are publicly readable" 
ON public.memberships FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own memberships" ON public.memberships;
CREATE POLICY "Users can manage own memberships" 
ON public.memberships FOR ALL 
USING (auth.uid() = profile_id);

-- Analytics: Owner read only
DROP POLICY IF EXISTS "Users can read own analytics" ON public.analytics;
CREATE POLICY "Users can read own analytics" 
ON public.analytics FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Analytics can be inserted" ON public.analytics;
CREATE POLICY "Analytics can be inserted" 
ON public.analytics FOR INSERT 
WITH CHECK (true);

-- Followers: Public read, authenticated write
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Followers are publicly readable" ON public.followers;
        CREATE POLICY "Followers are publicly readable" 
        ON public.followers FOR SELECT 
        USING (true);
    EXCEPTION
        WHEN undefined_table THEN
            NULL; -- Table doesn't exist yet
        WHEN undefined_column THEN
            NULL; -- Column doesn't exist yet
    END;
END $$;

DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can follow" ON public.followers;
        CREATE POLICY "Authenticated users can follow" 
        ON public.followers FOR INSERT 
        WITH CHECK (auth.uid() = follower_id);
    EXCEPTION
        WHEN undefined_table THEN
            NULL; -- Table doesn't exist yet
        WHEN undefined_column THEN
            NULL; -- Column doesn't exist yet
    END;
END $$;

DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
        CREATE POLICY "Users can unfollow" 
        ON public.followers FOR DELETE 
        USING (auth.uid() = follower_id);
    EXCEPTION
        WHEN undefined_table THEN
            NULL; -- Table doesn't exist yet
        WHEN undefined_column THEN
            NULL; -- Column doesn't exist yet
    END;
END $$;

-- Withdrawals: Owner only
DROP POLICY IF EXISTS "Users can manage own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can manage own withdrawals" 
ON public.withdrawals FOR ALL 
USING (auth.uid() = profile_id);

-- ============================================================================
-- 12. DATA VALIDATION & CONSTRAINTS
-- ============================================================================

-- Add constraints only if they don't exist
DO $$ 
BEGIN
    -- Follower count constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_follower_count_positive'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_follower_count_positive 
        CHECK (follower_count >= 0);
    END IF;

    -- View count constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_view_count_positive'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_view_count_positive 
        CHECK (view_count >= 0);
    END IF;

    -- Product price constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_price_positive'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT check_price_positive 
        CHECK (price >= 0);
    END IF;

    -- Membership price constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_membership_price_positive'
    ) THEN
        ALTER TABLE public.memberships 
        ADD CONSTRAINT check_membership_price_positive 
        CHECK (price > 0);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, do nothing
        NULL;
END $$;

-- ============================================================================
-- 13. DEFAULT DATA & EXAMPLES
-- ============================================================================

-- Example of how theme_settings should be structured (for reference)
COMMENT ON TABLE public.profiles IS 
'User profiles with complete feature support.
Example theme_settings structure:
{
  "bioTemplate": "cards",
  "primaryColor": "#38bdf8",
  "backgroundColor": "#000000",
  "backgroundType": "color",
  "backgroundGif": "",
  "backgroundVideo": "",
  "iconStyle": "rounded",
  "buttonStyle": "filled",
  "glassMode": false,
  "coverImage": "",
  "customLinks": [
    {"id": "1", "title": "My Website", "url": "https://example.com", "icon": "globe", "color": "#3b82f6"}
  ],
  "imageLinkCards": [
    {"id": "1", "title": "Portfolio", "imageUrl": "https://...", "linkUrl": "https://...", "description": "Check out my work"}
  ],
  "paymentLinks": [
    {"id": "1", "amount": 5, "description": "Buy me a coffee", "type": "tip", "url": "pi://...", "active": true, "totalReceived": 0, "transactionCount": 0}
  ]
}';

-- ============================================================================
-- 14. ROLLBACK SCRIPT (Use if needed to remove migration)
-- ============================================================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.followers;
DROP FUNCTION IF EXISTS update_follower_counts();
DROP FUNCTION IF EXISTS get_profile_analytics(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_template_stats();
DROP INDEX IF EXISTS idx_profiles_username_lower;
DROP INDEX IF EXISTS idx_followers_following_id;
DROP INDEX IF EXISTS idx_followers_follower_id;
DROP INDEX IF EXISTS idx_analytics_profile_date;
DROP INDEX IF EXISTS idx_memberships_profile_id;
DROP INDEX IF EXISTS idx_products_profile_id;
DROP INDEX IF EXISTS idx_profiles_theme_settings;
DROP INDEX IF EXISTS idx_profiles_social_links;
DROP INDEX IF EXISTS idx_profiles_username_template;
-- Note: Don't drop tables if they contain user data
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
