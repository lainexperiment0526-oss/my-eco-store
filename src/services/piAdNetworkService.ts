/**
 * Pi Ad Network Integration
 * Complete implementation for Interstitial, Rewarded, and Banner ads
 * Based on official Pi Platform documentation
 */

export interface AdResponse {
  type: 'interstitial' | 'rewarded';
  result: 'AD_CLOSED' | 'AD_REWARDED' | 'AD_DISPLAY_ERROR' | 'AD_NETWORK_ERROR' | 'AD_NOT_AVAILABLE' | 'ADS_NOT_SUPPORTED' | 'USER_UNAUTHENTICATED';
  adId?: string;
}

export interface AdReadyResponse {
  type: 'interstitial' | 'rewarded';
  ready: boolean;
}

export interface AdLoadResponse {
  type: 'interstitial' | 'rewarded';
  result: 'AD_LOADED' | 'AD_LOAD_ERROR' | 'ADS_NOT_SUPPORTED';
}

export interface RewardedAdVerification {
  adId: string;
  verified: boolean;
  mediatorAckStatus: 'granted' | 'denied' | 'pending';
  reward?: any;
}

export class PiAdNetworkService {
  private static adNetworkSupported: boolean | null = null;
  
  /**
   * Initialize and check Ad Network support
   */
  static async checkAdNetworkSupport(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.Pi) {
        console.log('[PI ADS] ❌ Pi SDK not available');
        return false;
      }
      
      // Check native features for ad_network
      const features = await window.Pi.nativeFeaturesList();
      this.adNetworkSupported = features.includes('ad_network');
      
      if (this.adNetworkSupported) {
        console.log('[PI ADS] ✅ Ad Network is supported');
      } else {
        console.log('[PI ADS] ⚠️ Ad Network NOT supported - Update Pi Browser');
      }
      
