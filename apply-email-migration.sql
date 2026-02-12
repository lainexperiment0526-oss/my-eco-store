-- Quick apply script for email support (paste this in Supabase SQL Editor)

-- Add email column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add auth_method column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'pi_network' 
CHECK (auth_method IN ('pi_network', 'email', 'google', 'github'));

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id 
AND p.email IS NULL;
-- Clean up duplicate emails by keeping only the most recent profile
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
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_method ON public.profiles(auth_method);

-- Drop existing index if it has issues
DROP INDEX IF EXISTS idx_profiles_email_unique;

-- Create unique constraint on email (only for non-null values)
CREATE UNIQUE INDEX idx_profiles_email_unique 
ON public.profiles(email) 
WHERE email IS NOT NULL AND email != '';

-- Success
SELECT 'Email support added! ✅' as status;
