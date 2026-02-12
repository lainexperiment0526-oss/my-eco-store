-- DropLink Database Setup Verification
-- Run this query in your Supabase SQL Editor to verify everything is working

-- 1. Check if all required tables exist
SELECT 'TABLE VERIFICATION' as check_type;
SELECT * FROM verify_droplink_setup();

-- 2. Get setup summary
SELECT 'SETUP SUMMARY' as check_type;
SELECT * FROM get_setup_summary();

-- 3. Check RLS policies
SELECT 'RLS POLICIES' as check_type;
SELECT schemaname, tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('payment_links', 'payment_transactions', 'user_sessions', 'feature_usage', 'profile_financial_data')
ORDER BY tablename, policyname;

-- 4. Check for any existing payment links
SELECT 'EXISTING PAYMENT LINKS' as check_type;
SELECT COUNT(*) as total_payment_links, 
       COUNT(*) FILTER (WHERE is_active = true) as active_links,
       COUNT(*) FILTER (WHERE is_active = false) as inactive_links
FROM payment_links;

-- 5. Sample payment links (if any exist)
SELECT 'SAMPLE PAYMENT LINKS' as check_type;
SELECT link_id, amount, description, payment_type, is_active, created_at
FROM payment_links 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check analytics table structure
SELECT 'ANALYTICS TABLE COLUMNS' as check_type;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analytics' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verify profile financial data
SELECT 'PROFILE FINANCIAL DATA' as check_type;
SELECT COUNT(*) as total_financial_records
FROM profile_financial_data;

-- Success message
SELECT '✅ VERIFICATION COMPLETE' as status, 
       'If all tables show OK status and no errors above, your DropLink database is ready!' as message;