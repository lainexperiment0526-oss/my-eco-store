-- Add email and auth_method columns to profiles table for Gmail/email authentication

-- Add email column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add auth_method column to track authentication method
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pi_network' 
CHECK (auth_method IN ('pi_network', 'email', 'google', 'github'));

-- Add pi_user_id column if it doesn't exist (for Pi Network users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_user_id TEXT;

-- Add pi_username column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_username TEXT;

-- Add pi_access_token column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_access_token TEXT;

-- Add pi_wallet_verified column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pi_wallet_verified BOOLEAN DEFAULT false;

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id 
AND p.email IS NULL;

-- Clean up duplicate emails by keeping only the most recent profile
-- This prevents unique constraint violations
WITH duplicates AS (
  SELECT email, 
         id,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.profiles
  WHERE email IS NOT NULL AND email != ''
)
UPDATE public.profiles
SET email = NULL
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_method ON public.profiles(auth_method);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Drop existing index if it has issues
DROP INDEX IF EXISTS idx_profiles_email_unique;

-- Create unique constraint on email (only for non-null and non-empty values)
CREATE UNIQUE INDEX idx_profiles_email_unique 
ON public.profiles(email) 
WHERE email IS NOT NULL AND email != '';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.email IS 'User email address from auth.users for email/Gmail authentication';
COMMENT ON COLUMN public.profiles.auth_method IS 'Authentication method: pi_network, email, google, or github';
COMMENT ON COLUMN public.profiles.pi_user_id IS 'Pi Network user ID for Pi authentication';
COMMENT ON COLUMN public.profiles.pi_username IS 'Pi Network username';

-- Create or replace function to automatically sync email from auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an email/oauth user, sync email
  IF NEW.email IS NOT NULL THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email when auth.users is updated
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- Update RLS policies to include email-based authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.uid()::text = user_id::text
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.uid()::text = user_id::text
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.uid()::text = user_id::text
  );

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Email and Gmail authentication support added to profiles table!' as status;
