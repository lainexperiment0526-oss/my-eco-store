// Utility: Robust Pi Browser detection
export function isPiBrowserEnv(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;

  // Primary check: Is Pi SDK available? This is the most reliable indicator
  if (typeof window.Pi !== 'undefined' && window.Pi !== null) {
    // Verify it's the real SDK, not a mock
    if (typeof window.Pi.init === 'function' && typeof window.Pi.authenticate === 'function') {
      console.log('[PI DETECTION] \u2705 Real Pi SDK detected');
      return true;
    }
  }

  // Secondary check: User agent patterns
  // Pi Browser can have various user agent strings
  const ua = window.navigator.userAgent || '';
  const isPiUA = /pi.?browser|pi.?app|minepi/i.test(ua);
  if (isPiUA) {
    console.log('[PI DETECTION] Pi Browser detected via user agent');
    return true;
  }

  // Tertiary check: Pi-specific window properties
  if ((window as any).__PI_SDK__ || (window as any).__PI_CONTEXT__ || (window as any).__PIBROWSER__) {
    console.log('[PI DETECTION] Pi Browser context detected');
    return true;
  }
  
  // Check for other Pi indicators
  if ((window as any).piApp !== undefined || (window.navigator as any).pi !== undefined) {
    console.log('[PI DETECTION] Pi property detected');
    return true;
  }

  // Development mode: Be more permissive for testing
  if (import.meta.env.DEV) {
    console.log('[PI DETECTION] Development mode - detection uncertain, continuing...');
    // Return true in dev mode if SDK is being loaded
    return typeof window.Pi !== 'undefined';
  }

  console.log('[PI DETECTION] Pi Browser not detected. UA:', ua.substring(0, 150));
  return false;
}
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PI_CONFIG, isPiNetworkAvailable, validatePiConfig, validateMainnetConfig, getWalletTokens, getTokenBalance, createTokenTrustline } from "@/config/pi-config";
import { authenticatePiUser, verifyStoredPiToken } from "@/services/piMainnetAuthService";

// Pi Network Types
interface PiUser {
  uid: string;
  username?: string;
  wallet_address?: string;
}

interface PiAccount {
  user_id: string;
  pi_username: string;
  display_name: string;
  plan_type: string;
  subscription_status: string;
  wallet_address?: string;
  created_at: string;
  is_primary: boolean;
}

interface DropTokenBalance {
  balance: string;
  hasTrustline: boolean;
}

interface WalletInfo {
  address: string;
  type: 'pi_network' | 'imported';
  hasPrivateKey: boolean;
}

interface AuthResult {
  accessToken: string;
  user: PiUser;
}

interface PaymentData {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
}

interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: any) => void;
}

interface AdResponse {
  type: 'interstitial' | 'rewarded';
  result: 'AD_CLOSED' | 'AD_REWARDED' | 'AD_DISPLAY_ERROR' | 'AD_NETWORK_ERROR' | 'AD_NOT_AVAILABLE' | 'ADS_NOT_SUPPORTED' | 'USER_UNAUTHENTICATED';
  adId?: string;
}

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean; usePiStorage?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (payment: any) => void
      ) => Promise<AuthResult>;
      createPayment: (paymentData: PaymentData, callbacks: PaymentCallbacks) => void;
      nativeFeaturesList: () => Promise<string[]>;
      openShareDialog: (title: string, message: string) => void;
      openUrlInSystemBrowser: (url: string) => Promise<void>;
      showRewardedAd?: () => Promise<AdResponse>;
      showInterstitialAd?: () => Promise<AdResponse>;
      Ads?: {
        isAdReady: (adType: 'interstitial' | 'rewarded') => Promise<{ type: string; ready: boolean }>;
        requestAd?: (adType: 'interstitial' | 'rewarded') => Promise<{ type: string; result: string }>;
        showAd?: (adType: 'interstitial' | 'rewarded') => Promise<AdResponse>;
      };
    };
  }
}


// Pi Context Interface
interface PiContextType {
  // Authentication
  piUser: PiUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  adNetworkSupported: boolean;
  
  // Account Management
  currentAccount: PiAccount | null;
  availableAccounts: PiAccount[];
  currentProfile: any | null;
  
  // Wallet
  currentWallet: WalletInfo | null;
  dropBalance: DropTokenBalance;
  
