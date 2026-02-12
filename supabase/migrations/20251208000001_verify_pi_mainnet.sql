-- =====================================================
-- Pi Network Mainnet Integration - Verification Script
-- Run this after applying the main migration to verify everything works
-- =====================================================

-- 1. VERIFY TABLE STRUCTURE
-- =====================================================

\echo '\n=== 1. Verifying Tables Exist ==='

SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count,
    obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass) as description
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
    AND t.table_name IN (
        'profiles',
        'pi_transactions',
        'pi_ad_interactions',
        'pi_payment_links'
    )
ORDER BY t.table_name;

-- 2. VERIFY PI NETWORK COLUMNS IN PROFILES
-- =====================================================

\echo '\n=== 2. Verifying Pi Network Columns in Profiles ==='

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    col_description(('"public"."profiles"')::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_name = 'profiles' 
    AND (column_name LIKE '%pi_%' OR column_name IN ('environment', 'wallet_verified', 'display_name'))
ORDER BY column_name;

-- 3. VERIFY INDEXES
-- =====================================================

\echo '\n=== 3. Verifying Indexes ==='

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (tablename LIKE '%pi_%' OR indexname LIKE '%pi_%')
ORDER BY tablename, indexname;

-- 4. VERIFY FUNCTIONS
-- =====================================================

\echo '\n=== 4. Verifying Functions ==='

SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition IS NOT NULL as has_definition,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (routine_name LIKE '%pi%' OR routine_name LIKE '%authenticate%')
ORDER BY routine_name;

-- 5. VERIFY RLS POLICIES
-- =====================================================

\echo '\n=== 5. Verifying RLS Policies ==='

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using,
    with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'public'
    AND (tablename LIKE '%pi_%' OR tablename = 'profiles')
ORDER BY tablename, policyname;

-- 6. VERIFY FOREIGN KEY CONSTRAINTS
-- =====================================================

\echo '\n=== 6. Verifying Foreign Key Constraints ==='

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name LIKE '%pi_%' OR ccu.table_name LIKE '%pi_%')
ORDER BY tc.table_name;

-- 7. VERIFY CHECK CONSTRAINTS
-- =====================================================

\echo '\n=== 7. Verifying Check Constraints ==='

SELECT
    tc.table_name,
    cc.check_clause,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND (tc.table_name LIKE '%pi_%' OR tc.table_name = 'profiles')
ORDER BY tc.table_name, tc.constraint_name;

-- 8. TEST FUNCTION: authenticate_pi_user
-- =====================================================

\echo '\n=== 8. Testing authenticate_pi_user Function ==='

-- Test with new user
SELECT authenticate_pi_user(
    'test_pi_mainnet_user_001',
    'testmainnetuser',
    'test_access_token_mainnet_001',
    'GTEST123MAINNET456',
    'Test Mainnet User'
) as authentication_result;

-- Verify the user was created
SELECT 
    id,
    username,
    pi_user_id,
    pi_username,
    pi_mainnet_wallet,
    wallet_verified,
    environment,
    pi_payment_enabled,
    pi_ads_enabled,
    last_pi_auth IS NOT NULL as has_auth_timestamp,
    created_at
FROM profiles
WHERE pi_user_id = 'test_pi_mainnet_user_001';

-- Test authentication again (should update existing user)
SELECT authenticate_pi_user(
    'test_pi_mainnet_user_001',
    'testmainnetuser',
    'test_access_token_mainnet_002',
    'GTEST123MAINNET789',
    'Updated Test User'
) as re_authentication_result;

-- 9. TEST FUNCTION: record_pi_transaction
-- =====================================================

\echo '\n=== 9. Testing record_pi_transaction Function ==='

-- Get the test user's profile_id
DO $$
DECLARE
    test_profile_id UUID;
BEGIN
    SELECT id INTO test_profile_id FROM profiles WHERE pi_user_id = 'test_pi_mainnet_user_001' LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        -- Record a test transaction
        PERFORM record_pi_transaction(
            test_profile_id,
            'test_pi_mainnet_user_001',
            'txn_test_mainnet_001',
            'pay_test_mainnet_001',
            'subscription',
            15.00,
            'Test Premium Subscription',
            '{"plan": "premium", "billing": "monthly"}'::jsonb
        );
        
        RAISE NOTICE 'Test transaction recorded successfully';
    ELSE
        RAISE NOTICE 'Test user not found';
    END IF;
END $$;

-- Verify transaction was recorded
SELECT 
    id,
    profile_id,
    pi_user_id,
    transaction_id,
    payment_id,
    transaction_type,
    amount,
    status,
    network,
    memo,
    metadata,
    created_at
FROM pi_transactions
WHERE pi_user_id = 'test_pi_mainnet_user_001';

-- 10. TEST FUNCTION: update_pi_transaction_status
-- =====================================================

\echo '\n=== 10. Testing update_pi_transaction_status Function ==='

-- Update transaction to approved
SELECT update_pi_transaction_status(
    'txn_test_mainnet_001',
    'approved',
    NULL,
    NULL
) as status_update_approved;

-- Update transaction to completed with blockchain txid
SELECT update_pi_transaction_status(
    'txn_test_mainnet_001',
    'completed',
    'BLOCKCHAIN_TXID_123456789',
    NULL
) as status_update_completed;

-- Verify status was updated
SELECT 
    transaction_id,
    status,
    blockchain_txid,
    approved_at IS NOT NULL as was_approved,
    completed_at IS NOT NULL as was_completed,
    updated_at
