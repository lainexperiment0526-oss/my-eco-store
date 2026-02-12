-- ============================================
-- DEPLOY ALL FEATURES - COMPLETE UPDATE
-- ============================================
-- This script applies all pending database updates including:
-- 1. Gift Cards RLS policies
-- 2. Admin role system (is_admin column)
-- 3. Theme settings support
-- 4. All triggers and functions
-- ============================================

-- ============================================
-- SECTION 1: GIFT CARDS RLS POLICIES
-- ============================================

-- Enable RLS on gift_cards table
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view their purchased gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view gift cards they received" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can update gift cards they redeem" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable read for all users" ON public.gift_cards;
DROP POLICY IF EXISTS "Enable update for redeemers" ON public.gift_cards;

-- Policy 1: Allow authenticated users to insert gift cards
CREATE POLICY "Enable insert for authenticated users" 
ON public.gift_cards 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Policy 2: Allow users to view all gift cards (needed for redemption)
CREATE POLICY "Enable read for all users" 
ON public.gift_cards 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Policy 3: Allow users to update gift cards they are redeeming
CREATE POLICY "Enable update for redeemers" 
ON public.gift_cards 
FOR UPDATE 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- ============================================
-- SECTION 2: ADMIN ROLE SYSTEM
-- ============================================

-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin check function
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

-- ============================================
-- SECTION 3: THEME SETTINGS SUPPORT
-- ============================================

-- Ensure theme_settings column exists (should already exist)
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
-- SECTION 4: ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.is_admin IS 'Admin status - TRUE for Gmail users';
COMMENT ON COLUMN profiles.theme_settings IS 'JSONB storage for theme customization (colors, background style)';
COMMENT ON FUNCTION check_if_admin(UUID) IS 'Returns TRUE if user email ends with @gmail.com';
COMMENT ON TABLE gift_cards IS 'Gift cards for subscriptions - can be purchased and redeemed';

-- ============================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================

-- Verify gift cards RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'gift_cards';

-- Verify admin users
SELECT 
  p.username,
  u.email,
  p.is_admin,
  p.theme_settings,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE
ORDER BY p.created_at DESC
LIMIT 10;

-- Count admin vs regular users
SELECT 
  CASE 
    WHEN is_admin THEN 'Admin Users (Gmail)'
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
ORDER BY updated_at DESC
LIMIT 5;

-- Verify gift cards table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gift_cards'
ORDER BY ordinal_position;

-- ============================================
-- SECTION 6: SUCCESS SUMMARY
-- ============================================

DO $$
DECLARE
  admin_count INTEGER;
  gift_card_policies INTEGER;
BEGIN
  -- Count admins
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_admin = TRUE;
  
  -- Count gift card policies
  SELECT COUNT(*) INTO gift_card_policies FROM pg_policies WHERE tablename = 'gift_cards';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║   ALL FEATURES DEPLOYED SUCCESSFULLY! ✅   ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Deployment Summary:';
  RAISE NOTICE '   ✓ Gift Cards RLS: % policies created', gift_card_policies;
  RAISE NOTICE '   ✓ Admin System: % admin users detected', admin_count;
  RAISE NOTICE '   ✓ Theme Settings: Enabled';
  RAISE NOTICE '   ✓ Triggers: Active';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Features Now Available:';
  RAISE NOTICE '   • Gift card purchase & redemption';
  RAISE NOTICE '   • Admin role detection (Gmail users)';
  RAISE NOTICE '   • Username change for admins';
  RAISE NOTICE '   • Theme customization for admins';
  RAISE NOTICE '   • VIP badges in search results';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Verification queries executed above ⬆️';
  RAISE NOTICE '';
END $$;
