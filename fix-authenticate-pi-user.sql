-- Fix: Add authenticate_pi_user RPC function if it doesn't exist
-- This function handles Pi Network user authentication

DROP FUNCTION IF EXISTS public.authenticate_pi_user(text, text, text, text) CASCADE;

CREATE OR REPLACE FUNCTION public.authenticate_pi_user(
    p_pi_user_id TEXT,
    p_pi_username TEXT,
    p_access_token TEXT,
    p_wallet_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile RECORD;
    profile_id UUID;
    is_new_user BOOLEAN := false;
    result JSON;
BEGIN
    -- Check if user already exists by pi_user_id or pi_username
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
            '[]'::jsonb,
            jsonb_build_object(
                'primaryColor', '#3b82f6',
                'backgroundColor', '#000000',
                'backgroundType', 'color',
                'customLinks', '[]'::jsonb
            ),
            NULL,
            NULL,
            NULL
        );
        
        result := jsonb_build_object(
            'success', true,
            'profile_id', profile_id,
            'username', p_pi_username,
            'pi_user_id', p_pi_user_id,
            'is_new_user', true,
            'message', 'New Pi user profile created successfully'
        );
    ELSE
        -- Update existing user profile
        UPDATE profiles
        SET 
            pi_access_token = p_access_token,
            pi_last_auth = NOW(),
            pi_wallet_verified = p_wallet_address IS NOT NULL,
            pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
            updated_at = NOW()
        WHERE id = user_profile.id;
        
        result := jsonb_build_object(
            'success', true,
            'profile_id', user_profile.id,
            'username', user_profile.username,
            'pi_user_id', user_profile.pi_user_id,
            'is_new_user', false,
            'message', 'Pi user profile updated successfully'
        );
    END IF;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Error authenticating Pi user: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.authenticate_pi_user(text, text, text, text) TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.authenticate_pi_user(text, text, text, text) IS 
'Authenticates a Pi Network user and creates/updates their profile in Supabase. Parameters: pi_user_id, pi_username, access_token, wallet_address (optional)';
