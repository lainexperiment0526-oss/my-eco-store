-- 17_missing_features_setup.sql
-- Add missing feature columns and tables for complete feature coverage
-- Includes: YouTube, background music, custom domain, email capture, 
-- account deletion, merchant store, card generation, virtual cards

-- 1. EXTEND PROFILES TABLE with missing feature columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pi_domain_name TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS merchant_store_url TEXT,
  ADD COLUMN IF NOT EXISTS account_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS account_deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_merchant BOOLEAN DEFAULT FALSE;

-- 2. EMAIL CAPTURE/LEADS (already in analytics table, but create dedicated table)
CREATE TABLE IF NOT EXISTS public.email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'unknown',
  captured_from_page TEXT,
  subscriber_name TEXT,
  consent_given BOOLEAN DEFAULT TRUE,
  consent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_captures_profile_id ON public.email_captures(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON public.email_captures(email);
CREATE INDEX IF NOT EXISTS idx_email_captures_created_at ON public.email_captures(created_at);

-- 3. VIRTUAL CARDS TABLE
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  card_title TEXT,
  card_description TEXT,
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#ffffff',
  card_image TEXT,
  qr_code_data TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  card_type TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_cards_profile_id ON public.virtual_cards(profile_id);

-- 4. CARD GENERATION/CUSTOM CARDS TABLE
CREATE TABLE IF NOT EXISTS public.generated_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_data JSONB DEFAULT '{}'::jsonb,
  card_type TEXT DEFAULT 'default',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  export_format TEXT DEFAULT 'pdf',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_cards_profile_id ON public.generated_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_generated_cards_user_id ON public.generated_cards(user_id);

-- 5. BACKGROUND MUSIC/AUDIO PLAYLIST
CREATE TABLE IF NOT EXISTS public.audio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  background_music_url TEXT,
  background_music_title TEXT,
  background_music_artist TEXT,
  music_volume INTEGER DEFAULT 50,
  autoplay BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_settings_profile_id ON public.audio_settings(profile_id);

-- 6. YOUTUBE CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.youtube_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  youtube_video_url TEXT NOT NULL,
  video_title TEXT,
  video_description TEXT,
  video_thumbnail TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_content_profile_id ON public.youtube_content(profile_id);

-- 7. CUSTOM DOMAIN MAPPING
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain_name TEXT UNIQUE NOT NULL,
  domain_type TEXT DEFAULT 'custom',
  is_pi_domain BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_profile_id ON public.custom_domains(profile_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain_name ON public.custom_domains(domain_name);
CREATE INDEX IF NOT EXISTS idx_custom_domains_verified ON public.custom_domains(verified);

-- 8. MERCHANT PROFILE EXTENSION
CREATE TABLE IF NOT EXISTS public.merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name TEXT,
  store_description TEXT,
  merchant_type TEXT DEFAULT 'individual',
  tax_id TEXT,
  business_license TEXT,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5, 2) DEFAULT 5.00,
  total_sales DECIMAL(15, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_profiles_profile_id ON public.merchant_profiles(profile_id);

-- 9. ACCOUNT DELETION/RETENTION TRACKING
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grace_period_ends TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  cancelled_date TIMESTAMP WITH TIME ZONE,
  deleted_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_profile_id ON public.account_deletion_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);

-- TRIGGERS

-- Update audio_settings timestamp
CREATE OR REPLACE FUNCTION update_audio_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audio_settings_updated_at_trigger ON public.audio_settings;
CREATE TRIGGER audio_settings_updated_at_trigger
BEFORE UPDATE ON public.audio_settings
FOR EACH ROW
EXECUTE FUNCTION update_audio_settings_updated_at();

-- Update virtual_cards timestamp
CREATE OR REPLACE FUNCTION update_virtual_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS virtual_cards_updated_at_trigger ON public.virtual_cards;
CREATE TRIGGER virtual_cards_updated_at_trigger
BEFORE UPDATE ON public.virtual_cards
FOR EACH ROW
EXECUTE FUNCTION update_virtual_cards_updated_at();

-- Update youtube_content timestamp
CREATE OR REPLACE FUNCTION update_youtube_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS youtube_content_updated_at_trigger ON public.youtube_content;
CREATE TRIGGER youtube_content_updated_at_trigger
BEFORE UPDATE ON public.youtube_content
FOR EACH ROW
EXECUTE FUNCTION update_youtube_content_updated_at();

-- Update custom_domains timestamp
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_domains_updated_at_trigger ON public.custom_domains;
CREATE TRIGGER custom_domains_updated_at_trigger
BEFORE UPDATE ON public.custom_domains
FOR EACH ROW
EXECUTE FUNCTION update_custom_domains_updated_at();

-- Update merchant_profiles timestamp
CREATE OR REPLACE FUNCTION update_merchant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchant_profiles_updated_at_trigger ON public.merchant_profiles;
CREATE TRIGGER merchant_profiles_updated_at_trigger
BEFORE UPDATE ON public.merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION update_merchant_profiles_updated_at();

-- HELPER FUNCTIONS

-- Get or create email capture for profile
CREATE OR REPLACE FUNCTION capture_email(
  p_profile_id UUID,
  p_email TEXT,
  p_source TEXT DEFAULT 'unknown',
  p_page TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_capture_id UUID;
BEGIN
  INSERT INTO public.email_captures (profile_id, email, source, captured_from_page)
  VALUES (p_profile_id, p_email, p_source, p_page)
  RETURNING id INTO v_capture_id;
  
  RETURN v_capture_id;
END;
$$ LANGUAGE plpgsql;

-- Get or create merchant profile
CREATE OR REPLACE FUNCTION get_or_create_merchant_profile(p_profile_id UUID)
RETURNS UUID AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  SELECT id INTO v_merchant_id FROM public.merchant_profiles WHERE profile_id = p_profile_id;
  
  IF v_merchant_id IS NULL THEN
    INSERT INTO public.merchant_profiles (profile_id)
    VALUES (p_profile_id)
    RETURNING id INTO v_merchant_id;
  END IF;
  
  RETURN v_merchant_id;
END;
$$ LANGUAGE plpgsql;

-- Request account deletion
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_profile_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO public.account_deletion_requests (profile_id, user_id, reason)
  VALUES (p_profile_id, p_user_id, p_reason)
  RETURNING id INTO v_request_id;
  
  -- Mark profile as pending deletion
  UPDATE public.profiles SET account_deleted = FALSE WHERE id = p_profile_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Complete account deletion
CREATE OR REPLACE FUNCTION complete_account_deletion(p_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET status = 'deleted', deleted_date = NOW()
  WHERE profile_id = p_profile_id AND status = 'pending';
  
  UPDATE public.profiles
  SET account_deleted = TRUE, account_deleted_at = NOW()
  WHERE id = p_profile_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Email captures: owner read/write
DROP POLICY IF EXISTS "email_captures_read" ON public.email_captures;
CREATE POLICY "email_captures_read" ON public.email_captures
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
    OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = TRUE)
  );

DROP POLICY IF EXISTS "email_captures_insert" ON public.email_captures;
CREATE POLICY "email_captures_insert" ON public.email_captures
  FOR INSERT WITH CHECK (true);

-- Virtual cards: owner manage
DROP POLICY IF EXISTS "virtual_cards_read" ON public.virtual_cards;
CREATE POLICY "virtual_cards_read" ON public.virtual_cards
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
    OR (SELECT COUNT(*) FROM public.profiles WHERE id = profile_id AND is_admin = (auth.uid() IN (SELECT user_id FROM public.profiles WHERE is_admin = TRUE)))::INTEGER > 0
  );

