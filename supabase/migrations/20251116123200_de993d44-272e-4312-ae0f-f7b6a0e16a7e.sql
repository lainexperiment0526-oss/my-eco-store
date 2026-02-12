-- Fix wallet creation trigger to be idempotent and remove duplicate trigger

-- Update the wallet creation function to handle existing wallets
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to avoid duplicate key errors
  INSERT INTO public.user_wallets (profile_id, drop_tokens)
  VALUES (NEW.id, 0)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Remove the duplicate trigger (keep only one)
DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;