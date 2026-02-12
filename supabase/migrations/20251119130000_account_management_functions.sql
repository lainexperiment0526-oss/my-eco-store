-- Account Deletion and Multiple Account Management Functions
-- Add these functions to your Supabase database
-- NOTE: delete_user_account_completely will:
--   1. Delete all user data from the database
--   2. Reset subscription plans to free (all subscription records are deleted)
--   3. Allow user to create a new account with the same Pi Network username
--   4. New account will start fresh with default settings and free plan

-- Function to completely delete a user account and all associated data
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
    
    -- 11. Delete subscriptions (by profile_id) - This resets all plans to free
    DELETE FROM subscriptions WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 11a. Delete subscription_transactions (by profile_id) - Transaction history
    DELETE FROM subscription_transactions WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 11b. Delete gift_cards (purchased by or redeemed by this user)
    DELETE FROM gift_cards WHERE purchased_by_profile_id = user_id_to_delete OR redeemed_by_profile_id = user_id_to_delete;
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
    
    -- 19. Delete shortened_links (by profile_id)
    DELETE FROM shortened_links WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 20. Delete qr_codes (by profile_id)
    DELETE FROM qr_codes WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 21. Delete ai_chat_conversations (by profile_id)
    DELETE FROM ai_chat_conversations WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 22. Delete chatbot_designs (by profile_id)
    DELETE FROM chatbot_designs WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 23. Delete link_thumbnails (by profile_id)
    DELETE FROM link_thumbnails WHERE profile_id = user_id_to_delete;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_deleted := total_deleted + affected_rows;
    
    -- 24. CRITICAL: Delete ALL profiles with same pi_user_id (handles multiple accounts)
    -- This ensures the user is removed from search results
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
        'message', 'Account completely deleted. You can create a new account with the same Pi Network username.'
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
    existing_count integer;
    cleaned_username text;
    final_display_name text;
BEGIN
    -- Clean and validate inputs
    cleaned_username := TRIM(LOWER(pi_username));
    final_display_name := COALESCE(TRIM(display_name), cleaned_username);
    
    -- Validate username length
    IF LENGTH(cleaned_username) < 3 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Username must be at least 3 characters long.',
            'error_code', 'INVALID_USERNAME'
        );
    END IF;
    
    -- Check if username already exists (comprehensive check)
     SELECT COUNT(*) INTO existing_count
     FROM profiles 
     WHERE LOWER(username) = cleaned_username 
         OR LOWER(profiles.pi_username) = cleaned_username 
         OR (pi_user_id = create_pi_network_account.pi_user_id AND pi_user_id IS NOT NULL);
    
    username_exists := (existing_count > 0);
    
    -- If username exists, return error with details
    IF username_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Username "' || cleaned_username || '" is already taken. Please choose a different username.',
            'error_code', 'USERNAME_EXISTS',
            'existing_count', existing_count,
            'suggested_username', cleaned_username || '_' || EXTRACT(EPOCH FROM NOW())::bigint
        );
    END IF;
    
    -- For additional accounts, verify payment
    IF is_additional_account AND payment_amount < 10 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Additional accounts require a 10 PI payment.',
            'error_code', 'INSUFFICIENT_PAYMENT'
        );
    END IF;
    
    -- Generate new user ID
    new_user_id := gen_random_uuid();
    
    -- Create new profile with proper field mapping
    INSERT INTO profiles (
        id,
        username,
        business_name,
        created_at,
        updated_at,
        user_id,
        pi_wallet_address,
        description,
        has_premium,
        logo,
        pi_donation_message,
        show_share_button,
        social_links,
        theme_settings,
        crypto_wallets,
        bank_details,
        youtube_video_url
    ) VALUES (
        new_user_id,
        cleaned_username,
        final_display_name,
        NOW(),
        NOW(),
        pi_user_id, -- Store Pi user ID in user_id field
        NULL, -- Will be set when wallet is connected
        'DropLink user powered by Pi Network',
        false, -- Start with free plan
        NULL,
        'Send me Pi! 🥧',
        true,
        '{}',
        json_build_object(
            'primaryColor', '#3b82f6',
            'backgroundColor', '#000000',
            'backgroundType', 'color',
            'iconStyle', 'rounded',
            'buttonStyle', 'filled'
        ),
        '{}',
        '{}',
        ''
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
    IF is_additional_account AND payment_amount >= 10 THEN
        INSERT INTO payment_transactions (
            id,
            profile_id,
            transaction_id,
            payment_id,
            amount,
            sender_address,
            receiver_address,
            status,
            memo,
            pi_metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            'account_' || new_user_id::text,
            'payment_' || new_user_id::text,
            payment_amount,
            pi_user_id,
            'droplink_system',
            'completed',
            'Additional account creation fee',
            json_build_object(
                'account_type', 'additional',
                'pi_username', cleaned_username,
                'creation_fee', true,
                'pi_user_id', pi_user_id
            ),
            NOW(),
            NOW()
        );
    END IF;
    
    account_result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'username', cleaned_username,
        'display_name', final_display_name,
        'pi_user_id', pi_user_id,
        'is_additional_account', is_additional_account,
        'payment_amount', payment_amount,
        'created_at', NOW(),
        'message', 'Account created successfully!'
    );
    
    RETURN account_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Database error: ' || SQLERRM,
        'error_code', 'DATABASE_ERROR',
        'username', cleaned_username,
        'pi_user_id', pi_user_id
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
            'username', p.username,
            'display_name', p.business_name,
            'pi_user_id', p.user_id,
            'created_at', p.created_at,
            'has_premium', COALESCE(p.has_premium, false),
            'is_primary', p.created_at = (
                SELECT MIN(created_at) 
                FROM profiles 
                WHERE user_id = pi_user_id_param
            )
        ) ORDER BY p.created_at ASC
    ) INTO accounts_result
    FROM profiles p
    WHERE p.user_id = pi_user_id_param;
    
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
        WHERE user_id = pi_user_id_param 
        AND LOWER(username) = LOWER(target_username)
    ) INTO account_exists;
    
    IF NOT account_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Account not found or does not belong to this Pi user.',
            'error_code', 'ACCOUNT_NOT_FOUND'
        );
    END IF;
    
    -- Get account details
    SELECT json_build_object(
        'user_id', p.id,
        'username', p.username,
        'display_name', p.business_name,
        'pi_user_id', p.user_id,
        'has_premium', COALESCE(p.has_premium, false),
        'created_at', p.created_at
    ) INTO target_account
    FROM profiles p
    WHERE p.user_id = pi_user_id_param 
    AND LOWER(p.username) = LOWER(target_username);
    
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
    username_count integer;
