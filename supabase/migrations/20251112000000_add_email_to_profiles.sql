-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email address for notifications and preferences';

