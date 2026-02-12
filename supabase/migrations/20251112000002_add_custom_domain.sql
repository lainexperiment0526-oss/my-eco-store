-- Add custom_domain column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_domain text;

-- Add index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain 
ON public.profiles(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.custom_domain IS 'Custom domain connected to this profile (e.g., example.com)';

