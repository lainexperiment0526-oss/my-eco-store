-- SQL: authenticate_pi_user
-- Purpose: Upsert Pi-authenticated users into the `profiles` table.
-- Usage: Call as an RPC from Supabase client or run in Supabase SQL editor.

-- Drop if exists
DROP FUNCTION IF EXISTS authenticate_pi_user(text, text, text, text);

CREATE OR REPLACE FUNCTION authenticate_pi_user(
  p_pi_user_id text,
  p_pi_username text,
  p_access_token text,
  p_wallet_address text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  existing_profile record;
  cleaned_username text;
  base_username text;
  suffix int := 0;
  candidate text;
  new_profile_id uuid;
BEGIN
  -- Basic normalization of username
  IF p_pi_username IS NULL OR length(trim(p_pi_username)) = 0 THEN
    base_username := 'pi_' || substring(md5(coalesce(p_pi_user_id, gen_random_uuid()::text)) for 8);
  ELSE
    base_username := lower(regexp_replace(p_pi_username, '[^a-z0-9\-]', '-', 'g'));
    base_username := regexp_replace(base_username, '-+', '-', 'g');
    base_username := regexp_replace(base_username, '(^-|-$)', '', 'g');
    IF length(base_username) < 3 THEN
      base_username := base_username || substring(md5(p_pi_user_id) for 3);
    END IF;
  END IF;

  cleaned_username := base_username;

  -- Try to find existing profile by pi_user_id OR pi_username OR username
  SELECT * INTO existing_profile FROM profiles
    WHERE pi_user_id = p_pi_user_id
    OR pi_username = p_pi_username
    OR username = cleaned_username
    LIMIT 1;

  IF FOUND THEN
    -- Update existing profile with latest Pi info
    UPDATE profiles SET
      pi_user_id = COALESCE(p_pi_user_id, pi_user_id),
      pi_username = COALESCE(p_pi_username, pi_username),
      pi_wallet_address = COALESCE(p_wallet_address, pi_wallet_address),
      pi_wallet_verified = CASE WHEN p_wallet_address IS NOT NULL THEN true ELSE pi_wallet_verified END,
      updated_at = NOW()
    WHERE id = existing_profile.id;

    SELECT json_build_object(
      'success', true,
      'message', 'Profile updated',
      'profileId', existing_profile.id,
      'user_data', to_jsonb((SELECT p FROM (SELECT id, username, business_name, pi_user_id, pi_username, pi_wallet_address, pi_wallet_verified, created_at, updated_at) AS p))
    ) INTO result;

    RETURN result;
  END IF;

  -- Ensure username uniqueness by appending a numeric suffix if needed
  candidate := cleaned_username;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = candidate OR pi_username = candidate) THEN
      EXIT;
    END IF;
    suffix := suffix + 1;
    candidate := cleaned_username || '-' || suffix::text;
    IF suffix > 1000 THEN
      RAISE EXCEPTION 'Unable to generate unique username for %', cleaned_username;
    END IF;
  END LOOP;

  -- Create the new profile row
  new_profile_id := gen_random_uuid();
  INSERT INTO profiles (
    id,
    user_id,
    email,
    username,
    business_name,
    full_name,
    pi_user_id,
    pi_username,
    pi_wallet_address,
    pi_wallet_verified,
    created_at,
    updated_at
  ) VALUES (
    new_profile_id,
    new_profile_id,
    (candidate || '@pi.network'), -- placeholder email
    candidate,
    candidate,
    candidate,
    p_pi_user_id,
    p_pi_username,
    p_wallet_address,
    (p_wallet_address IS NOT NULL),
    NOW(),
    NOW()
  );

  SELECT json_build_object(
    'success', true,
    'message', 'Profile created',
    'profileId', new_profile_id,
    'userId', new_profile_id,
    'username', candidate
  ) INTO result;

  RETURN result;

EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'error', 'USERNAME_CONFLICT', 'message', SQLERRM);
WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Give execute to authenticated role (adjust as needed)
GRANT EXECUTE ON FUNCTION authenticate_pi_user(text, text, text, text) TO authenticated;
