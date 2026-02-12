-- 01_core_profiles.sql
-- Core profiles table and admin helper
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pi_user_id TEXT UNIQUE,
  description TEXT,
  logo TEXT,
  category TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  has_premium BOOLEAN DEFAULT FALSE,
  background_music_url TEXT,
  theme_settings JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '[]'::jsonb,
  show_share_button BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Admin helper
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin = TRUE
    FROM public.profiles
    WHERE user_id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
