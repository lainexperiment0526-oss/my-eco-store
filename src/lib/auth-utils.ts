import { supabase } from "@/integrations/supabase/client";

export interface AuthStatus {
  isAuthenticated: boolean;
  hasSupabaseAuth: boolean;
  hasPiAuth: boolean;
  userId?: string;
  piUsername?: string;
  isEmailVerified: boolean;
}

// Check if user is running inside Pi Browser
export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Pi SDK
  if (typeof window.Pi !== 'undefined') return true;
  
  // Check user agent for Pi Browser indicators
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('pibrowser') || userAgent.includes('pi network');
};

// Get authentication status
export const getAuthStatus = async (): Promise<AuthStatus> => {
  const result: AuthStatus = {
    isAuthenticated: false,
    hasSupabaseAuth: false,
    hasPiAuth: false,
    isEmailVerified: false,
  };

  try {
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    const hasSupabaseAuth = !!session?.user;
    
    if (hasSupabaseAuth && session) {
      result.hasSupabaseAuth = true;
      result.userId = session.user.id;
      result.isAuthenticated = true;
    }

    // Check Pi Network authentication
    const piToken = localStorage.getItem('pi_access_token');
    const piUser = localStorage.getItem('pi_user');
    const hasPiAuth = !!(piToken && piUser);
    
    if (hasPiAuth) {
      result.hasPiAuth = true;
      try {
        const parsedPiUser = JSON.parse(piUser || '{}');
        result.piUsername = parsedPiUser.username;
      } catch (e) {
        console.error('Failed to parse Pi user:', e);
      }
      result.isAuthenticated = true;
    }

    return result;

  } catch (error) {
    console.error('Error checking auth status:', error);
    return result;
  }
};

// Perform complete sign out from all auth providers
export const performCompleteSignOut = async (): Promise<void> => {
  try {
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear Pi auth tokens
    localStorage.removeItem('pi_access_token');
    localStorage.removeItem('pi_user');
    localStorage.removeItem('pi_uid');
    
    // Clear any cached profile data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('pi_') || key.startsWith('droplink_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Signed out from all auth providers');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Sign out from all auth providers (alias)
export const signOutAll = performCompleteSignOut;

// Force refresh authentication
export const refreshAuth = async (): Promise<AuthStatus> => {
  try {
    // Try to refresh Supabase session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.warn('Failed to refresh Supabase session:', error);
    }
    
    // Return current auth status
    return getAuthStatus();
  } catch (error) {
    console.error('Error refreshing auth:', error);
    return getAuthStatus();
  }
};

// Check if profile exists for current user
export const checkProfileExists = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking profile:', error);
    return false;
  }
};