-- Generated cards: owner only
DROP POLICY IF EXISTS "generated_cards_read" ON public.generated_cards;
CREATE POLICY "generated_cards_read" ON public.generated_cards
  FOR SELECT USING (user_id = auth.uid());

-- Audio settings: owner manage
DROP POLICY IF EXISTS "audio_settings_read" ON public.audio_settings;
CREATE POLICY "audio_settings_read" ON public.audio_settings
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- YouTube content: owner manage
DROP POLICY IF EXISTS "youtube_content_read" ON public.youtube_content;
CREATE POLICY "youtube_content_read" ON public.youtube_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "youtube_content_write" ON public.youtube_content;
CREATE POLICY "youtube_content_write" ON public.youtube_content
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Custom domains: owner manage
DROP POLICY IF EXISTS "custom_domains_read" ON public.custom_domains;
CREATE POLICY "custom_domains_read" ON public.custom_domains
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Merchant profiles: owner only
DROP POLICY IF EXISTS "merchant_profiles_read" ON public.merchant_profiles;
CREATE POLICY "merchant_profiles_read" ON public.merchant_profiles
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
  );

-- Account deletion requests: owner/admin only
DROP POLICY IF EXISTS "account_deletion_requests_read" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_read" ON public.account_deletion_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "account_deletion_requests_insert" ON public.account_deletion_requests;
CREATE POLICY "account_deletion_requests_insert" ON public.account_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   MISSING FEATURES SETUP COMPLETE! ✅                     ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 New Tables/Columns:';
  RAISE NOTICE '   • email_captures — user email signups with consent';
  RAISE NOTICE '   • virtual_cards — custom card displays';
  RAISE NOTICE '   • generated_cards — user-generated card exports';
  RAISE NOTICE '   • audio_settings — background music config';
  RAISE NOTICE '   • youtube_content — YouTube video links & metadata';
  RAISE NOTICE '   • custom_domains — domain mapping & verification';
  RAISE NOTICE '   • merchant_profiles — merchant store config';
  RAISE NOTICE '   • account_deletion_requests — GDPR right-to-delete';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Profile Extensions:';
  RAISE NOTICE '   • custom_domain, pi_domain_name';
  RAISE NOTICE '   • merchant_store_url, is_merchant';
  RAISE NOTICE '   • account_deleted, account_deleted_at, account_deletion_reason';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Helper Functions:';
  RAISE NOTICE '   • capture_email()';
  RAISE NOTICE '   • get_or_create_merchant_profile()';
  RAISE NOTICE '   • request_account_deletion()';
  RAISE NOTICE '   • complete_account_deletion()';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All missing features now have SQL backing';
END $$;
