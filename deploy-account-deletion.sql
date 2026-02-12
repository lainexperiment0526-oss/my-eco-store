-- =====================================================
-- ACCOUNT DELETION WITH SUBSCRIPTION RESET
-- Deploy this to Supabase to update the delete function
-- =====================================================
-- 
-- This update ensures that when an account is deleted:
-- 1. ALL user data is removed from the database
-- 2. ALL subscriptions are deleted (resetting to FREE plan)
-- 3. User can create a new account with same Pi username
-- 4. New account starts fresh with default FREE plan
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS delete_user_account_completely(uuid);

-- Create updated function with subscription reset
CREATE OR REPLACE FUNCTION delete_user_account_completely(user_id_to_delete uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deletion_result json;
    profile_data json;
    affected_rows integer;
    total_deleted integer := 0;
    pi_user_id_value text;
    pi_username_value text;
BEGIN
    -- Get profile data before deletion for logging
    SELECT to_json(p), p.pi_user_id, p.pi_username INTO profile_data, pi_user_id_value, pi_username_value
    FROM profiles p
    WHERE p.id = user_id_to_delete;

    -- Delete from all tables in reverse dependency order
    
    -- 1. Delete voting votes (by user_id and pi_user_id)
    DELETE FROM voting_votes WHERE user_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 2. Delete voting submissions (by user_id and pi_user_id)
    DELETE FROM voting_submissions WHERE user_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 3. Delete user preferences
    DELETE FROM user_preferences WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 4. Delete user sessions (by user_id and pi_user_id)
    DELETE FROM user_sessions WHERE user_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 5. Delete profile financial data
    DELETE FROM profile_financial_data WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 6. Delete feature usage (by user_id and pi_user_id)
    DELETE FROM feature_usage WHERE user_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 7. Delete custom links (by user_id and pi_user_id)
    DELETE FROM custom_links WHERE user_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 8. Delete analytics (by user_id and profile_id)
    DELETE FROM analytics WHERE user_id = user_id_to_delete OR profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 9. Delete payment transactions (by user_id and profile_id)
    DELETE FROM payment_transactions WHERE user_id = user_id_to_delete OR profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 10. Delete payment links (by user_id, profile_id, and pi_user_id)
    DELETE FROM payment_links WHERE user_id = user_id_to_delete OR profile_id = user_id_to_delete OR pi_user_id = pi_user_id_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 11. IMPORTANT: Delete subscriptions (by profile_id) - This resets all plans to FREE
    -- When user creates a new account, they will start with no subscription (default FREE plan)
    DELETE FROM subscriptions WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 12. Delete gifts and gift_transactions (by profile_id and pi_user_id)
    DELETE FROM gift_transactions WHERE sender_id = user_id_to_delete OR recipient_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    DELETE FROM gifts WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 13. Delete followers (by profile_id)
    DELETE FROM followers WHERE profile_id = user_id_to_delete OR follower_profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 14. Delete AI chat messages (by profile_id)
    DELETE FROM ai_chat_messages WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 15. Delete AI support config (by profile_id)
    DELETE FROM ai_support_config WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 16. Delete payment_idempotency (by profile_id)
    DELETE FROM payment_idempotency WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 17. Delete products (by profile_id)
    DELETE FROM products WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 18. Delete user_wallets (by profile_id)
    DELETE FROM user_wallets WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 19. CRITICAL: Delete ALL profiles with same pi_user_id (handles multiple accounts)
    DELETE FROM profiles WHERE id = user_id_to_delete OR pi_user_id = pi_user_id_value OR username = pi_username_value;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;

    -- Create result
    deletion_result := json_build_object(
        'success', true,
        'user_id', user_id_to_delete,
        'pi_user_id', pi_user_id_value,
        'pi_username', pi_username_value,
        'deleted_at', NOW(),
        'total_records_deleted', total_deleted,
        'profile_existed', profile_data IS NOT NULL,
        'subscription_reset', true,
        'message', 'Account completely deleted. All subscriptions removed. You can create a new account with the same Pi Network username starting with FREE plan.'
    );

    RETURN deletion_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'user_id', user_id_to_delete,
        'pi_user_id', pi_user_id_value
    );
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account_completely(uuid) TO authenticated;

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify the function was updated:
-- =====================================================
-- SELECT routine_name, routine_definition 
-- FROM information_schema.routines 
-- WHERE routine_name = 'delete_user_account_completely';