  // Functions
  signIn: (scopes?: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Profile Management
  getPiUserProfile: (identifier: string) => Promise<any>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  
  // Account Management Functions
  loadUserAccounts: () => Promise<PiAccount[]>;
  createAccount: (username: string, displayName?: string, paymentId?: string) => Promise<PiAccount>;
  switchAccount: (account: PiAccount) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<boolean>;
  
  // Wallet Functions
  setWalletAddress: (address: string) => Promise<boolean>;
  importWallet: (privateKey: string) => Promise<WalletInfo | null>;
  switchToWallet: (walletInfo: WalletInfo) => void;
  getCurrentWalletAddress: () => string | null;
  
  // Payment Functions
  createPayment: (amount: number, memo: string, metadata?: any) => Promise<string | null>;
  
  // DROP Token Functions
  getDROPBalance: () => Promise<DropTokenBalance>;
  createDROPTrustline: () => Promise<boolean>;
  requestDropTokens: (amount?: number, adIds?: string[]) => Promise<boolean>;
  getAllWalletTokens: () => Promise<any[]>;
  refreshDROPDisplay: () => Promise<boolean>;
  
  // Ad Functions
  showRewardedAd: () => Promise<boolean>;
  watchAdsAndClaim: (adsToWatch: number, dropsReward: number) => Promise<boolean>;
  showInterstitialAd: () => Promise<boolean>;
  isAdReady: () => Promise<boolean>;
  
  // Share Functions
  shareContent: (title: string, text: string) => Promise<boolean>;
  openExternalUrl: (url: string) => Promise<boolean>;
}

const PiContext = createContext<PiContextType | undefined>(undefined);

export const PiProvider = ({ children }: { children: ReactNode }) => {
  // Authentication state
  const [piUser, setPiUser] = useState<PiUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [adNetworkSupported, setAdNetworkSupported] = useState<boolean>(false);
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  
  // Wallet and token state (production: no mock wallet)
  const [dropBalance, setDropBalance] = useState<DropTokenBalance>({ balance: "0", hasTrustline: false });
  const [currentWallet, setCurrentWallet] = useState<WalletInfo | null>(null);
  
  // Multiple account management state
  const [currentAccount, setCurrentAccount] = useState<PiAccount | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<PiAccount[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceProfileIdRef = useRef<string | null>(null);
  const lastActiveUpdateRef = useRef<number>(0);
  
  // Set isAuthenticated based on real authentication state
  const isAuthenticated = !!(piUser && accessToken);
  const networkLabel = 'Mainnet';

  useEffect(() => {
    if (!isAuthenticated || !piUser?.username) return;

    let isMounted = true;

    const updateLastActive = async (profileId: string) => {
      const now = Date.now();
      if (now - lastActiveUpdateRef.current < 60_000) return;
      lastActiveUpdateRef.current = now;

      try {
        await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', profileId);
      } catch (error) {
        console.warn('[PRESENCE] Failed to update last_active_at:', error);
      }
    };

    const setupPresence = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', piUser.username)
          .maybeSingle();

        if (!isMounted) return;
        if (error || !profile?.id) {
          console.warn('[PRESENCE] No profile found for presence tracking');
          return;
        }

        presenceProfileIdRef.current = profile.id;

        const channel = supabase.channel('presence-global', {
          config: {
            presence: { key: profile.id }
          }
        });

        presenceChannelRef.current = channel;

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              profile_id: profile.id,
              username: piUser.username,
              online_at: new Date().toISOString()
            });
            await updateLastActive(profile.id);
          }
        });

        const heartbeat = window.setInterval(async () => {
          if (!presenceProfileIdRef.current) return;
          await channel.track({
            profile_id: presenceProfileIdRef.current,
            username: piUser.username,
            online_at: new Date().toISOString()
          });
          await updateLastActive(presenceProfileIdRef.current);
        }, 60_000);

        const handleVisibility = async () => {
          if (document.visibilityState !== 'visible') return;
          if (!presenceProfileIdRef.current) return;
          await channel.track({
            profile_id: presenceProfileIdRef.current,
            username: piUser.username,
            online_at: new Date().toISOString()
          });
          await updateLastActive(presenceProfileIdRef.current);
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
          window.clearInterval(heartbeat);
          document.removeEventListener('visibilitychange', handleVisibility);
        };
      } catch (error) {
        console.warn('[PRESENCE] Setup failed:', error);
      }
    };

    let cleanup: (() => void) | undefined;
    setupPresence().then((fn) => {
      cleanup = fn;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      presenceProfileIdRef.current = null;
    };
  }, [isAuthenticated, piUser?.username]);

  useEffect(() => {
    const initializePi = async () => {
      try {
        if (!validateMainnetConfig()) {
          setError('Invalid Pi Network configuration');
          return;
        }

        const isPi = isPiBrowserEnv();
        console.log('[PI INIT] isPiBrowserEnv result:', isPi);

        if (isPi) {
          let attempts = 0;
          const maxAttempts = 20;

          console.log('[PI INIT] Waiting for Pi SDK to load...');
          while (typeof window.Pi === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
            if (attempts % 5 === 0) {
              console.log(`[PI INIT] Still waiting... (${attempts * 300}ms elapsed)`);
            }
          }

          if (typeof window.Pi === 'undefined') {
            // SDK not loaded - this is normal outside Pi Browser
            console.warn('[PI INIT] Pi SDK not available - app requires Pi Browser');
            setError('Pi Browser required to use this app');
            return;
          }

          console.log('[PI INIT] ✅ Pi SDK detected and ready');
          // SDK is already initialized in index.html with Pi.init({ version: "2.0" })
          setIsInitialized(true);

          // Check for ad network support
          try {
            const debugAd = import.meta.env.VITE_DEBUG_MODE === 'true';
            if (debugAd) {
              console.log('[AD NETWORK] Detecting ad network support...');
            }
            let adSupported = false;
            let features: string[] = [];

            // Method 1: Check nativeFeaturesList
            if (typeof (window as any)?.Pi?.nativeFeaturesList === 'function') {
              try {
                features = await (window as any).Pi.nativeFeaturesList();
                adSupported = features.includes('ad_network') || features.includes('ads');
                if (debugAd) {
                  console.log('[AD NETWORK] Native features:', features);
                }
              } catch (featureErr) {
                console.warn('[AD NETWORK] nativeFeaturesList failed:', featureErr);
              }
            }

            // Method 2: Check for ad API endpoints
            let hasAdAPI = adSupported;
            if (!hasAdAPI && (window as any).Pi?.Ads) {
              hasAdAPI = true;
              if (debugAd) {
                console.log('[AD NETWORK] Pi.Ads API detected');
              }
            }
            if (!hasAdAPI && (window as any).Pi?.showRewardedAd) {
              hasAdAPI = true;
              if (debugAd) {
                console.log('[AD NETWORK] Pi.showRewardedAd detected');
              }
            }
            if (!hasAdAPI && (window as any).Pi?.showInterstitialAd) {
              hasAdAPI = true;
              if (debugAd) {
                console.log('[AD NETWORK] Pi.showInterstitialAd detected');
              }
            }

            if (debugAd) {
              console.log('[AD NETWORK] Ad network supported:', hasAdAPI);
            }
            setAdNetworkSupported(hasAdAPI);
          } catch (err) {
            console.error('[AD NETWORK] Error detecting ad network:', err);
            // Fallback detection
            if ((window as any).Pi?.Ads || (window as any).Pi?.showRewardedAd) {
              if (import.meta.env.VITE_DEBUG_MODE === 'true') {
                console.log('[AD NETWORK] Fallback detection successful');
              }
              setAdNetworkSupported(true);
            } else {
              setAdNetworkSupported(false);
            }
          }

          const storedToken = localStorage.getItem('pi_access_token');
          const storedUser = localStorage.getItem('pi_user');
          const lastVerified = localStorage.getItem('pi_token_last_verified');

          if (storedToken && storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setAccessToken(storedToken);
              setPiUser(userData);

              // Only verify token if it hasn't been verified recently (within 24 hours)
              const now = Date.now();
              const shouldVerify = !lastVerified || (now - parseInt(lastVerified)) > 24 * 60 * 60 * 1000;

              if (shouldVerify) {
                verifyStoredPiToken(storedToken).then((isValid) => {
                  if (!isValid) {
                    console.warn('[PI INIT] Token verification failed - clearing stored credentials');
                    localStorage.removeItem('pi_access_token');
                    localStorage.removeItem('pi_user');
                    localStorage.removeItem('pi_token_last_verified');
                    setPiUser(null);
                    setAccessToken(null);
                  } else {
                    // Token is valid, update last verified timestamp
                    localStorage.setItem('pi_token_last_verified', now.toString());
                  }
                }).catch((err) => {
                  // Network error - don't clear tokens, just log warning
                  console.warn('[PI INIT] Token verification error (network issue):', err);
                });
              } else {
                console.log('[PI INIT] Token verified recently, skipping verification');
              }
            } catch (err) {
              console.error('[PI INIT] Error parsing stored user data:', err);
              localStorage.removeItem('pi_access_token');
              localStorage.removeItem('pi_user');
              localStorage.removeItem('pi_token_last_verified');
            }
          }
        }
      } catch (err) {
        setError('Failed to initialize Pi Network');
      }
    };
    
    initializePi();

    // Listen for Supabase Auth changes (e.g. Email/Gmail login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] Supabase auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        // If user is logged in via Supabase (e.g. Gmail), ensure PiContext knows about it
        // This allows admin/email users to bypass Pi-specific auth if needed
        
        // Check if we already have this user set
        if (piUser?.uid === session.user.id) return;

        try {
          // Fetch profile to get username
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profile) {
            console.log('[AUTH] Found existing profile for Supabase user:', profile.username);
            const user: PiUser = {
              uid: session.user.id,
              username: profile.username || session.user.email?.split('@')[0] || 'admin',
              wallet_address: profile.pi_wallet_address
            };
            
            setAccessToken(session.access_token);
            setPiUser(user);
            setCurrentProfile(profile);
            setLoading(false);
          } else {
             // Create a temporary profile object if none exists (fallback)
             // Real profile creation should happen on sign-up, but this handles edge cases
             console.log('[AUTH] No profile found, using session data');
             const fallbackUser: PiUser = {
                uid: session.user.id,
                username: session.user.email?.split('@')[0] || 'admin'
             };
             setPiUser(fallbackUser);
             setAccessToken(session.access_token);
             setLoading(false);
          }
        } catch (err) {
          console.error('[AUTH] Error syncing Supabase session to PiContext:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        // Handle sign out if it wasn't triggered by our signOut function
        if (piUser) {
           // We don't call signOut() here to avoid loops if signOut() calls supabase.auth.signOut()
           // Just clear state if needed, or let signOut() handle it.
           // For now, we rely on the manual signOut to clear local state.
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign In with Pi Network (mainnet)
  const signIn = async (scopes?: string[]) => {
    const requestedScopes = scopes || PI_CONFIG.scopes || ['username'];

    setLoading(true);
    setError(null);
    
    try {
      // Check Pi Browser environment (non-blocking)
      const inPiBrowser = isPiBrowserEnv();
      console.log('[SIGNIN] In Pi Browser:', inPiBrowser);
      
      // Don't fail here - let Pi SDK handle the check naturally
      // The SDK will throw its own error if not in Pi Browser
      if (!inPiBrowser) {
        console.warn('[SIGNIN] Pi Browser detection uncertain - will attempt authentication anyway');
      }
      
      // Ensure SDK is initialized - following official Pi SDK guide
      // https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformSDK/
      if (typeof window.Pi === 'undefined') {
        const msg = 'Pi SDK not available. Please ensure you are using the official Pi Browser.';
        console.error('[SIGNIN]', msg);
        toast.error(msg, { duration: 8000 });
        throw new Error(msg);
      }

      // Initialize window.Pi reference (official pattern)
      const Pi = window.Pi;

      console.log('[SIGNIN] Calling Pi.authenticate with scopes:', requestedScopes);
      console.log('[SIGNIN] Pi SDK state:', {
        hasAuthenticate: typeof Pi.authenticate === 'function',
        hasInit: typeof Pi.init === 'function',
        hasPi: typeof Pi !== 'undefined'
      });

      let authResult: AuthResult | null = null;
      const tryScopes = async (reqScopes: string[]) => {
        // Verify Pi SDK is properly initialized and has authenticate method
        if (typeof Pi.authenticate !== 'function') {
          console.error('[SIGNIN] Pi.authenticate is not a function. Pi:', Pi);
          throw new Error('Pi SDK authenticate method not available');
        }

        // Call Pi.authenticate following official guide pattern
        // https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformSDK/#authenticate
        const result = await Pi.authenticate(reqScopes, PI_CONFIG.onIncompletePaymentFound);
        console.log('[SIGNIN] Pi.authenticate returned:', result);
        
        // Validate response structure
        if (!result) {
          throw new Error('Pi.authenticate() returned null or undefined');
        }
        if (!result.accessToken) {
          throw new Error('Authentication succeeded but no accessToken in response');
        }
        if (!result.user) {
          throw new Error('Authentication succeeded but no user in response');
        }
        
        console.log('[SIGNIN] Authentication validation passed');
        return result;
      };

      try {
        authResult = await tryScopes(requestedScopes);
        // Store granted scopes
        setGrantedScopes(requestedScopes);
      } catch (authErr: any) {
        const msg = typeof authErr === 'string' ? authErr : (authErr?.message || 'Authentication failed');
        const lowerMsg = String(msg).toLowerCase();
        
        // Only retry with username if we're requesting more than just username
        const looksLikeScopeIssue = (lowerMsg.includes('scope') || lowerMsg.includes('permission') || lowerMsg.includes('payments')) && requestedScopes.length > 1;
        if (looksLikeScopeIssue) {
          toast('Permissions not available; signing in with username only.', { duration: 5000 });
          try {
            authResult = await tryScopes(['username']);
            setGrantedScopes(['username']);
          } catch (fallbackErr: any) {
            throw fallbackErr;
          }
        } else {
          throw authErr;
        }
      }

      // Validate access token with Pi API (mainnet)
      if (!authResult) {
        const err = 'No authentication result received from Pi Network.';
        console.error('[SIGNIN]', err);
        setError(err);
        throw new Error(err);
      }
      
      const accessToken = authResult.accessToken;
      console.log('[SIGNIN] Got access token:', accessToken ? 'present' : 'missing');
      
      if (!accessToken) {
        const err = 'No access token received from Pi Network.';
        console.error('[SIGNIN]', err);
        setError(err);
        throw new Error(err);
      }

      // Use the Pi authentication service for proper validation and linking
      console.log('[SIGNIN] Validating token with Pi API...');
      const authResult_fromService = await authenticatePiUser(accessToken, {
        createIfNotExists: true,
      });
      console.log('[SIGNIN] Token validated successfully');

      const piUser = authResult_fromService.piUser;
      const supabaseProfile = authResult_fromService.supabaseProfile;

      // Store access token and user info in localStorage
      localStorage.setItem('pi_access_token', accessToken);
      localStorage.setItem('pi_user', JSON.stringify(piUser));
      localStorage.setItem('pi_token_last_verified', Date.now().toString());
      
      // Update state with authenticated user
      setAccessToken(accessToken);
      setPiUser(piUser);
      setCurrentProfile(supabaseProfile);
      setLoading(false);

    } catch (err: any) {
      let errorMessage = 'Authentication failed';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message) || errorMessage;
      }
      
      console.error('[SIGNIN] Caught error in signIn:', {
        message: errorMessage,
        fullError: err,
        stack: err?.stack
      });
      
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      // Clear Pi Network authentication
      localStorage.removeItem('pi_access_token');
      localStorage.removeItem('pi_user');
      localStorage.removeItem('pi_user_extended');
      localStorage.removeItem('pi_token_last_verified');
      
      // Reset state
      setPiUser(null);
      setAccessToken(null);
      setCurrentProfile(null);
      setCurrentAccount(null);
      setAvailableAccounts([]);
      setDropBalance({ balance: "0", hasTrustline: false });
      setCurrentWallet(null);
      
      toast("Signed out successfully", {
        description: "You have been signed out of Pi Network",
        duration: 3000,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error("Error signing out", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  // Get Pi user profile by username or ID
  const getPiUserProfile = async (identifier: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${identifier.toLowerCase()},pi_username.eq.${identifier.toLowerCase()},pi_user_id.eq.${identifier},user_id.eq.${identifier}`)
        .single();

      if (error) {
        console.error('Failed to get Pi user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception getting Pi user profile:', err);
      return null;
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      // Use a direct query since the RPC function might not be registered in types
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${username},pi_username.eq.${username}`)
        .limit(1);

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      console.error('Failed to check username availability:', error);
      return false;
    }
  };

  // Get DROP Token Balance with enhanced detection
  const getDROPBalanceFunc = async (): Promise<DropTokenBalance> => {
    if (!isAuthenticated || !piUser?.wallet_address) {
      return { balance: "0", hasTrustline: false };
    }

    try {
      console.log('🪙 Checking DROP token balance for:', piUser.wallet_address);
      
      // Use enhanced detection from pi-config
      // Get all wallet tokens instead of just looking for DROP
      const allTokens = await getWalletTokens(piUser.wallet_address);
      
      // Log found tokens for debugging
      console.log(`📊 Found ${allTokens.length} tokens in wallet:`, allTokens);
      
      // For backwards compatibility, simulate DROP detection
      const dropData = allTokens.find(token => token.asset_code === 'DROP') || null;
      
      if (dropData && dropData.balance) {
        console.log('✅ DROP token detected:', dropData);
        const result = {
          balance: dropData.balance,
          hasTrustline: dropData.hasTrustline || true,
          source: dropData.source,
          limit: dropData.limit,
          buying_liabilities: dropData.buying_liabilities,
          selling_liabilities: dropData.selling_liabilities
        };
        setDropBalance(result);
        
        // Note: Automatic token display is deprecated
        if (typeof window !== 'undefined' && window.Pi) {
          console.log('ℹ️ Token display requires proper mainnet token configuration');
        }
        
        return result;
      } else {
        console.log('⚠️ DROP token not found in wallet - checking if trustline needed');
        const result = {
          balance: "0",
          hasTrustline: false
        };
        setDropBalance(result);
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to get DROP token balance:', error);
      const result = { balance: "0", hasTrustline: false };
      setDropBalance(result);
      return result;
    }
  };

  // Create DROP Token Trustline with enhanced functionality
  const createDROPTrustlineFunc = async (): Promise<boolean> => {
    if (!isAuthenticated || !piUser?.wallet_address) {
      toast("Please authenticate with Pi Network first", {
        description: "Authentication Required",
        duration: 5000,
      });
      return false;
    }

    try {
      console.log('🔗 Creating token trustline...');
      
      // Note: Trustline creation is now generic for any mainnet token
      console.warn('ℹ️ Trustline creation is deprecated for non-mainnet tokens');
      console.warn('ℹ️ Use createTokenTrustline() for verified mainnet tokens');
      
      // For demo purposes, we'll return false since no specific token is configured
      const success = false;
      
      if (success) {
        toast.success("Token trustline created successfully!", {
          description: "You can now receive custom tokens",
          duration: 5000,
        });
        
        // Refresh balance after trustline creation
        setTimeout(async () => {
          await getDROPBalanceFunc();
        }, 2000);
        
        return true;
      } else {
        throw new Error('Trustline creation failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to create DROP trustline:', error);
      toast.error("Failed to create DROP token trustline", {
        description: "Please try again later",
        duration: 5000,
      });
      return false;
    }
  };

  // Get all wallet tokens (including DROP)
  const getAllWalletTokensFunc = async (): Promise<any[]> => {
    if (!isAuthenticated || !piUser?.wallet_address) {
      return [];
    }

    try {
      console.log('📊 Fetching all wallet tokens...');
      const tokens = await getWalletTokens(piUser.wallet_address);
      
      // Check if DROP token is in the list
      const dropToken = tokens.find(token => token.is_drop_token);
      if (dropToken) {
        console.log('✅ DROP token found in wallet tokens:', dropToken);
        
        // Update DROP balance state
        setDropBalance({
          balance: dropToken.balance,
          hasTrustline: true
        });
      }
      
      return tokens;
    } catch (error) {
      console.error('❌ Failed to get wallet tokens:', error);
      return [];
    }
  };

  // Force refresh DROP token display in Pi wallet
  const refreshDROPDisplay = async (): Promise<boolean> => {
    if (!isAuthenticated || !piUser?.wallet_address) {
      return false;
    }

    try {
      console.log('🔄 Refreshing token display in Pi wallet...');
      
      // First check if token exists
      await getDROPBalanceFunc();
      
      // Note: Automatic token addition is deprecated
      console.log('ℹ️ Token display depends on proper mainnet token configuration');
      const added = false; // No tokens configured for mainnet
      
      if (added) {
        toast.success("Token should now be visible in Pi wallet", {
          description: "Check your Pi wallet for custom tokens",
          duration: 5000,
        });
      }
      
      return added;
    } catch (error) {
      console.error('❌ Failed to refresh DROP display:', error);
      return false;
    }
  };

  // Helpers for daily ad limit tracking (local fallback). Server-side enforcement recommended.
  const getTodayKey = () => {
    const d = new Date().toISOString().slice(0, 10);
    return `ad_watch_count_${d}`;
  };

  const getTodaysAdCount = (): number => {
    try {
      const v = localStorage.getItem(getTodayKey()) || '0';
      return parseInt(v, 10) || 0;
    } catch (e) {
      return 0;
    }
  };

  const incrementTodaysAdCount = (n: number = 1) => {
    try {
      const key = getTodayKey();
      const next = getTodaysAdCount() + n;
      localStorage.setItem(key, String(next));
    } catch (e) {
      console.warn('Failed to increment todays ad count', e);
    }
  };

  const getRemainingAdsToday = (): number => {
    const MAX_PER_DAY = 20;
    return Math.max(0, MAX_PER_DAY - getTodaysAdCount());
  };

  // Request DROP tokens from distributor. Accepts optional adIds for server-side dedupe.
  const requestDropTokens = async (amount: number = 100, adIds?: string[]): Promise<boolean> => {
    if (!isAuthenticated || !piUser?.wallet_address) {
      toast("Please authenticate with Pi Network first", {
        description: "Authentication Required",
        duration: 5000,
      });
      return false;
    }

    try {
      console.log(`🪙 Requesting ${amount} DROP tokens...`, { adIds });

      // Call backend function to distribute tokens. Send adIds when available so server can dedupe.
      const invokeBody: any = {
        recipientAddress: piUser.wallet_address,
        amount: amount.toString(),
      };

      if (adIds && adIds.length > 0) invokeBody.adIds = adIds;

      const { data, error } = await supabase.functions.invoke('distribute-drop-tokens', {
        body: invokeBody,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Received ${amount} DROP tokens!`, {
        description: "Tokens Distributed",
        duration: 5000,
      });

      // Update balance after distribution
      setTimeout(async () => {
        await getDROPBalanceFunc();
      }, 2000);

      return true;
    } catch (error) {
      console.error('❌ Failed to request DROP tokens:', error);
      toast.error("Failed to request DROP tokens", {
        description: "Please try again later",
        duration: 5000,
      });
      return false;
    }
  };

  // Multiple account management functions
  const loadUserAccounts = async (): Promise<PiAccount[]> => {
    if (!piUser?.uid) return [];

    try {
      const { data, error } = await (supabase as any)
        .rpc('get_user_accounts_by_pi_id', {
          pi_user_id_param: piUser.uid
        });

      if (error) throw error;

      if (data?.success && data?.accounts) {
        setAvailableAccounts(data.accounts);
        
        // Set current account if not set
        if (!currentAccount && data.accounts.length > 0) {
          const primaryAccount = data.accounts.find((acc: PiAccount) => acc.is_primary) || data.accounts[0];
          setCurrentAccount(primaryAccount);
        }
        
        return data.accounts;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to load user accounts:', error);
      return [];
    }
  };

  const createAccount = async (username: string, displayName?: string, paymentId?: string): Promise<PiAccount> => {
    if (!piUser?.uid) {
      throw new Error('User not authenticated');
    }

    // Enforce production policy: disallow creating additional/dev test accounts when configured
    if (!PI_CONFIG.ALLOW_MULTIPLE_ACCOUNTS && availableAccounts.length > 0) {
      throw new Error('Creating additional accounts is disabled in this deployment (mainnet only)');
    }

    try {
      console.log('Creating account with:', { username, displayName, pi_user_id: piUser.uid });
      
      const { data, error } = await (supabase as any)
        .rpc('create_pi_network_account', {
          pi_username: username,
          pi_user_id: piUser.uid,
          display_name: displayName || username,
          is_additional_account: availableAccounts.length > 0,
          payment_amount: availableAccounts.length > 0 ? 10 : 0
        });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (data?.success) {
        // Account created successfully
        const newAccount: PiAccount = {
          user_id: data.user_id,
          pi_username: data.username,
          display_name: data.display_name,
          plan_type: 'free',
          subscription_status: 'active', 
          wallet_address: null,
          created_at: data.created_at,
          is_primary: availableAccounts.length === 0
        };

        // Reload accounts to get updated list
        await loadUserAccounts();
        
        console.log('Account created successfully:', newAccount);
        return newAccount;
      } else {
        console.error('Account creation failed:', data?.error || 'Unknown error');
        throw new Error(data?.error || 'Failed to create account');
      }
      
    } catch (error) {
      console.error('Failed to create account:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('USERNAME_EXISTS')) {
        throw new Error('Username is already taken. Please choose a different username.');
      } else if (error.message?.includes('INSUFFICIENT_PAYMENT')) {
        throw new Error('Additional accounts require a 10 PI payment.');
      } else if (error.message?.includes('INVALID_USERNAME')) {
        throw new Error('Username must be at least 3 characters long.');
      } else {
        throw new Error(error.message || 'Failed to create account');
      }
    }
  };

  const switchAccount = async (account: PiAccount): Promise<void> => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('switch_to_account', {
          pi_user_id_param: piUser?.uid,
          target_username: account.pi_username
        });

      if (error) throw error;

      if (data?.success) {
        setCurrentAccount(account);
        toast(`Switched to account: ${account.display_name}`, {
          duration: 3000,
        });
      } else {
        throw new Error(data?.error || 'Failed to switch account');
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      toast.error("Failed to switch account", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  const deleteAccount = async (accountId: string): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('delete_user_account_completely', {
          user_id_to_delete: accountId
        });

      if (error) throw error;

      if (data?.success) {
        // Remove account from local state
        setAvailableAccounts(prev => prev.filter(acc => acc.user_id !== accountId));
        
        // Switch to primary account if current account was deleted
        if (currentAccount?.user_id === accountId) {
          const primaryAccount = availableAccounts.find(acc => acc.is_primary);
          if (primaryAccount) {
            setCurrentAccount(primaryAccount);
          } else {
            setCurrentAccount(null);
          }
        }
        
        toast.success("Account deleted successfully", {
          description: "All account data has been removed",
          duration: 3000,
        });
        
        return true;
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error("Failed to delete account", {
        description: "Please try again later",
        duration: 5000,
      });
      return false;
    }
  };

  // Load accounts when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserAccounts();
    } else {
      setCurrentAccount(null);
      setAvailableAccounts([]);
    }
  }, [isAuthenticated]);

  // Placeholder functions for features not yet implemented
  const setWalletAddress = async (address: string): Promise<boolean> => {
    // Implementation pending
    return true;
  };

  const importWallet = async (privateKey: string): Promise<WalletInfo | null> => {
    // Implementation pending
    return null;
  };

  const switchToWallet = (walletInfo: WalletInfo) => {
    setCurrentWallet(walletInfo);
  };

  const getCurrentWalletAddress = (): string | null => {
    return currentWallet?.address || null;
  };

  const createPayment = async (amount: number, memo: string, metadata?: any): Promise<string | null> => {
    console.log('[PAYMENT] 🚀 createPayment called with:', { amount, memo, metadata });
    
    // VALIDATION CHECKS
    if (!window.Pi) {
      const errorMsg = 'Pi SDK not available. Please ensure you are in the Pi Browser.';
      console.error('[PAYMENT] ❌', errorMsg);
      toast.error(errorMsg, { duration: 5000 });
      throw new Error(errorMsg);
    }

    if (!isAuthenticated || !piUser) {
      const errorMsg = 'User not authenticated. Please sign in with Pi Network first.';
      console.error('[PAYMENT] ❌', errorMsg);
      toast.error(errorMsg, { duration: 5000 });
      throw new Error(errorMsg);
    }

    if (!accessToken) {
      const errorMsg = 'No access token available. Please sign in again.';
      console.error('[PAYMENT] ❌', errorMsg);
      toast.error(errorMsg, { duration: 5000 });
      throw new Error(errorMsg);
    }

    // CHECK FOR PAYMENTS SCOPE
    console.log('[PAYMENT] 🔍 Checking granted scopes:', grantedScopes);
    if (!grantedScopes.includes('payments')) {
      console.warn('[PAYMENT] ⚠️ Payments scope not granted. Requesting it now...');
      toast.error('Payment Permission Required', {
        description: 'You must grant the payments permission to use PI payments. Please sign out and sign in again, then approve the payments permission when prompted.',
        duration: 10000,
        action: {
          label: 'Sign Out & Re-authenticate',
          onClick: async () => {
            await signOut();
            window.location.reload();
          }
        }
      });
      return null;
    }

    console.log('[PAYMENT] ⚠️ REAL Pi Network MAINNET Payment');
    console.log('[PAYMENT] Amount:', amount, 'Pi');
    console.log('[PAYMENT] Memo:', memo);
    console.log('[PAYMENT] Network:', PI_CONFIG.NETWORK);
    console.log('[PAYMENT] User:', piUser.username);
    console.log('[PAYMENT] Access Token:', accessToken.substring(0, 20) + '...');

    // Validate payment amount
    if (amount <= 0) {
      const errorMsg = 'Payment amount must be greater than 0';
      console.error('[PAYMENT] ❌', errorMsg);
      toast.error(errorMsg, { duration: 5000 });
      throw new Error(errorMsg);
    }

    // Construct payment data object following Pi SDK documentation format
    const paymentData = {
      amount: amount,  // Pi Amount being Transacted
      memo: memo,      // Any information to add to payment
      metadata: metadata || {}  // Special Information
    };

    console.log('[PAYMENT] 📦 Payment data prepared:', JSON.stringify(paymentData, null, 2));

    return new Promise<string | null>((resolve) => {
      let resolvedOnce = false; // Prevent multiple resolutions
      
      // Callbacks the developer needs to implement (following Pi SDK documentation):
      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          if (resolvedOnce) return;
          
          try {
            console.log('[PAYMENT] 📋 onReadyForServerApproval - Payment ID:', paymentId);
            console.log('[PAYMENT] 📦 Sending client metadata to approval:', metadata);
            console.log('[PAYMENT] ⏱️ Approval timeout: 45 seconds');
            
            toast('Payment awaiting approval...', { 
              description: 'Your payment is being verified on Pi Network', 
              duration: 5000 
            });
            
            // Set a safety timeout to prevent hanging
            const approvalTimeout = setTimeout(() => {
              console.warn('[PAYMENT] ⚠️ Approval timeout after 50 seconds');
              if (!resolvedOnce) {
                resolvedOnce = true;
                toast.error('Payment approval timeout', { 
                  description: 'Please try again',
                  duration: 5000 
                });
                resolve(null);
              }
            }, 50000);
            
            try {
              const { error, data } = await supabase.functions.invoke('pi-payment-approve', {
                body: { paymentId, metadata },
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              
              clearTimeout(approvalTimeout);
              
              if (error) {
                console.error('[PAYMENT] ❌ Payment approval error:', error);
                toast.error('Payment approval failed', { 
                  description: error.message || 'Unknown error',
                  duration: 5000 
                });
              } else {
                console.log('[PAYMENT] ✅ Payment approved by server:', data);
                toast.success('Payment approved!', { 
                  description: 'Completing transaction...',
                  duration: 3000 
                });
              }
            } catch (invokeErr) {
              clearTimeout(approvalTimeout);
              console.error('[PAYMENT] ❌ Approval invoke error:', invokeErr);
              toast.error('Approval request failed', { 
                description: invokeErr instanceof Error ? invokeErr.message : 'Network error',
                duration: 5000 
              });
            }
          } catch (err) {
            console.error('[PAYMENT] ❌ Payment approval exception:', err);
            toast.error('Payment approval failed', { 
              description: err instanceof Error ? err.message : 'Unknown error',
              duration: 5000 
            });
          }
        },
        
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          if (resolvedOnce) return; // Already resolved
          resolvedOnce = true; // Mark as resolved
          
          try {
            console.log('[PAYMENT] 🔄 onReadyForServerCompletion');
            console.log('[PAYMENT] Payment ID:', paymentId);
            console.log('[PAYMENT] Transaction ID:', txid);
            console.log('[PAYMENT] 📦 Sending metadata to completion:', metadata);
            console.log('[PAYMENT] ⏱️ Completion timeout: 45 seconds');
            
            toast('Completing payment...', { 
              description: 'Recording transaction on blockchain...',
              duration: 5000 
            });
            
            // Set a safety timeout
            const completionTimeout = setTimeout(() => {
              console.warn('[PAYMENT] ⚠️ Completion timeout after 50 seconds');
              if (resolvedOnce) { // Still resolved
                toast.error('Payment completion timeout', { 
                  description: 'Your payment may still be processing',
                  duration: 5000 
                });
                resolve(null);
              }
            }, 50000);
            
            try {
              const { error, data } = await supabase.functions.invoke('pi-payment-complete', {
                body: { paymentId, txid, metadata },
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              
              clearTimeout(completionTimeout);
              
              if (error) {
                console.error('[PAYMENT] ❌ Payment completion error:', error);
                toast.error('Payment completion failed', { 
                  description: error.message || 'Unknown error',
                  duration: 5000 
                });
                resolve(null);
              } else {
                console.log('[PAYMENT] ✅ Payment completed successfully - TXID:', txid);
                console.log('[PAYMENT] ✅ Completion response:', data);
                toast.success('Payment completed successfully!', { 
                  description: `Transaction: ${txid.substring(0, 16)}...`,
                  duration: 5000 
                });
                resolve(txid);
              }
            } catch (invokeErr) {
              clearTimeout(completionTimeout);
              console.error('[PAYMENT] ❌ Completion invoke error:', invokeErr);
              toast.error('Completion request failed', { 
                description: invokeErr instanceof Error ? invokeErr.message : 'Network error',
                duration: 5000 
              });
              resolve(null);
            }
          } catch (err) {
            console.error('[PAYMENT] ❌ Payment completion exception:', err);
            toast.error('Payment completion failed', { 
              description: err instanceof Error ? err.message : 'Unknown error',
              duration: 5000 
            });
            resolve(null);
          }
        },
        
        onCancel: (paymentId: string) => {
          if (resolvedOnce) return;
          resolvedOnce = true;
          
          console.log('[PAYMENT] ⛔ onCancel - Payment cancelled by user');
          console.log('[PAYMENT] Cancelled Payment ID:', paymentId);
          toast('Payment cancelled', { 
            description: 'You cancelled the payment. Your wallet was not charged.',
            duration: 4000 
          });
          resolve(null);
        },
        
        onError: (error: Error, payment?: any) => {
          if (resolvedOnce) return;
          resolvedOnce = true;
          
          console.error('[PAYMENT] ❌ onError - Payment error occurred');
          console.error('[PAYMENT] Error:', error);
          console.error('[PAYMENT] Payment object:', payment);
          toast.error('Payment error', { 
            description: error.message || 'An error occurred during payment.',
            duration: 5000 
          });
          resolve(null);
        }
      };

      try {
        console.log('[PAYMENT] 🎯 Calling Pi.createPayment()...');
        console.log('[PAYMENT] 📦 Payment Data:', paymentData);
        console.log('[PAYMENT] 🔗 Payment Callbacks configured:', Object.keys(paymentCallbacks));
        
        // Create payment using Pi SDK (following official documentation)
        // Note: createPayment is synchronous, callbacks handle the async flow
        window.Pi.createPayment(paymentData, paymentCallbacks);
        
        console.log('[PAYMENT] ✅ Pi.createPayment() invoked successfully');
        toast('Payment initiated', { 
          description: 'Please complete the payment in the Pi Network dialog',
          duration: 5000 
        });
        
      } catch (err) {
        console.error('[PAYMENT] ❌ Exception during Pi.createPayment():', err);
        toast.error('Failed to initiate payment', { 
          description: err instanceof Error ? err.message : 'Payment Error', 
          duration: 5000 
        });
        if (!resolvedOnce) {
          resolvedOnce = true;
          resolve(null);
        }
      }
    });
  };

  const showRewardedAd = async (): Promise<boolean> => {
    // Check if Pi SDK is available and has ad API (with fallbacks)
    const hasPiSDK = !!(window.Pi || (window as any).Pi);
    const hasAdAPI = hasPiSDK && (
      ((window as any).Pi?.Ads?.showAd) || 
      ((window as any).Pi?.showRewardedAd)
    );

    if (!hasPiSDK || !hasAdAPI) {
      console.warn('[AD] Pi SDK or Ad API not available', { hasPiSDK, hasAdAPI, adNetworkSupported });
      toast("Ad Network not available. Please try again.", {
        description: "Ads Not Supported",
        duration: 5000,
      });
      return false;
    }

    if (!isAuthenticated) {
      toast("You must be authenticated to view rewarded ads.", {
        description: "Authentication Required",
        duration: 5000,
      });
      return false;
    }

    try {
      // Show the ad via Pi SDK (supporting both Ads.showAd and direct showRewardedAd)
      let response: any = null;
      try {
        console.log('[AD] Attempting to show rewarded ad...', { 
          hasAdsAPI: !!(window as any).Pi?.Ads?.showAd,
          hasShowRewardedAd: !!(window as any).Pi?.showRewardedAd
        });

        if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.showAd) {
          console.log('[AD] Using Pi.Ads.showAd()');
          response = await (window as any).Pi.Ads.showAd('rewarded');
        } else if ((window as any).Pi && (window as any).Pi.showRewardedAd) {
          console.log('[AD] Using Pi.showRewardedAd()');
          response = await (window as any).Pi.showRewardedAd();
        } else {
          throw new Error('No ad API available');
        }
        console.log('[AD] Ad response:', response);
      } catch (adErr) {
        console.error('[AD] Error showing ad:', adErr);
        console.error('[AD] Error message:', adErr instanceof Error ? adErr.message : String(adErr));
        toast("Failed to show rewarded ad.", { description: "Ad Error", duration: 5000 });
        return false;
      }

      // Normalize adId
      const adId = response?.adId || response?.ad_id || response?.id || null;

      // Prevent duplicate rewards for the same ad id (client-side guard)
      if (adId) {
        try {
          const grantedRaw = localStorage.getItem('ad_rewards_granted') || '[]';
          const granted: string[] = JSON.parse(grantedRaw);
          if (granted.includes(adId)) {
            toast('This ad reward has already been claimed.', { duration: 3000 });
            return false;
          }
        } catch (e) {
          console.warn('Failed to read ad_rewards_granted from localStorage', e);
        }
      }

      if (response?.result === 'AD_REWARDED') {
        // Verify ad claim with backend if possible
        let verified = false;
        try {
          if (adId) {
            const verifyRes = await supabase.functions.invoke('pi-ad-verify', {
              body: { adId },
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const funcErr = (verifyRes as any)?.error;
            const funcData = (verifyRes as any)?.data;
            if (!funcErr && funcData?.mediator_ack_status === 'granted') {
              verified = true;
            }
          } else {
            // No adId available (rare) — allow when adId is missing
            const isMock = (window as any).Pi && (window as any).Pi.__isMock;
            if (isMock) verified = true;
          }
        } catch (verifyErr) {
          console.warn('Ad verification failed:', verifyErr);
        }

        // If verified or mock, distribute DROP tokens once
        if (verified) {
          // Double-check local grant and then call distribution
          try {
            if (adId) {
              const grantedRaw = localStorage.getItem('ad_rewards_granted') || '[]';
              const granted: string[] = JSON.parse(grantedRaw);
              if (granted.includes(adId)) {
                toast('This ad reward has already been claimed.', { duration: 3000 });
                return false;
              }
            }

            // Default per-ad reward: 10 DROP tokens; pass adId for server-side dedupe
            const perAdAmount = 10;
            const sent = await requestDropTokens(perAdAmount, adId ? [adId] : undefined);

            if (sent) {
              // Mark adId as granted
              if (adId) {
                try {
                  const grantedRaw = localStorage.getItem('ad_rewards_granted') || '[]';
                  const granted: string[] = JSON.parse(grantedRaw);
                  granted.push(adId);
                  localStorage.setItem('ad_rewards_granted', JSON.stringify(granted));
                } catch (e) {
                  console.warn('Failed to persist ad reward id', e);
                }
              }

              // Increment today's ad counter
              try {
                incrementTodaysAdCount(1);
              } catch (e) {
                console.warn('Failed to increment todays ad counter', e);
              }

              toast('You have been rewarded for watching the ad!', { description: 'Ad Reward Earned', duration: 3000 });
              return true;
            } else {
              toast('Ad watched but failed to distribute reward. Please try again later.', { duration: 4000 });
              return false;
            }
          } catch (err) {
            console.error('Error distributing drop tokens after ad:', err);
            toast('Failed to distribute ad reward.', { duration: 5000 });
            return false;
          }
        }
      }

      return response?.result === 'AD_REWARDED';
    } catch (err) {
      console.error('Error showing rewarded ad:', err);
      toast('Failed to show rewarded ad.', { description: 'Ad Error', duration: 5000 });
      return false;
    }
  };

  // Watch N rewarded ads sequentially and claim package reward
  const watchAdsAndClaim = async (adsToWatch: number, dropsReward: number): Promise<boolean> => {
    if ((!window.Pi && !(window as any).Pi) || !adNetworkSupported) {
      toast('Ad Network not supported on this Pi Browser version.', { duration: 4000 });
      return false;
    }

    if (!isAuthenticated) {
      toast('You must be authenticated to view rewarded ads.', { duration: 4000 });
      return false;
    }

    if (!adsToWatch || adsToWatch < 1) {
      toast('Invalid number of ads to watch.', { duration: 3000 });
      return false;
    }

    const remaining = getRemainingAdsToday();
    if (adsToWatch > remaining) {
      toast(`You can only watch ${remaining} more ads today.`, { duration: 5000 });
      return false;
    }

    const collectedAdIds: string[] = [];

    for (let i = 0; i < adsToWatch; i++) {
      try {
        const start = Date.now();
        let response: any = null;
        try {
          if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.showAd) {
            response = await (window as any).Pi.Ads.showAd('rewarded');
          } else if ((window as any).Pi && (window as any).Pi.showRewardedAd) {
            response = await (window as any).Pi.showRewardedAd();
          } else {
            throw new Error('Ad API not available');
          }
        } catch (adErr) {
          console.error('Ad show error during package flow:', adErr);
          toast('Failed to show rewarded ad.', { duration: 4000 });
          return false;
        }

        const adId = response?.adId || response?.ad_id || response?.id || null;

        // Enforce minimum watch time (30s)
        const elapsed = Date.now() - start;
        const minMs = 30 * 1000;
        if (elapsed < minMs) {
          try {
            await new Promise(res => setTimeout(res, minMs - elapsed));
          } catch (e) { /* ignore */ }
        }

        if (response?.result !== 'AD_REWARDED') {
          toast('Ad was not rewarded. Try again.', { duration: 4000 });
          return false;
        }

        // Verify each ad via backend
        let verified = false;
        try {
          if (adId) {
            const verifyRes = await supabase.functions.invoke('pi-ad-verify', {
              body: { adId },
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const funcErr = (verifyRes as any)?.error;
            const funcData = (verifyRes as any)?.data;
            if (!funcErr && funcData?.mediator_ack_status === 'granted') {
              verified = true;
            }
          } else {
            const isMock = (window as any).Pi && (window as any).Pi.__isMock;
            if (isMock) verified = true;
          }
        } catch (verifyErr) {
          console.warn('Ad verification failed during package flow:', verifyErr);
        }

        if (!verified) {
          toast('Failed to verify ad watch. Aborting package.', { duration: 5000 });
          return false;
        }

        if (adId) collectedAdIds.push(adId);
      } catch (err) {
        console.error('Error during watchAdsAndClaim flow:', err);
        toast('Error while watching ads. Please try again.', { duration: 5000 });
        return false;
      }
    }

    // Calculate total tokens: configured as 10 DROP tokens per drop unit
    const tokensPerDrop = 10;
    const totalAmount = dropsReward * tokensPerDrop;

    // Send collected adIds to the backend for authoritative dedupe and distribution
    try {
      const distributed = await requestDropTokens(totalAmount, collectedAdIds.length > 0 ? collectedAdIds : undefined);
      if (!distributed) {
        toast('Failed to distribute package reward. Please try again later.', { duration: 5000 });
        return false;
      }

      // Mark all adIds as granted client-side and increment today's counter
      try {
        const grantedRaw = localStorage.getItem('ad_rewards_granted') || '[]';
        const granted: string[] = JSON.parse(grantedRaw);
        for (const id of collectedAdIds) {
          if (!granted.includes(id)) granted.push(id);
        }
        localStorage.setItem('ad_rewards_granted', JSON.stringify(granted));
      } catch (e) {
        console.warn('Failed to persist ad reward ids', e);
      }

      try {
        incrementTodaysAdCount(adsToWatch);
      } catch (e) {
        console.warn('Failed to increment todays ad counter after package distribution', e);
      }

      toast(`Package reward distributed: ${totalAmount} DROP tokens`, { duration: 5000 });
      return true;
    } catch (err) {
      console.error('Failed to distribute package reward:', err);
      toast('Failed to distribute package reward.', { duration: 5000 });
      return false;
    }
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    if ((!window.Pi && !(window as any).Pi) || !adNetworkSupported) {
      toast('Ad Network not supported on this Pi Browser version.', { description: 'Ads Not Supported', duration: 5000 });
      return false;
    }
    try {
      let response: any = null;
      if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.showAd) {
        response = await (window as any).Pi.Ads.showAd('interstitial');
      } else if ((window as any).Pi && (window as any).Pi.showInterstitialAd) {
        response = await (window as any).Pi.showInterstitialAd();
      } else {
        throw new Error('Ad API not available');
      }
      return response?.result === 'AD_CLOSED';
    } catch (err) {
      console.error('Error showing interstitial ad:', err);
      toast('Failed to show interstitial ad.', { description: 'Ad Error', duration: 5000 });
      return false;
    }
  };

  const isAdReady = async (): Promise<boolean> => {
    if ((!window.Pi && !(window as any).Pi) || !adNetworkSupported) return false;
    try {
      if ((window as any).Pi && (window as any).Pi.Ads && (window as any).Pi.Ads.isAdReady) {
        const res = await (window as any).Pi.Ads.isAdReady('rewarded');
        return !!res?.ready;
      }
      return false;
    } catch (err) {
      console.warn('Error checking ad readiness:', err);
      return false;
    }
  };

  const shareContent = async (title: string, text: string): Promise<boolean> => {
    try {
      if ((window as any).Pi && (window as any).Pi.openShareDialog) {
        (window as any).Pi.openShareDialog(title, text);
        return true;
      }
      toast('Share feature not available.', { description: 'Feature Not Available', duration: 3000 });
      return false;
    } catch (err) {
      console.warn('Share failed:', err);
      return false;
    }
  };

  const openExternalUrl = async (url: string): Promise<boolean> => {
    try {
      if ((window as any).Pi && (window as any).Pi.openUrlInSystemBrowser) {
        await (window as any).Pi.openUrlInSystemBrowser(url);
        return true;
      }
      window.open(url, '_blank');
      return true;
    } catch (err) {
      console.warn('Open external URL failed:', err);
      try {
        window.open(url, '_blank');
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  const value: PiContextType = {
    piUser,
    accessToken,
    isAuthenticated,
    loading,
    error,
    isInitialized,
    adNetworkSupported,
    currentAccount,
    availableAccounts,
    currentProfile,
    currentWallet,
    dropBalance,
    signIn,
    signOut,
    getPiUserProfile,
    checkUsernameAvailability,
    loadUserAccounts,
    createAccount,
    switchAccount,
    deleteAccount,
    setWalletAddress,
    importWallet,
    switchToWallet,
    getCurrentWalletAddress,
    createPayment,
    getDROPBalance: getDROPBalanceFunc,
    createDROPTrustline: createDROPTrustlineFunc,
    requestDropTokens,
    getAllWalletTokens: getAllWalletTokensFunc,
    refreshDROPDisplay,
    showRewardedAd,
    watchAdsAndClaim,
    showInterstitialAd,
    isAdReady,
    shareContent,
    openExternalUrl,
  };



  return (
    <PiContext.Provider value={value}>
      {children}
    </PiContext.Provider>
  );
};

export const usePi = () => {
  const context = useContext(PiContext);
  if (context === undefined) {
    throw new Error("usePi must be used within a PiProvider");
  }
  return context;
};

