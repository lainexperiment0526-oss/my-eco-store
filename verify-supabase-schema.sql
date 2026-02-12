-- ================================
-- QUICK VERIFICATION & FIX SCRIPT
-- Run this in Supabase SQL Editor
-- ================================

-- 1. Check if main tables exist
SELECT 
    'profiles' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as exists
UNION ALL
SELECT 
    'pi_transactions',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pi_transactions')
UNION ALL
SELECT 
    'pi_ad_interactions',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pi_ad_interactions')
UNION ALL
SELECT 
    'wallet_tokens',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_tokens')
UNION ALL
SELECT 
    'user_sessions',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions')
UNION ALL
SELECT 
    'analytics',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics');

-- 2. Check if profile columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name LIKE 'pi_%'
ORDER BY column_name;

-- 3. Check functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('record_pi_transaction', 'update_pi_transaction_status', 'record_pi_ad_interaction', 'upsert_wallet_token')
ORDER BY routine_name;

-- 4. Test if you can query the tables (this will show any RLS issues)
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'pi_transactions', COUNT(*) FROM pi_transactions
UNION ALL
SELECT 'pi_ad_interactions', COUNT(*) FROM pi_ad_interactions
UNION ALL
SELECT 'wallet_tokens', COUNT(*) FROM wallet_tokens;
