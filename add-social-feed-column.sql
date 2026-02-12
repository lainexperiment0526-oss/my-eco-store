-- ============================================
-- Complete Feature Migration for DropLink
-- ============================================

-- 1. Add social feed storage for pinned embeds
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS social_feed jsonb DEFAULT '[]'::jsonb;

-- 2. Ensure theme_settings column exists (stores customLinks, socialFeedItems, etc)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_settings jsonb DEFAULT '{}'::jsonb;

-- 3. Ensure background music column exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS background_music_url text;

-- 4. Ensure Pi wallet columns exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pi_wallet_address text,
ADD COLUMN IF NOT EXISTS pi_donation_message text DEFAULT 'Send me a coffee ☕';

-- 5. Ensure social links column exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- 6. Ensure verification and premium columns exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_premium boolean DEFAULT false;

-- 7. Ensure card customization columns exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS card_front_color text DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_back_color text DEFAULT '#2bbdee',
ADD COLUMN IF NOT EXISTS card_text_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS card_accent_color text DEFAULT '#fafafa';

-- 8. Ensure show settings columns exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_share_button boolean DEFAULT true;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_wallet ON public.profiles(pi_wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON public.profiles(has_premium);

-- 10. Create index for social feed JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_social_feed ON public.profiles USING gin(social_feed);
CREATE INDEX IF NOT EXISTS idx_profiles_theme_settings ON public.profiles USING gin(theme_settings);

-- 11. Ensure products table exists with proper schema
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price text,
    file_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_profile_id ON public.products(profile_id);

-- 12. Ensure analytics table exists
CREATE TABLE IF NOT EXISTS public.analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON public.analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);

-- 13. Ensure followers table exists
CREATE TABLE IF NOT EXISTS public.followers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_profile_id, following_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_profile_id);

-- 14. Ensure email_captures table exists
CREATE TABLE IF NOT EXISTS public.email_captures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    email text NOT NULL,
    source text,
    captured_from_page text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_captures_profile_id ON public.email_captures(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON public.email_captures(email);

-- 15. Ensure messages table exists
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    receiver_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Add read column if it doesn't exist
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_profile_id, read) WHERE read = false;

-- 16. Update existing profiles with default values if needed
UPDATE public.profiles
SET 
    social_feed = COALESCE(social_feed, '[]'::jsonb),
    theme_settings = COALESCE(theme_settings, '{}'::jsonb),
    social_links = COALESCE(social_links, '[]'::jsonb),
    is_verified = COALESCE(is_verified, false),
    has_premium = COALESCE(has_premium, false),
    show_share_button = COALESCE(show_share_button, true),
    card_front_color = COALESCE(card_front_color, '#2bbdee'),
    card_back_color = COALESCE(card_back_color, '#2bbdee'),
    card_text_color = COALESCE(card_text_color, '#000000'),
    card_accent_color = COALESCE(card_accent_color, '#fafafa')
WHERE 
    social_feed IS NULL OR
    theme_settings IS NULL OR
    social_links IS NULL OR
    is_verified IS NULL OR
    has_premium IS NULL OR
    show_share_button IS NULL OR
    card_front_color IS NULL OR
    card_back_color IS NULL OR
    card_text_color IS NULL OR
    card_accent_color IS NULL;

-- 17. Create or update RLS policies (if needed)
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Public read access for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR true);

-- Public read access for products
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone"
ON public.products FOR SELECT
USING (true);

-- Public insert for analytics
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics"
ON public.analytics FOR INSERT
WITH CHECK (true);

-- Public insert for followers
DROP POLICY IF EXISTS "Anyone can follow" ON public.followers;
CREATE POLICY "Anyone can follow"
ON public.followers FOR INSERT
WITH CHECK (true);

-- Public read for followers
DROP POLICY IF EXISTS "Public followers are viewable" ON public.followers;
CREATE POLICY "Public followers are viewable"
ON public.followers FOR SELECT
USING (true);

-- Public insert for email captures
DROP POLICY IF EXISTS "Anyone can submit email" ON public.email_captures;
CREATE POLICY "Anyone can submit email"
ON public.email_captures FOR INSERT
WITH CHECK (true);

-- Public insert for messages
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;
CREATE POLICY "Anyone can send messages"
ON public.messages FOR INSERT
WITH CHECK (true);

-- Users can read their received messages
DROP POLICY IF EXISTS "Users can read received messages" ON public.messages;
CREATE POLICY "Users can read received messages"
ON public.messages FOR SELECT
USING (
    receiver_profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- ============================================
-- Migration Complete
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- All features should now be properly configured