BEGIN
    -- Clean and validate username
    username_to_check := TRIM(LOWER(username_to_check));
    
    -- Check if username is too short
    IF LENGTH(username_to_check) < 3 THEN
        RETURN json_build_object(
            'available', false,
            'username', username_to_check,
            'error', 'Username must be at least 3 characters long.',
            'checked_at', NOW()
        );
    END IF;
    
    -- Count existing usernames (check all possible fields)
    SELECT COUNT(*) INTO username_count
    FROM profiles 
    WHERE LOWER(username) = username_to_check 
       OR LOWER(pi_username) = username_to_check 
       OR LOWER(business_name) = username_to_check;
    
    -- Username is available if count is 0
    is_available := (username_count = 0);
    
    -- If not available, suggest an alternative
    IF NOT is_available THEN
        suggested_username := username_to_check || '_' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;
    
    RETURN json_build_object(
        'available', is_available,
        'username', username_to_check,
        'suggested_username', suggested_username,
        'existing_count', username_count,
        'checked_at', NOW()
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'available', false,
        'error', SQLERRM,
        'username', username_to_check
    );
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account_completely(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_pi_network_account(text, text, text, boolean, decimal) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accounts_by_pi_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_to_account(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_availability(text) TO authenticated;

-- Function to completely clean Pi user data before creating new account
CREATE OR REPLACE FUNCTION cleanup_pi_user_data(pi_user_id_param text, pi_username_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_result json;
    total_cleaned integer := 0;
    affected_rows integer;
BEGIN
    -- Clean all data associated with this Pi user ID and username
    
    -- 1. Delete from voting tables
    DELETE FROM voting_votes WHERE pi_user_id = pi_user_id_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    DELETE FROM voting_submissions WHERE pi_user_id = pi_user_id_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 2. Delete user preferences for all profiles with this pi_user_id
    DELETE FROM user_preferences WHERE user_id IN (
        SELECT id FROM profiles WHERE pi_user_id = pi_user_id_param OR username = pi_username_param
    );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 3. Delete user sessions
    DELETE FROM user_sessions WHERE pi_user_id = pi_user_id_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 4. Delete profile financial data
    DELETE FROM profile_financial_data WHERE profile_id IN (
        SELECT id FROM profiles WHERE pi_user_id = pi_user_id_param OR username = pi_username_param
    );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 5. Delete feature usage
    DELETE FROM feature_usage WHERE pi_user_id = pi_user_id_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 6. Delete analytics and other tables
    DELETE FROM analytics WHERE profile_id IN (
        SELECT id FROM profiles WHERE pi_user_id = pi_user_id_param OR username = pi_username_param
    );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 7. Delete payment related data
    DELETE FROM payment_transactions WHERE profile_id IN (
        SELECT id FROM profiles WHERE pi_user_id = pi_user_id_param OR username = pi_username_param
    );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    DELETE FROM payment_links WHERE pi_user_id = pi_user_id_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    -- 8. Finally delete all profiles with this pi_user_id or username
    DELETE FROM profiles WHERE pi_user_id = pi_user_id_param OR username = pi_username_param;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    total_cleaned := total_cleaned + affected_rows;
    
    cleanup_result := json_build_object(
        'success', true,
        'pi_user_id', pi_user_id_param,
        'pi_username', pi_username_param,
        'total_records_cleaned', total_cleaned,
        'cleaned_at', NOW(),
        'message', 'All data cleaned. Ready for fresh account creation.'
    );
    
    RETURN cleanup_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'pi_user_id', pi_user_id_param
    );
END;
$$;

-- Grant permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_pi_user_data(text, text) TO authenticated;