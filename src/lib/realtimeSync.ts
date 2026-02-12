// Real-time profile sync helper
// Ensures all profile changes are saved to Supabase immediately

import { supabase } from '@/integrations/supabase/client';

interface RealtimeSyncOptions {
  profileId: string;
  debounceMs?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

let saveTimeout: NodeJS.Timeout | null = null;
let lastSaveTime: number = 0;

/**
 * Save profile data to Supabase immediately
 * This bypasses the auto-save debounce for critical operations
 */
export async function saveProfileToSupabase(
  profileId: string,
  profileData: Record<string, any>,
  options?: { skipToast?: boolean; immediate?: boolean }
) {
  if (!profileId) {
    console.error('❌ No profile ID provided for save');
    return false;
  }

  try {
    console.log('💾 Saving profile to Supabase...', profileData);
    
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId);

    if (error) {
      console.error('❌ Supabase save error:', error);
      throw error;
    }

    console.log('✅ Profile saved to Supabase successfully');
    lastSaveTime = Date.now();
    
    if (!options?.skipToast) {
      // Show visual feedback (via toast if available)
      console.log('📤 Changes synced to server');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to save profile:', error);
    if (options?.skipToast === false && error instanceof Error) {
      console.error('❌ Save error:', error.message);
    }
    return false;
  }
}

/**
 * Create a debounced version of the save function
 * Useful for high-frequency updates (like typing)
 */
export function createDebouncedSave(
  profileId: string,
  options: RealtimeSyncOptions = { profileId }
) {
  const { debounceMs = 1000 } = options;

  return (profileData: Record<string, any>) => {
    // Clear previous timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout
    saveTimeout = setTimeout(() => {
      saveProfileToSupabase(profileId, profileData, { skipToast: true })
        .then(success => {
          if (success && options.onSuccess) {
            options.onSuccess('Profile updated');
          }
        })
        .catch(error => {
          if (options.onError) {
            options.onError(error as Error);
          }
        });
    }, debounceMs);
  };
}

/**
 * Force immediate save without debounce
 * Use this for critical operations (like before logout, subscription changes, etc.)
 */
export async function saveProfileImmediately(
  profileId: string,
  profileData: Record<string, any>
) {
  return saveProfileToSupabase(profileId, profileData, { immediate: true });
}

/**
 * Check if profile is synced
 */
export function isProfileSynced(): boolean {
  const timeSinceLastSave = Date.now() - lastSaveTime;
  return timeSinceLastSave < 5000; // Consider synced if saved within last 5 seconds
}

export default {
  saveProfileToSupabase,
  createDebouncedSave,
  saveProfileImmediately,
  isProfileSynced,
};
