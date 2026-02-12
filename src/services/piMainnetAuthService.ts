/**
 * Pi Network Authentication Service (Mainnet Only - Production)
 * Fixed and Simplified Authentication Flow
 * 
 * Handles:
 * - Pi access token validation
 * - User profile retrieval from Pi
 * - Supabase profile linking
 * - Complete authentication flow
 */

import { supabase } from "@/integrations/supabase/client";
import { PI_CONFIG } from "@/config/pi-config";

/**
 * Validates Pi access token via direct Pi API
 * Simple, straightforward token validation
 */
export async function validatePiAccessToken(accessToken: string) {
  if (!accessToken) {
    throw new Error('Missing Pi access token');
  }

  console.log('[Pi Auth Service] 🔐 Validating Pi access token...');
  
  try {
    // Direct Pi API validation
    const response = await fetch(`${PI_CONFIG.ENDPOINTS.ME}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired Pi access token');
      }
      throw new Error(`Token validation failed: ${response.status}`);
    }

    const piData = await response.json();
    console.log('[Pi Auth Service] ✅ Pi token validated. Username:', piData.username);
    
    return {
      uid: piData.uid,
      username: piData.username,
      wallet_address: piData.wallet_address || null,
      meta: piData.meta || {},
    };
  } catch (error: any) {
    console.error('[Pi Auth Service] ❌ Token validation error:', error);
    throw new Error(`Failed to validate Pi token: ${error.message}`);
  }
}

/**
 * Gets extended Pi user profile information
 */
export async function getPiUserProfile(accessToken: string) {
  const piData = await validatePiAccessToken(accessToken);
  
  return {
    uid: piData.uid,
    username: piData.username,
    wallet_address: piData.wallet_address || null,
    meta: piData.meta || {},
  };
}

/**
 * Links a Pi user to a Supabase profile
 * Creates new profile if not exists, updates existing if found
 */
export async function linkPiUserToSupabase(
  piData: any,
  options?: {
    createIfNotExists?: boolean;
    displayName?: string;
  }
): Promise<{ profile: any; isNew: boolean }>
{
  const { createIfNotExists = true, displayName } = options || {};
  
  console.log('[Pi Auth Service] 🔗 Linking Pi user to Supabase profile...');
  console.log(`[Pi Auth Service] Username: ${piData.username}`);

  try {
    // Find existing profile by username (pi_user_id columns don't exist, so use username)
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id,user_id,username,business_name,pi_wallet_address')
      .eq('username', piData.username)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[Pi Auth Service] ❌ Error checking profile:', selectError);
      throw selectError;
    }

    // Cast to any to avoid TS errors due to missing columns in types
    const profile = existingProfile as any;

    if (profile) {
      console.log('[Pi Auth Service] ✅ Profile already exists, updating...');
      
      // Update with latest Pi data, keep existing business_name unless missing
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          pi_wallet_address: piData.wallet_address || profile.pi_wallet_address,
          business_name: profile.business_name || displayName || piData.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('id,user_id,username,business_name,pi_wallet_address')
        .single();

      if (updateError) {
        console.error('[Pi Auth Service] ❌ Error updating profile:', updateError);
        throw updateError;
      }

      console.log('[Pi Auth Service] ✅ Profile updated');
      return { profile: updated, isNew: false };
    }

    // Create new profile if allowed
    if (createIfNotExists) {
      console.log('[Pi Auth Service] 📝 Creating new profile...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            username: piData.username,
            pi_username: piData.username,
            pi_user_id: piData.uid,
            business_name: displayName || piData.username,
            pi_wallet_address: piData.wallet_address || null,
            theme_settings: {
              primaryColor: '#3b82f6',
              backgroundColor: '#000000',
              backgroundType: 'color',
              customLinks: [],
            },
          },
        ])
        .select('id,user_id,username,business_name,pi_user_id,pi_username,pi_wallet_address')
        .single();

      if (createError) {
        console.error('[Pi Auth Service] ❌ Error creating profile:', createError);
        throw createError;
      }

      console.log('[Pi Auth Service] ✅ New profile created');
      return { profile: newProfile, isNew: true };
    }

    throw new Error('No profile found and profile creation is disabled');
  } catch (error: any) {
    console.error('[Pi Auth Service] ❌ Profile linking failed:', error);
    throw error;
  }
}

/**
 * Complete Pi authentication flow
 * Simple, straightforward authentication without edge function complexity
 */
export async function authenticatePiUser(accessToken: string, options?: any) {
  console.log('[Pi Auth Service] 🔐 Starting Pi authentication...');
  
  try {
    // Step 1: Validate token
    const piData = await getPiUserProfile(accessToken);
    console.log('[Pi Auth Service] ✅ Step 1: Token validated');

    // Step 2: Link/create Supabase profile
    const profileResult = await linkPiUserToSupabase(piData, options);
    console.log('[Pi Auth Service] ✅ Step 2: Profile linked');

    const result = {
      success: true,
      piUser: piData,
      supabaseProfile: profileResult.profile,
      isNewProfile: profileResult.isNew,
      accessToken: accessToken,
    };

    console.log('[Pi Auth Service] ✅ Authentication complete!');
    return result;
  } catch (error: any) {
    console.error('[Pi Auth Service] ❌ Authentication failed:', error);
    throw error;
  }
}

/**
 * Verify that a stored Pi access token is still valid (lightweight check)
 */
export async function verifyStoredPiToken(accessToken: string): Promise<boolean> {
  if (!accessToken) {
    console.warn('[Pi Auth Service] ⚠️ No access token to verify');
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(PI_CONFIG.ENDPOINTS.ME, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      console.log('[Pi Auth Service] ✅ Stored Pi token is valid');
      return true;
    } else if (response.status === 401) {
      console.warn('[Pi Auth Service] ⚠️ Token expired or invalid');
      return false;
    }
    return false;
  } catch (error: any) {
    console.warn('[Pi Auth Service] ⚠️ Token verification error:', error?.message);
    return false;
  }
}
