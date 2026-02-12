-- Fix Pi Authentication UUID Type Mismatch
-- This fixes the error: "operator does not exist: uuid = text"
-- 
-- Run this SQL in your Supabase SQL Editor to update the authenticate_pi_user function

CREATE OR REPLACE FUNCTION authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    profile_id UUID;
    is_new_user BOOLEAN := false;
    result JSON;
BEGIN
    -- Check if user already exists by pi_user_id or pi_username
    -- FIXED: Removed "OR user_id = p_pi_user_id" which caused UUID = TEXT comparison error
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE pi_user_id = p_pi_user_id 
       OR pi_username = p_pi_username
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        -- Create new user profile
        is_new_user := true;
        profile_id := gen_random_uuid();
        
        INSERT INTO profiles (
            id,
            username,
            business_name,
            user_id,
            pi_user_id,
            pi_username,
            pi_wallet_address,
            pi_access_token,
            pi_last_auth,
            pi_wallet_verified,
            has_premium,
            created_at,
            updated_at,
            description,
            show_share_button,
            social_links,
            theme_settings,
            crypto_wallets,
            bank_details,
            youtube_video_url
        ) VALUES (
            profile_id,
            p_pi_username,
            p_pi_username,
            p_pi_user_id,
            p_pi_user_id,
            p_pi_username,
            p_wallet_address,
            p_access_token,
            NOW(),
            p_wallet_address IS NOT NULL,
            false,
            NOW(),
            NOW(),
            'Pi Network user on DropLink',
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
            profile_id,
            'light',
            true,
            true,
            'one_time',
            NOW(),
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
    ELSE
        -- Update existing user
        profile_id := user_profile.id;
        is_new_user := false;
        
        UPDATE profiles SET
            pi_access_token = p_access_token,
            pi_last_auth = NOW(),
            pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
            pi_wallet_verified = CASE 
                WHEN p_wallet_address IS NOT NULL THEN true 
                ELSE pi_wallet_verified 
            END,
            pi_user_id = p_pi_user_id,
            pi_username = p_pi_username,
            updated_at = NOW()
        WHERE id = profile_id;
    END IF;
    
    -- Build successful result
    SELECT json_build_object(
        'success', true,
        'is_new_user', is_new_user,
        'profile_id', profile_id,
        'user_data', json_build_object(
            'id', profile_id,
            'username', p_pi_username,
            'pi_user_id', p_pi_user_id,
            'pi_username', p_pi_username
        )
    ) INTO result;
    
    RETURN result;
    
EXCEPTION 
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'UNIQUE_VIOLATION',
            'message', 'Profile with this username already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLSTATE,
            'message', SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION authenticate_pi_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_pi_user(TEXT, TEXT, TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION authenticate_pi_user IS 'Authenticates a Pi Network user and creates/updates their profile. Fixed UUID type mismatch issue.';
