-- Pi Authentication Schema Verification & Setup Script
-- Run this in Supabase SQL Editor BEFORE deployment
-- This ensures all required columns exist and RPC functions are ready

-- Step 1: Ensure all required Pi auth columns exist
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking Pi auth columns...';
    
    -- Add pi_user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_user_id TEXT UNIQUE;
        CREATE INDEX idx_profiles_pi_user_id ON public.profiles(pi_user_id);
        RAISE NOTICE '✅ Added pi_user_id column';
    END IF;
    
    -- Add pi_username column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_username') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_username TEXT UNIQUE;
        CREATE INDEX idx_profiles_pi_username ON public.profiles(pi_username);
        RAISE NOTICE '✅ Added pi_username column';
    END IF;
    
    -- Add pi_access_token column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_access_token') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_access_token TEXT;
        RAISE NOTICE '✅ Added pi_access_token column';
    END IF;
    
    -- Add pi_wallet_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_wallet_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_verified BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added pi_wallet_verified column';
    END IF;
    
    -- Add pi_last_auth column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_last_auth') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_last_auth TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added pi_last_auth column';
    END IF;
    
    -- Ensure pi_wallet_address column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'pi_wallet_address') THEN
        ALTER TABLE public.profiles ADD COLUMN pi_wallet_address TEXT DEFAULT '';
        RAISE NOTICE '✅ Added pi_wallet_address column';
    END IF;
    
    RAISE NOTICE '✅ All Pi auth columns verified successfully!';
END $$;

-- Step 2: Verify all required columns are present
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Current Pi auth columns in profiles table:';
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
    'pi_user_id', 
    'pi_username', 
    'pi_access_token', 
    'pi_wallet_verified',
    'pi_last_auth',
    'pi_wallet_address'
)
ORDER BY column_name;

-- Step 3: Drop old function if it exists
DROP FUNCTION IF EXISTS public.authenticate_pi_user_safe(text, text, text, text) CASCADE;

-- Step 4: Create the safe authentication function with column validation
CREATE OR REPLACE FUNCTION public.authenticate_pi_user_safe(
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
    -- Log the authentication attempt
    RAISE NOTICE '[Pi Auth] Authenticating user: % (%)', p_pi_username, p_pi_user_id;
    
    -- Check if user already exists by pi_user_id or pi_username
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE (pi_user_id = p_pi_user_id OR pi_username = p_pi_username)
    LIMIT 1;
    
    IF user_profile IS NULL THEN
        -- Create new user profile
        is_new_user := true;
        profile_id := gen_random_uuid();
        
        RAISE NOTICE '[Pi Auth] Creating new profile for user: %', p_pi_username;
        
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
            theme_settings
        ) VALUES (
            profile_id,
            p_pi_username,
            p_pi_username,
            p_pi_user_id,
            p_pi_username,
            COALESCE(p_wallet_address, ''),
            p_access_token,
            NOW(),
            p_wallet_address IS NOT NULL,
            false,
            NOW(),
            NOW(),
            'Pi Network user on DropLink',
            true,
            '{}'::jsonb,
            jsonb_build_object(
                'primaryColor', '#3b82f6',
                'backgroundColor', '#000000',
                'backgroundType', 'color',
                'customLinks', '[]'::jsonb
            )
        );
        result := json_build_object(
            'success', true,
            'profile_id', profile_id,
            'username', p_pi_username,
            'pi_user_id', p_pi_user_id,
            'is_new_user', true,
            'message', 'New Pi user profile created successfully'
        );
        
        RAISE NOTICE '[Pi Auth] ✅ New profile created: %', profile_id;
        
    ELSE
        -- Update existing user profile
        profile_id := user_profile.id;
        
        RAISE NOTICE '[Pi Auth] Updating existing profile: %', profile_id;
        
        UPDATE profiles
        SET 
            pi_access_token = COALESCE(p_access_token, pi_access_token),
            pi_last_auth = NOW(),
            pi_wallet_verified = CASE 
                WHEN p_wallet_address IS NOT NULL THEN true 
                ELSE COALESCE(pi_wallet_verified, false)
            END,
            pi_wallet_address = CASE 
                WHEN p_wallet_address IS NOT NULL THEN p_wallet_address 
                ELSE COALESCE(pi_wallet_address, '')
            END,
            pi_user_id = COALESCE(p_pi_user_id, pi_user_id),
            pi_username = COALESCE(p_pi_username, pi_username),
            updated_at = NOW()
        WHERE id = profile_id;
        
        result := json_build_object(
            'success', true,
            'profile_id', profile_id,
            'username', user_profile.username,
            'pi_user_id', user_profile.pi_user_id,
            'is_new_user', false,
            'message', 'Pi user profile updated successfully'
        );
        
        RAISE NOTICE '[Pi Auth] ✅ Profile updated: %', profile_id;
    END IF;
    
    RETURN result;
END $$;

-- Step 5: Grant permissions to the function
GRANT EXECUTE ON FUNCTION public.authenticate_pi_user_safe(text, text, text, text) TO anon, authenticated;

-- Step 6: Refresh the schema cache and show completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ authenticate_pi_user_safe function created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Schema cache refresh notification sent to PostgREST';
    RAISE NOTICE '⏳ Please wait 30 seconds for the schema cache to reload...';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Pi Authentication setup completed successfully!';
END $$;

NOTIFY pgrst, 'reload schema';