FROM pi_transactions
WHERE transaction_id = 'txn_test_mainnet_001';

-- 11. TEST FUNCTION: record_pi_ad_interaction
-- =====================================================

\echo '\n=== 11. Testing record_pi_ad_interaction Function ==='

DO $$
DECLARE
    test_profile_id UUID;
BEGIN
    SELECT id INTO test_profile_id FROM profiles WHERE pi_user_id = 'test_pi_mainnet_user_001' LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        -- Record rewarded ad interaction
        PERFORM record_pi_ad_interaction(
            test_profile_id,
            'test_pi_mainnet_user_001',
            'rewarded',
            'AD_REWARDED',
            true,
            0.001,
            '{"ad_campaign": "test_campaign"}'::jsonb
        );
        
        -- Record interstitial ad interaction
        PERFORM record_pi_ad_interaction(
            test_profile_id,
            'test_pi_mainnet_user_001',
            'interstitial',
            'AD_CLOSED',
            false,
            NULL,
            '{"ad_campaign": "test_campaign_2"}'::jsonb
        );
        
        RAISE NOTICE 'Test ad interactions recorded successfully';
    END IF;
END $$;

-- Verify ad interactions
SELECT 
    id,
    profile_id,
    pi_user_id,
    ad_type,
    ad_result,
    reward_granted,
    reward_amount,
    network,
    created_at
FROM pi_ad_interactions
WHERE pi_user_id = 'test_pi_mainnet_user_001'
ORDER BY created_at DESC;

-- 12. TEST FUNCTION: get_pi_user_profile
-- =====================================================

\echo '\n=== 12. Testing get_pi_user_profile Function ==='

-- Get profile by pi_user_id
SELECT get_pi_user_profile('test_pi_mainnet_user_001') as profile_by_pi_user_id;

-- Get profile by pi_username
SELECT get_pi_user_profile('testmainnetuser') as profile_by_username;

-- Get profile by username
SELECT get_pi_user_profile('testmainnetuser') as profile_by_regular_username;

-- Test with non-existent user
SELECT get_pi_user_profile('nonexistentuser123') as profile_not_found;

-- 13. VERIFY DATA INTEGRITY
-- =====================================================

\echo '\n=== 13. Verifying Data Integrity ==='

-- Count records in each Pi table
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT pi_user_id) FILTER (WHERE pi_user_id IS NOT NULL) as unique_pi_users,
    COUNT(*) FILTER (WHERE environment = 'mainnet') as mainnet_users,
    COUNT(*) FILTER (WHERE wallet_verified = true) as verified_wallets
FROM profiles

UNION ALL

SELECT 
    'pi_transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT pi_user_id) as unique_pi_users,
    COUNT(*) FILTER (WHERE network = 'mainnet') as mainnet_records,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_transactions
FROM pi_transactions

UNION ALL

SELECT 
    'pi_ad_interactions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT pi_user_id) as unique_pi_users,
    COUNT(*) FILTER (WHERE network = 'mainnet') as mainnet_records,
    COUNT(*) FILTER (WHERE reward_granted = true) as rewarded_ads
FROM pi_ad_interactions

UNION ALL

SELECT 
    'pi_payment_links' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT pi_user_id) as unique_pi_users,
    COUNT(*) FILTER (WHERE network = 'mainnet') as mainnet_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_links
FROM pi_payment_links;

-- 14. VERIFY PERMISSIONS
-- =====================================================

\echo '\n=== 14. Verifying Table Permissions ==='

SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND (table_name LIKE '%pi_%' OR table_name = 'profiles')
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 15. PERFORMANCE CHECK
-- =====================================================

\echo '\n=== 15. Performance Check - Explain Plans ==='

-- Check authentication query performance
EXPLAIN ANALYZE
SELECT * FROM profiles 
WHERE pi_user_id = 'test_pi_mainnet_user_001';

-- Check transaction query performance
EXPLAIN ANALYZE
SELECT * FROM pi_transactions 
WHERE profile_id IN (SELECT id FROM profiles WHERE pi_user_id = 'test_pi_mainnet_user_001')
ORDER BY created_at DESC
LIMIT 10;

-- 16. CLEANUP TEST DATA (OPTIONAL)
-- =====================================================

\echo '\n=== 16. Cleanup Test Data (Optional) ==='

-- Uncomment to remove test data
/*
DELETE FROM pi_ad_interactions WHERE pi_user_id = 'test_pi_mainnet_user_001';
DELETE FROM pi_transactions WHERE pi_user_id = 'test_pi_mainnet_user_001';
DELETE FROM profiles WHERE pi_user_id = 'test_pi_mainnet_user_001';

\echo 'Test data cleaned up'
*/

-- 17. FINAL SUMMARY
-- =====================================================

\echo '\n=== 17. Final Summary ==='

SELECT 
    'Pi Network Mainnet Integration' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_transactions')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_ad_interactions')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pi_payment_links')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'authenticate_pi_user')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'record_pi_transaction')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_pi_user_profile')
        THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as status,
    NOW() as verification_timestamp;

\echo '\n=== Verification Complete ==='
\echo 'If all tests passed, your Pi Network Mainnet integration is ready!'
\echo 'API Key: 96tnxytg82pevnvvxfowap4bwctcxo6wkp2dexoraevtj8svh0mvqxttpbtwvjm5'
\echo 'Network: mainnet'
\echo 'Environment: Production'
