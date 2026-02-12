-- Quick deployment script for admin features
-- Run this in Supabase SQL Editor to enable all admin functionality

-- ============================================
-- STEP 1: Add is_admin column to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- STEP 2: Create admin check function
-- ============================================
CREATE OR REPLACE FUNCTION check_if_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- Check if email ends with @gmail.com
  RETURN user_email LIKE '%@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Update existing profiles
-- ============================================
UPDATE profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email LIKE '%@gmail.com'
);

-- ============================================
-- STEP 4: Create auto-update trigger
-- ============================================
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

-- ============================================
-- STEP 5: Ensure theme_settings column exists
-- ============================================
-- This should already exist, but just in case
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'theme_settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_settings JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================
-- STEP 6: Add comments for documentation
-- ============================================
COMMENT ON COLUMN profiles.is_admin IS 'Admin status - TRUE for Gmail users';
COMMENT ON COLUMN profiles.theme_settings IS 'JSONB storage for theme customization (colors, background style)';
COMMENT ON FUNCTION check_if_admin(UUID) IS 'Returns TRUE if user email ends with @gmail.com';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all admin users
SELECT 
  p.username,
  u.email,
  p.is_admin,
  p.theme_settings,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at DESC;

-- Count admin vs regular users
SELECT 
  CASE 
    WHEN is_admin THEN 'Admin Users'
    ELSE 'Regular Users'
  END as user_type,
  COUNT(*) as count
FROM profiles
GROUP BY is_admin;

-- Show users with custom themes
SELECT 
  username,
  is_admin,
  theme_settings
FROM profiles
WHERE theme_settings IS NOT NULL 
  AND theme_settings != '{}'::jsonb
ORDER BY updated_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Admin features deployed successfully!';
  RAISE NOTICE '📋 Features enabled:';
  RAISE NOTICE '   - Admin identification (Gmail users)';
  RAISE NOTICE '   - Username change capability';
  RAISE NOTICE '   - Theme customization';
  RAISE NOTICE '   - VIP badges in search results';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Check verification queries above for results';
END $$;
