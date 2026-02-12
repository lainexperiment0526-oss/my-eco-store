-- Affiliate system: referral tracking, rewards, and withdrawals

-- 1) Profiles: track referral code used on signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by_code_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referred_by_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by_username'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referred_by_username TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by_code'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN referred_by_code TEXT;
  END IF;
END $$;

-- 2) Referral codes: ensure columns used by UI exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_codes' AND column_name = 'max_uses'
  ) THEN
    ALTER TABLE public.referral_codes
      ADD COLUMN max_uses INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_codes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.referral_codes
      ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 3) Reward rates per plan
CREATE TABLE IF NOT EXISTS public.affiliate_reward_rates (
  plan_type TEXT PRIMARY KEY,
  reward_pi DECIMAL(10,2) NOT NULL
);

INSERT INTO public.affiliate_reward_rates (plan_type, reward_pi)
VALUES
  ('basic', 1.00),
  ('premium', 2.00),
  ('pro', 3.00)
ON CONFLICT (plan_type) DO UPDATE
SET reward_pi = EXCLUDED.reward_pi;

-- 4) Affiliate invites (referrals that convert to subscriptions)
CREATE TABLE IF NOT EXISTS public.affiliate_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  referrer_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_username TEXT,

  plan_type TEXT NOT NULL,
  reward_pi DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN ('pending', 'earned', 'paid', 'cancelled')),

  payment_id TEXT,
  transaction_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_invites_referrer ON public.affiliate_invites(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_invites_referred ON public.affiliate_invites(referred_profile_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_invites_status ON public.affiliate_invites(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'affiliate_invites_unique_referred'
  ) THEN
    ALTER TABLE public.affiliate_invites
      ADD CONSTRAINT affiliate_invites_unique_referred UNIQUE (referred_profile_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_affiliate_invites_updated_at ON public.affiliate_invites;
CREATE TRIGGER update_affiliate_invites_updated_at
  BEFORE UPDATE ON public.affiliate_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5) Withdrawals: add withdrawal_type for affiliate payouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'withdrawal_type'
  ) THEN
    ALTER TABLE public.withdrawals
      ADD COLUMN withdrawal_type TEXT DEFAULT 'general';
  END IF;
END $$;

-- 6) RLS: allow anon (Pi auth) to read/write referral & affiliate data
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_reward_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view referral codes" ON public.referral_codes;
CREATE POLICY "Public can view referral codes"
  ON public.referral_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage referral codes" ON public.referral_codes;
CREATE POLICY "Public can manage referral codes"
  ON public.referral_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view affiliate invites" ON public.affiliate_invites;
CREATE POLICY "Public can view affiliate invites"
  ON public.affiliate_invites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can create affiliate invites" ON public.affiliate_invites;
CREATE POLICY "Public can create affiliate invites"
  ON public.affiliate_invites FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage affiliate invites" ON public.affiliate_invites;
CREATE POLICY "Service role can manage affiliate invites"
  ON public.affiliate_invites FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can view affiliate reward rates" ON public.affiliate_reward_rates;
CREATE POLICY "Public can view affiliate reward rates"
  ON public.affiliate_reward_rates FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO anon, authenticated;
GRANT SELECT ON public.affiliate_invites TO anon, authenticated;
GRANT SELECT ON public.affiliate_reward_rates TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view withdrawals" ON public.withdrawals;
CREATE POLICY "Public can view withdrawals"
  ON public.withdrawals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can create withdrawals" ON public.withdrawals;
CREATE POLICY "Public can create withdrawals"
  ON public.withdrawals FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON public.withdrawals TO anon, authenticated;
