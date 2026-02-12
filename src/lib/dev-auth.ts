/**
 * Development/Mock Authentication
 * 
 * Allows dashboard access without Pi Browser authentication
 * Enable by setting VITE_DEV_MODE=true in .env
 */

import { secureLog } from '../utils/secureLogging';

// Check if dev mode is enabled
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Mock user data for development
export const MOCK_DEV_USER = {
  uid: 'dev-user-12345',
  username: 'devtest',
  wallet_address: 'GBXYZ123456789DEVWALLET456789DEVWALLET4567',
  display_name: 'Dev Test User',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devtest',
  bio: 'Development test account for dashboard testing',
  email: 'dev@droplink.local',
};

// Mock profile data
export const MOCK_DEV_PROFILE = {
  id: 'dev-profile-12345',
  user_id: 'dev-user-12345',
  username: 'devtest',
  business_name: 'Dev Store',
  bio: 'This is a development account for testing',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devtest',
  cover_photo_url: null,
  location: 'Development Environment',
  website: 'https://droplink.space',
  theme: 'light',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Check if dev mode is enabled and bypass auth is allowed
 */
export function isDevModeEnabled(): boolean {
  if (!DEV_MODE) return false;
  
  // Also allow via localStorage override for quick testing
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('droplink-dev-mode');
    return override === 'true';
  }
  
  return true;
}

/**
 * Enable dev mode via localStorage (for runtime testing)
 */
export function enableDevMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('droplink-dev-mode', 'true');
    window.location.reload();
  }
}

/**
 * Disable dev mode
 */
export function disableDevMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('droplink-dev-mode');
    window.location.reload();
  }
}

/**
 * Get dev mode status
 */
export function getDevModeStatus(): {
  enabled: boolean;
  envEnabled: boolean;
  localStorageEnabled: boolean;
} {
  const envEnabled = DEV_MODE;
  const localStorageEnabled = typeof window !== 'undefined' ? localStorage.getItem('droplink-dev-mode') === 'true' : false;
  
  return {
    enabled: envEnabled || localStorageEnabled,
    envEnabled,
    localStorageEnabled,
  };
}

/**
 * Get mock user for dev mode
 */
export function getDevMockUser() {
  return MOCK_DEV_USER;
}

/**
 * Get mock profile for dev mode
 */
export function getDevMockProfile() {
  return MOCK_DEV_PROFILE;
}

/**
 * Log dev mode status to console
 */
export function logDevModeStatus(): void {
  const status = getDevModeStatus();
  secureLog.log('🛠️ DEV MODE STATUS:');
  secureLog.log(`  - Enabled: ${status.enabled}`);
  secureLog.log(`  - Env variable configured: ${!!status.envEnabled}`);
  secureLog.log(`  - localStorage override: ${status.localStorageEnabled}`);
  
  if (status.enabled) {
    secureLog.log('✅ Dev mode is ACTIVE - Pi auth bypass enabled');
    secureLog.log('📝 Mock user:', MOCK_DEV_USER.username);
  } else {
    secureLog.log('⚠️ Dev mode is DISABLED - Pi auth required');
  }
}
