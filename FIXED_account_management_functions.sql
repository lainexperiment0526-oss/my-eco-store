-- FIXED Account Management Functions
-- Run this in your Supabase SQL Editor to fix the syntax errors

-- First, drop existing functions if they exist
DROP FUNCTION IF EXISTS delete_user_account_completely(uuid);
DROP FUNCTION IF EXISTS create_pi_network_account(text, text, text, boolean, decimal);
DROP FUNCTION IF EXISTS get_user_accounts_by_pi_id(text);
DROP FUNCTION IF EXISTS switch_to_account(text, text);
DROP FUNCTION IF EXISTS check_username_availability(text);

-- Function to completely delete a user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account_completely(user_id_to_delete uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deletion_result json;
    profile_data json;
    rows_deleted int;
BEGIN
    -- Get profile data before deletion for logging
    SELECT to_json(p) INTO profile_data
    FROM profiles p
    WHERE p.id = user_id_to_delete;

    -- Delete from all tables in reverse dependency order
    
    -- 1. Delete voting votes (if table exists)
    DELETE FROM voting_votes WHERE user_id = user_id_to_delete;
    
    -- 2. Delete voting submissions (if table exists)
    DELETE FROM voting_submissions WHERE user_id = user_id_to_delete;
    
    -- 3. Delete user preferences
    DELETE FROM user_preferences WHERE user_id = user_id_to_delete;
    
    -- 4. Delete user sessions (if table exists)
    DELETE FROM user_sessions WHERE user_id = user_id_to_delete;
    
    -- 5. Delete profile financial data (if table exists)
    DELETE FROM profile_financial_data WHERE profile_id = user_id_to_delete;
    
    -- 6. Delete feature usage (if table exists)
    DELETE FROM feature_usage WHERE user_id = user_id_to_delete;
    
    -- 7. Delete custom links
    DELETE FROM custom_links WHERE user_id = user_id_to_delete;
    
    -- 8. Delete analytics
    DELETE FROM analytics WHERE user_id = user_id_to_delete;
    
    -- 9. Delete payment transactions
    DELETE FROM payment_transactions WHERE user_id = user_id_to_delete;
    
    -- 10. Delete payment links
    DELETE FROM payment_links WHERE user_id = user_id_to_delete;
    
    -- 11. Finally delete the profile
    DELETE FROM profiles WHERE id = user_id_to_delete;
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;

    -- Create result
    deletion_result := json_build_object(
        'success', true,
        'user_id', user_id_to_delete,
        'deleted_at', NOW(),
        'profile_deleted', rows_deleted > 0,
        'original_profile', profile_data
    );

    RETURN deletion_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'user_id', user_id_to_delete
    );
END;
$$;

-- Function to create a new account with Pi Network authentication
CREATE OR REPLACE FUNCTION create_pi_network_account(
    pi_username text,
    pi_user_id text,
    display_name text DEFAULT NULL,
    is_additional_account boolean DEFAULT false,
    payment_amount decimal DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    account_result json;
    username_exists boolean;
BEGIN
    -- Check if username already exists (check both username and pi_username fields)
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE username = pi_username OR pi_username = create_pi_network_account.pi_username
    ) INTO username_exists;
    
    -- If username exists, return error
    IF username_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Username already exists. Please choose a different username.',
            'error_code', 'USERNAME_EXISTS'
        );
    END IF;
    
    -- If this is an additional account, verify payment
    IF is_additional_account AND payment_amount < 10 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Additional accounts require a 10 PI payment.',
            'error_code', 'INSUFFICIENT_PAYMENT'
        );
    END IF;
    
    -- Generate new user ID
    new_user_id := gen_random_uuid();
    
    -- Create new profile
    INSERT INTO profiles (
        id,
        email,
        username,
        full_name,
        pi_username,
        pi_user_id,
        wallet_address,
        plan_type,
        subscription_status,
        subscription_expires_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        pi_username || '@pi.network', -- Generate email from Pi username
        pi_username,
        COALESCE(display_name, pi_username),
        pi_username,
        pi_user_id,
        NULL, -- Will be set when wallet is connected
        'free', -- Start with free plan
        'active',
        NULL, -- No expiration for free plan
        NOW(),
        NOW()
    );
    
    -- Create default user preferences
    INSERT INTO user_preferences (
        user_id,
        theme,
        notifications_enabled,
        auto_save_enabled,
        default_payment_type,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'light',
        true,
        true,
        'one_time',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- If this is an additional account, record the payment
    IF is_additional_account THEN
        INSERT INTO payment_transactions (
            id,
            user_id,
            amount,
            currency,
            payment_type,
            payment_method,
            transaction_status,
            metadata,
            created_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            payment_amount,
            'PI',
            'account_creation',
            'pi_network',
            'completed',
            json_build_object(
                'account_type', 'additional',
                'pi_username', pi_username,
                'creation_fee', true
            ),
            NOW()
        );
    END IF;
    
    account_result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'pi_username', pi_username,
        'display_name', COALESCE(display_name, pi_username),
        'is_additional_account', is_additional_account,
        'payment_amount', payment_amount,
        'created_at', NOW()
    );
    
    RETURN account_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'DATABASE_ERROR'
    );
