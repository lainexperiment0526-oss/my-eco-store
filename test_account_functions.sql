-- Test script for account management functions
-- Run this after installing the main functions to verify everything works

-- Test 1: Check username availability
SELECT 'Testing username availability...' as test;
SELECT * FROM check_username_availability('testuser123');

-- Test 2: Create a test account (free)
SELECT 'Creating test account...' as test;
SELECT * FROM create_pi_network_account(
    'testuser123',
    'test_pi_user_id_123', 
    'Test User Display Name',
    false, -- not additional account (free)
    0
);

-- Test 3: Check username availability again (should now be taken)
SELECT 'Checking username availability after creation...' as test;
SELECT * FROM check_username_availability('testuser123');

-- Test 4: Try to create account with same username (should fail)
SELECT 'Testing duplicate username prevention...' as test;
SELECT * FROM create_pi_network_account(
    'testuser123',
    'test_pi_user_id_456', 
    'Another Test User',
    true, -- additional account
    10
);

-- Test 5: Create additional account with different username
SELECT 'Creating additional account...' as test;
SELECT * FROM create_pi_network_account(
    'testuser456',
    'test_pi_user_id_123', -- same Pi user, different username
    'Additional Test User',
    true, -- additional account
    10
);

-- Test 6: Get all accounts for Pi user
SELECT 'Getting all accounts for Pi user...' as test;
SELECT * FROM get_user_accounts_by_pi_id('test_pi_user_id_123');

-- Test 7: Switch to account
SELECT 'Testing account switching...' as test;
SELECT * FROM switch_to_account('test_pi_user_id_123', 'testuser456');

-- Test 8: Delete one of the test accounts
SELECT 'Testing account deletion...' as test;
-- First, get the user ID for testuser456
WITH user_to_delete AS (
    SELECT id FROM profiles WHERE pi_username = 'testuser456' LIMIT 1
)
SELECT delete_user_account_completely(id) FROM user_to_delete;

-- Test 9: Verify deletion worked
SELECT 'Verifying account deletion...' as test;
SELECT * FROM get_user_accounts_by_pi_id('test_pi_user_id_123');

-- Test 10: Clean up remaining test data
SELECT 'Cleaning up test data...' as test;
WITH user_to_delete AS (
    SELECT id FROM profiles WHERE pi_username = 'testuser123' LIMIT 1
)
SELECT delete_user_account_completely(id) FROM user_to_delete;

-- Final verification
SELECT 'Final verification - should find no test accounts...' as test;
SELECT * FROM get_user_accounts_by_pi_id('test_pi_user_id_123');

SELECT '✅ All tests completed! If no errors appeared above, the functions are working correctly.' as result;