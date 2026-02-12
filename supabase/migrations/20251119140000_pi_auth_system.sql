-- Pi Network Authentication System with Username Support
-- This migration creates the complete Pi auth system for DropLink

-- First, let's ensure the profiles table has all necessary Pi Network fields
DO $$
BEGIN
    -- Add Pi Network specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_user_id TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_profiles_pi_user_id ON public.profiles(pi_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_username') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_username TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_profiles_pi_username ON public.profiles(pi_username);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_access_token') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_wallet_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pi_last_auth') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_last_auth TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Update user_id to store pi_user_id for compatibility
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
        -- This will be our primary Pi user ID field
        NULL; -- user_id field already exists
    END IF;
END $$;

-- Function to authenticate or create Pi Network user
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
            p_pi_username, -- Default business name to username
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
    
    -- Get the final profile data
    SELECT * INTO user_profile FROM profiles WHERE id = profile_id;
    
    result := json_build_object(
        'success', true,
        'is_new_user', is_new_user,
        'profile_id', profile_id,
        'user_data', json_build_object(
            'id', user_profile.id,
            'username', user_profile.username,
            'business_name', user_profile.business_name,
            'pi_user_id', user_profile.pi_user_id,
            'pi_username', user_profile.pi_username,
            'pi_wallet_address', user_profile.pi_wallet_address,
            'pi_wallet_verified', user_profile.pi_wallet_verified,
            'has_premium', user_profile.has_premium,
            'theme_settings', user_profile.theme_settings,
            'created_at', user_profile.created_at,
            'last_auth', user_profile.pi_last_auth
        ),
        'message', CASE 
            WHEN is_new_user THEN 'Welcome to DropLink! Your Pi account has been created.'
            ELSE 'Welcome back! Successfully authenticated with Pi Network.'
        END
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Authentication failed: ' || SQLERRM,
        'error_code', 'AUTH_ERROR'
    );
END;
$$;