END;
$$;

-- Function to get all accounts for a Pi User ID
CREATE OR REPLACE FUNCTION get_user_accounts_by_pi_id(pi_user_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accounts_result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'user_id', p.id,
            'pi_username', p.pi_username,
            'display_name', p.full_name,
            'plan_type', p.plan_type,
            'subscription_status', p.subscription_status,
            'wallet_address', p.wallet_address,
            'created_at', p.created_at,
            'is_primary', p.created_at = (
                SELECT MIN(created_at) 
                FROM profiles 
                WHERE pi_user_id = pi_user_id_param
            )
        ) ORDER BY p.created_at ASC
    ) INTO accounts_result
    FROM profiles p
    WHERE p.pi_user_id = pi_user_id_param;
    
    RETURN json_build_object(
        'success', true,
        'pi_user_id', pi_user_id_param,
        'accounts', COALESCE(accounts_result, '[]'::json),
        'total_accounts', COALESCE(json_array_length(accounts_result), 0)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Function to switch between accounts
CREATE OR REPLACE FUNCTION switch_to_account(
    pi_user_id_param text,
    target_username text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_account json;
    account_exists boolean;
BEGIN
    -- Check if account exists and belongs to the Pi user
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE pi_user_id = pi_user_id_param 
        AND pi_username = target_username
    ) INTO account_exists;
    
    IF NOT account_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Account not found or does not belong to this Pi user.',
            'error_code', 'ACCOUNT_NOT_FOUND'
        );
    END IF;
    
    -- Get account details
    SELECT to_json(p) INTO target_account
    FROM profiles p
    WHERE p.pi_user_id = pi_user_id_param 
    AND p.pi_username = target_username;
    
    RETURN json_build_object(
        'success', true,
        'account', target_account,
        'switched_at', NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Function to validate username availability
CREATE OR REPLACE FUNCTION check_username_availability(username_to_check text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_available boolean;
    suggested_username text;
BEGIN
    -- Check if username is available (check both username and pi_username fields)
    SELECT NOT EXISTS(
        SELECT 1 FROM profiles 
        WHERE username = username_to_check OR pi_username = username_to_check
    ) INTO is_available;
    
    -- If not available, suggest an alternative
    IF NOT is_available THEN
        suggested_username := username_to_check || '_' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;
    
    RETURN json_build_object(
        'available', is_available,
        'username', username_to_check,
        'suggested_username', suggested_username,
        'checked_at', NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'available', false,
        'error', SQLERRM
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_user_account_completely(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_pi_network_account(text, text, text, boolean, decimal) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accounts_by_pi_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_to_account(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_availability(text) TO authenticated;

-- Test the functions (optional)
SELECT 'Account management functions installed successfully!' as status;