-- Add email authentication support
-- Track authentication method for users
ALTER TABLE public.profiles 
ADD COLUMN auth_method TEXT DEFAULT 'pi' CHECK (auth_method IN ('pi', 'email'));

-- Add email verification status
ALTER TABLE public.profiles 
ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Add user preferences for OpenApp application usage
ALTER TABLE public.profiles 
ADD COLUMN uses_openapp BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_profiles_auth_method ON public.profiles(auth_method);
CREATE INDEX idx_profiles_email_verified ON public.profiles(email_verified);

-- Update trigger to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, auth_method, email_verified)
  VALUES (new.id, new.email, 
    CASE 
      WHEN new.email LIKE '%@pi.user' THEN 'pi'
      ELSE 'email'
    END,
    CASE 
      WHEN new.email LIKE '%@pi.user' THEN false
      ELSE false -- Will be set to true after email verification
    END);
  RETURN new;
END;
$$;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add policy for users to update their own auth preferences
CREATE POLICY "Users can update own auth preferences" ON public.profiles FOR UPDATE 
  TO authenticated USING (auth.uid() = id);
