-- Enhanced Pi Network Integration and Public Sharing
-- This supplements the existing migration with Pi-specific features

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to profiles table for Pi Network integration
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS pi_user_id TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for Pi user ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error', 'gift', 'follow', 'payment'))
);

-- Create custom_domains table for public sharing
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create link_icons table for custom link styling
CREATE TABLE IF NOT EXISTS public.link_icons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    link_url TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    icon_color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral_codes table for growth features
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create backup_exports table for data portability
CREATE TABLE IF NOT EXISTS public.backup_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL DEFAULT 'full',
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT backup_exports_type_check CHECK (export_type IN ('full', 'profile', 'analytics')),
    CONSTRAINT backup_exports_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_domains_profile_id ON public.custom_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_is_verified ON public.custom_domains(is_verified);

CREATE INDEX IF NOT EXISTS idx_link_icons_profile_id ON public.link_icons(profile_id);

CREATE INDEX IF NOT EXISTS idx_referral_codes_profile_id ON public.referral_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON public.referral_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_backup_exports_profile_id ON public.backup_exports(profile_id);
CREATE INDEX IF NOT EXISTS idx_backup_exports_status ON public.backup_exports(status);

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON public.custom_domains;
CREATE TRIGGER update_custom_domains_updated_at 
  BEFORE UPDATE ON public.custom_domains 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_link_icons_updated_at ON public.link_icons;
CREATE TRIGGER update_link_icons_updated_at 
  BEFORE UPDATE ON public.link_icons 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER update_referral_codes_updated_at 
  BEFORE UPDATE ON public.referral_codes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = notifications.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for custom_domains (public read for verification)
CREATE POLICY "Anyone can view custom domains" ON public.custom_domains
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own domains" ON public.custom_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = custom_domains.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for link_icons
CREATE POLICY "Anyone can view link icons" ON public.link_icons
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own link icons" ON public.link_icons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = link_icons.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for referral_codes
CREATE POLICY "Anyone can view active referral codes" ON public.referral_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own referral codes" ON public.referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = referral_codes.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for backup_exports
CREATE POLICY "Users can view their own backup exports" ON public.backup_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = backup_exports.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own backup exports" ON public.backup_exports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = backup_exports.profile_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT ALL ON public.custom_domains TO anon, authenticated;
GRANT ALL ON public.link_icons TO anon, authenticated;
GRANT ALL ON public.referral_codes TO anon, authenticated;
GRANT ALL ON public.backup_exports TO anon, authenticated;

-- Insert some default gift options if gifts table is empty
INSERT INTO public.gifts (name, icon, drop_token_cost)
VALUES 
  ('Coffee', '☕', 10),
  ('Heart', '❤️', 15),
  ('Star', '⭐', 20),
  ('Trophy', '🏆', 50),
  ('Diamond', '💎', 100)
ON CONFLICT DO NOTHING;

-- Create public share link function
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_username text)
RETURNS TABLE(
  id UUID,
  username TEXT,
  business_name TEXT,
  description TEXT,
  logo TEXT,
  social_links JSONB,
  theme_settings JSONB,
  youtube_video_url TEXT,
  show_share_button BOOLEAN,
  pi_donation_message TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.business_name,
    p.description,
    p.logo,
    p.social_links,
    p.theme_settings,
    p.youtube_video_url,
    p.show_share_button,
    p.pi_donation_message,
    p.created_at
  FROM public.profiles p
  WHERE p.username = profile_username 
    AND p.is_active = true;
END;
$$;

-- Create analytics tracking function for public views
CREATE OR REPLACE FUNCTION public.track_profile_view(
  profile_username text,
  visitor_ip text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  location_country text DEFAULT NULL,
  location_city text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_profile_id UUID;
BEGIN
  -- Get the profile ID
  SELECT id INTO target_profile_id
  FROM public.profiles
  WHERE username = profile_username
    AND is_active = true;
    
  -- Insert analytics record if profile exists
  IF target_profile_id IS NOT NULL THEN
    INSERT INTO public.analytics (
      profile_id,
      event_type,
      event_data,
      visitor_ip,
      user_agent,
      location_country,
      location_city
    )
    VALUES (
      target_profile_id,
      'view',
      '{"source": "public_share"}',
      visitor_ip,
      user_agent,
      location_country,
      location_city
    );
  END IF;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_profile_view(text, text, text, text, text) TO anon, authenticated;

-- Update existing RLS policies to be more permissive for public sharing
-- Allow anyone to view profiles (for public sharing)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (is_active = true);

-- Allow anyone to insert analytics (for public tracking)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics" ON public.analytics
  FOR INSERT WITH CHECK (true);

-- Create a policy for users to manage their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);