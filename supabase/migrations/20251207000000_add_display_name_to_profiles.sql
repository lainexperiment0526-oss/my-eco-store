-- Add display_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;

-- Create index for display_name if not exists
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles(display_name);
