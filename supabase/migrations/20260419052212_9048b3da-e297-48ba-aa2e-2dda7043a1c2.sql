-- Affiliate referral system
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS apk_installed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS apk_installed_at timestamptz;

-- Generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Backfill existing profiles
UPDATE public.profiles
SET referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Affiliate rewards ledger
CREATE TABLE IF NOT EXISTS public.affiliate_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('apk_install', 'app_listing')),
  amount_usd numeric NOT NULL,
  app_id uuid REFERENCES public.apps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'credited',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invitee_id, reward_type, app_id)
);

ALTER TABLE public.affiliate_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers view own rewards"
  ON public.affiliate_rewards FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = invitee_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage rewards"
  ON public.affiliate_rewards FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts rewards"
  ON public.affiliate_rewards FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_affiliate_rewards_referrer ON public.affiliate_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_rewards_invitee ON public.affiliate_rewards(invitee_id);

-- Allow users to update own referred_by + apk_installed (only when null/false)
CREATE POLICY "Users set own referred_by once"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function: credit APK install reward
CREATE OR REPLACE FUNCTION public.credit_apk_install_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.apk_installed = true 
     AND (OLD.apk_installed IS DISTINCT FROM true)
     AND NEW.referred_by IS NOT NULL 
     AND NEW.referred_by <> NEW.id THEN
    INSERT INTO public.affiliate_rewards (referrer_id, invitee_id, reward_type, amount_usd)
    VALUES (NEW.referred_by, NEW.id, 'apk_install', 1)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_apk_install ON public.profiles;
CREATE TRIGGER trg_credit_apk_install
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.credit_apk_install_reward();

-- Function: credit app listing reward when app is approved
CREATE OR REPLACE FUNCTION public.credit_app_listing_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT referred_by INTO v_referrer
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF v_referrer IS NOT NULL AND v_referrer <> NEW.user_id THEN
      INSERT INTO public.affiliate_rewards (referrer_id, invitee_id, reward_type, amount_usd, app_id)
      VALUES (v_referrer, NEW.user_id, 'app_listing', 3, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_app_listing ON public.apps;
CREATE TRIGGER trg_credit_app_listing
AFTER INSERT OR UPDATE OF status ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.credit_app_listing_reward();