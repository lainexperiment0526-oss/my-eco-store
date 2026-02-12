-- Add admin role support to profiles table
-- This migration adds an is_admin column and helper function to identify admin users

-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create function to check if a user is admin (has gmail.com email)
CREATE OR REPLACE FUNCTION check_if_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from auth.users table
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- Check if email ends with @gmail.com
  RETURN user_email LIKE '%@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to set is_admin flag for gmail users
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email LIKE '%@gmail.com'
);

-- Create trigger to automatically set is_admin when profile is created/updated
CREATE OR REPLACE FUNCTION set_admin_flag()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_admin := check_if_admin(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_admin_flag ON profiles;
CREATE TRIGGER trigger_set_admin_flag
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_admin_flag();

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_admin IS 'Indicates if user is an admin (has gmail.com email)';

-- Verification query
SELECT 
  p.id,
  p.username,
  p.is_admin,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at DESC
LIMIT 10;