-- Function to get Pi user profile by username or ID
CREATE OR REPLACE FUNCTION get_pi_user_profile(
    p_identifier TEXT -- Can be username or pi_user_id
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    result JSON;
BEGIN
    -- Look up user by various identifiers
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE pi_username = p_identifier 
       OR pi_user_id = p_identifier 
       OR username = p_identifier
       OR user_id = p_identifier
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    result := json_build_object(
        'success', true,
        'user_data', json_build_object(
            'id', user_profile.id,
            'username', user_profile.username,
            'business_name', user_profile.business_name,
            'pi_user_id', user_profile.pi_user_id,
            'pi_username', user_profile.pi_username,
            'pi_wallet_address', user_profile.pi_wallet_address,
            'pi_wallet_verified', user_profile.pi_wallet_verified,
            'has_premium', user_profile.has_premium,
            'description', user_profile.description,
            'logo', user_profile.logo,
            'theme_settings', user_profile.theme_settings,
            'social_links', user_profile.social_links,
            'youtube_video_url', user_profile.youtube_video_url,
            'created_at', user_profile.created_at,
            'last_auth', user_profile.pi_last_auth
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to get user profile: ' || SQLERRM
    );
END;
$$;

-- Function to update Pi user profile
CREATE OR REPLACE FUNCTION update_pi_user_profile(
    p_pi_user_id TEXT,
    p_updates JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id UUID;
    result JSON;
BEGIN
    -- Get profile ID
    SELECT id INTO profile_id 
    FROM profiles 
    WHERE pi_user_id = p_pi_user_id OR user_id = p_pi_user_id
    LIMIT 1;
    
    IF profile_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Update profile with provided fields
    UPDATE profiles SET
        business_name = COALESCE(p_updates->>'business_name', business_name),
        description = COALESCE(p_updates->>'description', description),
        pi_wallet_address = COALESCE(p_updates->>'pi_wallet_address', pi_wallet_address),
        logo = COALESCE(p_updates->>'logo', logo),
        youtube_video_url = COALESCE(p_updates->>'youtube_video_url', youtube_video_url),
        theme_settings = COALESCE((p_updates->>'theme_settings')::JSON, theme_settings),
        social_links = COALESCE((p_updates->>'social_links')::JSON, social_links),
        updated_at = NOW()
    WHERE id = profile_id;
    
    result := json_build_object(
        'success', true,
        'profile_id', profile_id,
        'message', 'Profile updated successfully'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Failed to update profile: ' || SQLERRM
    );
END;
$$;

-- Function to check Pi username availability
CREATE OR REPLACE FUNCTION check_pi_username_availability(
    p_username TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_available BOOLEAN;
    suggested_username TEXT;
    username_count INTEGER;
BEGIN
    -- Clean and validate username
    p_username := TRIM(LOWER(p_username));
    
    -- Check minimum length
    IF LENGTH(p_username) < 3 THEN
        RETURN json_build_object(
            'available', false,
            'error', 'Username must be at least 3 characters long'
        );
    END IF;
    
    -- Count existing usernames
    SELECT COUNT(*) INTO username_count
    FROM profiles 
    WHERE LOWER(username) = p_username 
       OR LOWER(pi_username) = p_username;
    
    is_available := (username_count = 0);
    
    -- Generate suggestion if not available
    IF NOT is_available THEN
        suggested_username := p_username || '_' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;
    
    RETURN json_build_object(
        'available', is_available,
        'username', p_username,
        'suggested_username', suggested_username,
        'existing_count', username_count
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'available', false,
        'error', SQLERRM
    );
END;
$$;

-- Function to validate Pi access token (placeholder for Pi API integration)
CREATE OR REPLACE FUNCTION validate_pi_access_token(
    p_access_token TEXT,
    p_pi_user_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_valid BOOLEAN := true; -- In real implementation, this would call Pi API
BEGIN
    -- This is a placeholder function
    -- In production, this should validate the token with Pi Network API
    
    IF p_access_token IS NULL OR LENGTH(p_access_token) < 10 THEN
        is_valid := false;
    END IF;
    
    RETURN json_build_object(
        'valid', is_valid,
        'pi_user_id', p_pi_user_id,
        'verified_at', NOW(),
        'message', CASE 
            WHEN is_valid THEN 'Token is valid'
            ELSE 'Invalid access token'
        END
    );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pi_auth ON public.profiles(pi_user_id, pi_username);
CREATE INDEX IF NOT EXISTS idx_profiles_pi_last_auth ON public.profiles(pi_last_auth);
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles(LOWER(username));

-- Grant permissions
GRANT EXECUTE ON FUNCTION authenticate_pi_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pi_user_profile(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pi_user_profile(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_pi_user_profile(TEXT, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION check_pi_username_availability(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_pi_username_availability(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_pi_access_token(TEXT, TEXT) TO authenticated;

-- Create a view for public user profiles
CREATE OR REPLACE VIEW public_pi_profiles AS
SELECT 
    id,
    username,
    business_name,
    pi_username,
    description,
    logo,
    theme_settings,
    social_links,
    youtube_video_url,
    has_premium,
    created_at,
    pi_wallet_verified
FROM profiles
WHERE username IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public_pi_profiles TO authenticated;
GRANT SELECT ON public_pi_profiles TO anon;

-- Add some helpful comments
COMMENT ON FUNCTION authenticate_pi_user IS 'Authenticates a Pi Network user and creates/updates their profile';
COMMENT ON FUNCTION get_pi_user_profile IS 'Retrieves a Pi user profile by username or ID';
COMMENT ON FUNCTION update_pi_user_profile IS 'Updates Pi user profile information';
COMMENT ON FUNCTION check_pi_username_availability IS 'Checks if a Pi username is available';

-- Final success message
SELECT 'Pi Network Authentication System installed successfully! 🥧' AS status;