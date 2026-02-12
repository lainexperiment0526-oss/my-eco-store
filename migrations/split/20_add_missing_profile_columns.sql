-- Add missing financial columns to profiles table
-- This fixes the "Profile Not Found" issue where code tries to access non-existent columns

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crypto_wallets JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS youtube_video_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_crypto_wallets ON public.profiles USING GIN(crypto_wallets);
CREATE INDEX IF NOT EXISTS idx_profiles_bank_details ON public.profiles USING GIN(bank_details);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create public read policy (allows anonymous access to profiles)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions to roles
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Verify columns were added successfully
DO $$
DECLARE
  missing_cols TEXT[] := '{}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'crypto_wallets') THEN
    missing_cols := array_append(missing_cols, 'crypto_wallets');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_details') THEN
    missing_cols := array_append(missing_cols, 'bank_details');
  END IF;
  
  IF array_length(missing_cols, 1) > 0 THEN
    RAISE WARNING 'Missing columns after migration: %', missing_cols;
  ELSE
    RAISE NOTICE '✅ All required columns added to profiles table successfully';
  END IF;
END $$;
