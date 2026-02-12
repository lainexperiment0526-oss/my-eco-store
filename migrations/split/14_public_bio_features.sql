-- 14_public_bio_features.sql
-- Public bio visibility toggles and enhanced profile settings
-- Adds columns to track public bio feature visibility (community, messages, pi ads, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hide_public_bio BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_public_bio_followers BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_public_bio_message_form BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_public_bio_pi_ads BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pi_wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS pi_donation_message TEXT DEFAULT 'Send me a coffee ☕';

-- Add public bio feature toggles to user_preferences store_settings (via application logic)
-- Ensures user_preferences has the structure to hold granular public bio controls

-- Index for quick lookups on bio visibility
CREATE INDEX IF NOT EXISTS idx_profiles_hide_public_bio ON public.profiles(hide_public_bio);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_wallet_address ON public.profiles(pi_wallet_address);

-- Optional: Add a dedicated table for granular feature toggles if you want database-level control
CREATE TABLE IF NOT EXISTS public.public_bio_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_followers BOOLEAN DEFAULT TRUE,
  show_message_form BOOLEAN DEFAULT TRUE,
  show_pi_ads BOOLEAN DEFAULT TRUE,
  show_gift_cards BOOLEAN DEFAULT TRUE,
  show_community_section BOOLEAN DEFAULT TRUE,
  show_social_links BOOLEAN DEFAULT TRUE,
  allow_tips BOOLEAN DEFAULT TRUE,
  allow_subscriptions BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_bio_features_profile_id ON public.public_bio_features(profile_id);

-- Verify all required columns exist for public bio features
DO $$
BEGIN
  -- Check profiles has needed columns
  PERFORM column_name FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'hide_public_bio';
  
  IF NOT FOUND THEN
    RAISE WARNING 'Missing column: profiles.hide_public_bio';
  ELSE
    RAISE NOTICE '✅ Public bio feature columns verified on profiles table';
  END IF;
END $$;
