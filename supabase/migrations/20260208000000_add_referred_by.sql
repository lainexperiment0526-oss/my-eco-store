-- Add referred_by column to profiles table for tracking affiliate referrals
-- This links a user to the profile that referred them

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
        ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);
        CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
    END IF;
END $$;

-- Function to safely increment referral uses
CREATE OR REPLACE FUNCTION increment_referral_uses(code_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE referral_codes
  SET uses_count = uses_count + 1
  WHERE id = code_id;
END;
$$;
