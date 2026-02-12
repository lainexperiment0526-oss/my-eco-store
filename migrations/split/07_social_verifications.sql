-- 07_social_verifications.sql
-- Social media verification + indexes
CREATE TABLE IF NOT EXISTS public.social_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  verification_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  follower_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_verifications_profile_id ON public.social_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_social_verifications_platform ON public.social_verifications(platform);