      return this.adNetworkSupported;
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to check Ad Network support:', error);
      this.adNetworkSupported = false;
      return false;
    }
  }
  
  /**
   * Check if ad network is supported (cached)
   */
  static isAdNetworkSupported(): boolean {
    return this.adNetworkSupported === true;
  }
  
  /**
   * INTERSTITIAL ADS - Basic Usage
   * Simple one-call ad display
   */
  static async showInterstitialAd(): Promise<boolean> {
    console.log('[PI ADS] 🎬 Showing interstitial ad...');
    
    try {
      if (!window.Pi?.Ads?.showAd) {
        console.error('[PI ADS] ❌ Ads API not available');
        return false;
      }
      
      const response = await window.Pi.Ads.showAd('interstitial');
      
      if (response.result === 'AD_CLOSED') {
        console.log('[PI ADS] ✅ Interstitial ad closed by user');
        return true;
      } else if (response.result === 'ADS_NOT_SUPPORTED') {
        console.log('[PI ADS] ⚠️ Ads not supported - Update Pi Browser');
        return false;
      } else {
        console.log('[PI ADS] ⚠️ Ad display result:', response.result);
        return false;
      }
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to show interstitial ad:', error);
      return false;
    }
  }
  
  /**
   * INTERSTITIAL ADS - Advanced Usage
   * With ad readiness checking and manual loading
   */
  static async showInterstitialAdAdvanced(): Promise<boolean> {
    console.log('[PI ADS] 🎬 Showing interstitial ad (advanced)...');
    
    try {
      if (!window.Pi?.Ads) {
        throw new Error('Ads API not available');
      }
      
      // Step 1: Check if ad is ready
      const isReadyResponse = await window.Pi.Ads.isAdReady('interstitial');
      
      if (!isReadyResponse.ready) {
        console.log('[PI ADS] ⏳ Ad not ready, requesting ad...');
        
        // Step 2: Request ad if not ready
        if (window.Pi.Ads.requestAd) {
          const requestResponse = await window.Pi.Ads.requestAd('interstitial');
          
          if (requestResponse.result === 'ADS_NOT_SUPPORTED') {
            console.log('[PI ADS] ⚠️ Ads not supported');
            return false;
          }
          
          if (requestResponse.result !== 'AD_LOADED') {
            console.log('[PI ADS] ⚠️ Ad could not be loaded');
            return false;
          }
          
          console.log('[PI ADS] ✅ Ad loaded successfully');
        }
      }
      
      // Step 3: Show the ad
      const showResponse = await window.Pi.Ads.showAd('interstitial');
      
      if (showResponse.result !== 'AD_CLOSED') {
        console.log('[PI ADS] ⚠️ Ad not closed properly:', showResponse.result);
        return false;
      }
      
      console.log('[PI ADS] ✅ Interstitial ad completed');
      return true;
      
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to show interstitial ad (advanced):', error);
      return false;
    }
  }
  
  /**
   * REWARDED ADS - Basic Usage
   * Returns adId for server verification
   */
  static async showRewardedAd(): Promise<{ success: boolean; adId?: string }> {
    console.log('[PI ADS] Showing rewarded ad...');
    
    try {
      if (!window.Pi?.Ads?.showAd) {
        throw new Error('Ads API not available');
      }
      
      const response = await window.Pi.Ads.showAd('rewarded');
      
      if (response.result === 'AD_REWARDED') {
        console.log('[PI ADS] ✅ User watched rewarded ad:', response.adId);
        
        // CRITICAL: Must verify with server before rewarding
        return {
          success: true,
          adId: response.adId,
        };
      } else if (response.result === 'USER_UNAUTHENTICATED') {
        console.log('[PI ADS] ⚠️ User not authenticated - Login required for rewarded ads');
        return { success: false };
      } else {
        console.log('[PI ADS] ⚠️ Rewarded ad result:', response.result);
        return { success: false };
      }
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to show rewarded ad:', error);
      return { success: false };
    }
  }
  
  /**
   * REWARDED ADS - Advanced Usage with Server Verification
   * Complete flow with error handling
   */
  static async showRewardedAdAdvanced(
    onAdWatched: (adId: string) => Promise<boolean>
  ): Promise<{ success: boolean; rewarded: boolean; adId?: string }> {
    console.log('[PI ADS] Showing rewarded ad (advanced)...');
    
    try {
      if (!window.Pi?.Ads) {
        throw new Error('Ads API not available');
      }
      
      // Step 1: Check if ad is ready
      const isReadyResponse = await window.Pi.Ads.isAdReady('rewarded');
      
      if (!isReadyResponse.ready) {
        console.log('[PI ADS] ⏳ Rewarded ad not ready, requesting...');
        
        // Step 2: Request ad
        if (window.Pi.Ads.requestAd) {
          const requestResponse = await window.Pi.Ads.requestAd('rewarded');
          
          if (requestResponse.result === 'ADS_NOT_SUPPORTED') {
            console.log('[PI ADS] ⚠️ Ads not supported - Update Pi Browser');
            return { success: false, rewarded: false };
          }
          
          if (requestResponse.result !== 'AD_LOADED') {
            console.log('[PI ADS] ⚠️ Ad temporarily unavailable, try again later');
            return { success: false, rewarded: false };
          }
        }
      }
      
      // Step 3: Show the ad
      const showResponse = await window.Pi.Ads.showAd('rewarded');
      
      if (showResponse.result === 'AD_REWARDED' && showResponse.adId) {
        console.log('[PI ADS] ✅ User watched ad:', showResponse.adId);
        
        // Step 4: CRITICAL - Verify with server before rewarding
        console.log('[PI ADS] 🔐 Verifying ad with server...');
        const verified = await onAdWatched(showResponse.adId);
        
        if (verified) {
          console.log('[PI ADS] ✅ Ad verified - User rewarded');
          return { success: true, rewarded: true, adId: showResponse.adId };
        } else {
          console.error('[PI ADS] ❌ SECURITY: Ad verification failed - User NOT rewarded');
          return { success: true, rewarded: false, adId: showResponse.adId };
        }
      } else {
        console.log('[PI ADS] ⚠️ Ad not rewarded:', showResponse.result);
        return { success: false, rewarded: false };
      }
      
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to show rewarded ad (advanced):', error);
      return { success: false, rewarded: false };
    }
  }
  
  /**
   * Verify rewarded ad with Pi Platform API
   * MUST be called on your server, not client!
   */
  static async verifyRewardedAd(
    adId: string,
    accessToken: string
  ): Promise<RewardedAdVerification> {
    console.log('[PI ADS] 🔐 Verifying rewarded ad with server...');
    
    try {
      // Call your backend API endpoint
      const response = await fetch('/api/pi/verify-rewarded-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ adId }),
      });
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // CRITICAL: Only reward if mediator_ack_status is "granted"
      if (result.mediator_ack_status !== 'granted') {
        console.error('[PI ADS] ⚠️ SECURITY: Ad not granted by mediator');
        return {
          adId,
          verified: false,
          mediatorAckStatus: result.mediator_ack_status,
        };
      }
      
      console.log('[PI ADS] ✅ Ad verified successfully');
      return {
        adId,
        verified: true,
        mediatorAckStatus: 'granted',
        reward: result.reward,
      };
      
    } catch (error) {
      console.error('[PI ADS] ❌ Ad verification failed:', error);
      return {
        adId,
        verified: false,
        mediatorAckStatus: 'denied',
      };
    }
  }
  
  /**
   * Check if specific ad type is ready
   */
  static async isAdReady(adType: 'interstitial' | 'rewarded'): Promise<boolean> {
    try {
      if (!window.Pi?.Ads?.isAdReady) {
        return false;
      }
      
      const response = await window.Pi.Ads.isAdReady(adType);
      return response.ready;
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to check ad readiness:', error);
      return false;
    }
  }
  
  /**
   * Request ad to be loaded in advance
   */
  static async requestAd(adType: 'interstitial' | 'rewarded'): Promise<boolean> {
    try {
      if (!window.Pi?.Ads?.requestAd) {
        return false;
      }
      
      const response = await window.Pi.Ads.requestAd(adType);
      return response.result === 'AD_LOADED';
    } catch (error) {
      console.error('[PI ADS] ❌ Failed to request ad:', error);
      return false;
    }
  }
  
  /**
   * BANNER ADS - Enable in Developer Portal
   * Banner ads are configured in Pi Developer Portal settings
   * They automatically show while app is loading
   */
  static getBannerAdInfo(): string {
    return `
Banner Ads Configuration:
1. Go to Pi Developer Portal: pi://develop.pi
2. Select your app
3. Go to Dev Ad Network → Settings
4. Toggle "Enable Loading Banner Ads"
5. Banner ads will automatically show during app loading

Note: Banner ads cannot be controlled via SDK - they are managed by Pi Browser settings.
    `.trim();
  }
  
  /**
   * Helper: Show modal if ads not supported
   */
  static showAdsNotSupportedModal(): void {
    console.log('[PI ADS] ⚠️ Showing "Update Pi Browser" modal');
    // Implement your UI modal here
    alert('Ads require the latest Pi Browser. Please update your Pi Browser to enjoy this feature.');
  }
  
  /**
   * Helper: Show modal if ad unavailable
   */
  static showAdUnavailableModal(): void {
    console.log('[PI ADS] ⚠️ Showing "Ad temporarily unavailable" modal');
    // Implement your UI modal here
    alert('Ads are temporarily unavailable. Please try again later.');
  }
}

/**
 * Example: Watch multiple ads for rewards
 */
export async function watchAdsForReward(
  adsToWatch: number,
  rewardPerAd: number,
  onProgress: (watched: number, total: number, totalReward: number) => void,
  verifyAdCallback: (adId: string) => Promise<boolean>
): Promise<{ success: boolean; totalRewarded: number }> {
  let totalRewarded = 0;
  let watched = 0;
  
  for (let i = 0; i < adsToWatch; i++) {
    console.log(`[PI ADS] Watching ad ${i + 1}/${adsToWatch}...`);
    
    const result = await PiAdNetworkService.showRewardedAdAdvanced(verifyAdCallback);
    
    if (result.success && result.rewarded) {
      totalRewarded += rewardPerAd;
      watched++;
      onProgress(watched, adsToWatch, totalRewarded);
    } else {
      // Failed to show or verify ad
      break;
    }
    
    // Short delay between ads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return {
    success: watched === adsToWatch,
    totalRewarded,
  };
}
