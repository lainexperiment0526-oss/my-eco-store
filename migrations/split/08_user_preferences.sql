-- 08_user_preferences.sql
-- User preferences + backfill + indexes
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_mode TEXT DEFAULT 'light',
  primary_color TEXT DEFAULT '#8B5CF6',
  background_color TEXT DEFAULT '#ffffff',
  store_settings JSONB DEFAULT '{
    "showFollowerCount": true,
    "showVisitCount": true,
    "allowGifts": true,
    "showCommunitySection": true,
    "showMessageForm": true,
    "showPiAds": true,
    "showSocialLinks": true,
    "enableComments": false
  }'::jsonb,
  privacy_settings JSONB DEFAULT '{
    "profileVisible": true,
    "showInSearch": true,
    "analyticsEnabled": true,
    "dataCollection": false
  }'::jsonb,
  notification_settings JSONB DEFAULT '{
    "email": true,
    "browser": true,
    "follows": true,
    "comments": true,
    "marketing": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backfill for older installs
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON public.user_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
