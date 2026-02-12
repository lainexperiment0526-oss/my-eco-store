/**
 * Pi Authentication Debugger
 * Comprehensive debugging utilities for Pi Auth issues
 */

export interface AuthDebugInfo {
  timestamp: string;
  isPiBrowser: boolean;
  sdkAvailable: boolean;
  sdkVersion?: string;
  userAgent: string;
  nativeFeatures?: string[];
  storageAvailable: boolean;
  localStorageKeys: string[];
  error?: string;
}

export interface AuthFlowStep {
  step: string;
  status: 'pending' | 'success' | 'error';
  timestamp: string;
  details?: any;
  error?: string;
}

export class PiAuthDebugger {
  private static authFlow: AuthFlowStep[] = [];
  
  /**
   * Collect comprehensive debug information
   */
  static async collectDebugInfo(): Promise<AuthDebugInfo> {
    const info: AuthDebugInfo = {
      timestamp: new Date().toISOString(),
      isPiBrowser: this.checkPiBrowser(),
      sdkAvailable: typeof window !== 'undefined' && typeof window.Pi !== 'undefined',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      storageAvailable: this.checkStorage(),
      localStorageKeys: this.getStorageKeys(),
    };
    
    // Check SDK version if available
    if (info.sdkAvailable && window.Pi) {
      try {
        // Try to get native features (SDK 2.0+)
        const features = await window.Pi.nativeFeaturesList();
        info.nativeFeatures = features;
      } catch (e) {
        info.error = `Failed to get native features: ${e}`;
      }
    }
    
    return info;
  }
  
  /**
   * Check if Pi Browser with multiple detection methods
   */
  private static checkPiBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Method 1: window.Pi object
    if (typeof window.Pi !== 'undefined') return true;
    
    // Method 2: UserAgent
    const ua = window.navigator.userAgent || '';
    if (/PiBrowser|Pi\s?Browser|Pi\s?App|minepi|Pi Network/i.test(ua)) return true;
    
    // Method 3: Pi-specific properties
    if ((window.navigator as any).pi !== undefined || (window as any).piApp !== undefined) return true;
    
    return false;
  }
  
  /**
   * Check localStorage availability
   */
  private static checkStorage(): boolean {
    try {
      const testKey = '__pi_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get all Pi-related localStorage keys
   */
  private static getStorageKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('pi_') || key.includes('Pi') || key.includes('drop'))) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
  
  /**
   * Log authentication flow step
   */
  static logStep(step: string, status: 'pending' | 'success' | 'error', details?: any, error?: string) {
    const flowStep: AuthFlowStep = {
      step,
      status,
      timestamp: new Date().toISOString(),
      details,
      error,
    };
    
    this.authFlow.push(flowStep);
    
    // Console log with emoji
    const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳';
    console.log(`[PI DEBUG] ${emoji} ${step}`, details || '', error || '');
  }
  
  /**
   * Get full authentication flow
   */
  static getAuthFlow(): AuthFlowStep[] {
    return [...this.authFlow];
  }
  
  /**
   * Clear authentication flow history
   */
  static clearAuthFlow() {
    this.authFlow = [];
  }
  
  /**
   * Generate debug report for support
   */
  static async generateDebugReport(): Promise<string> {
    const info = await this.collectDebugInfo();
    const flow = this.getAuthFlow();
    
    let report = '=== Pi Authentication Debug Report ===\n\n';
    report += `Generated: ${info.timestamp}\n\n`;
    
    report += '--- Environment ---\n';
    report += `Pi Browser Detected: ${info.isPiBrowser ? 'YES ✅' : 'NO ❌'}\n`;
    report += `SDK Available: ${info.sdkAvailable ? 'YES ✅' : 'NO ❌'}\n`;
    report += `Storage Available: ${info.storageAvailable ? 'YES ✅' : 'NO ❌'}\n`;
    report += `UserAgent: ${info.userAgent}\n`;
    
    if (info.nativeFeatures) {
      report += `Native Features: ${info.nativeFeatures.join(', ')}\n`;
    }
    
    if (info.localStorageKeys.length > 0) {
      report += `\n--- Storage Keys ---\n`;
      info.localStorageKeys.forEach(key => {
        report += `- ${key}\n`;
      });
    }
    
    if (flow.length > 0) {
      report += `\n--- Authentication Flow ---\n`;
      flow.forEach((step, index) => {
        const emoji = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⏳';
        report += `${index + 1}. ${emoji} ${step.step} [${step.status}]\n`;
        if (step.error) report += `   Error: ${step.error}\n`;
        if (step.details) report += `   Details: ${JSON.stringify(step.details)}\n`;
      });
    }
    
    if (info.error) {
      report += `\n--- Errors ---\n${info.error}\n`;
    }
    
    report += '\n=== End Debug Report ===';
    return report;
  }
  
  /**
   * Diagnose common authentication issues
   */
  static async diagnoseIssues(): Promise<string[]> {
    const issues: string[] = [];
    const info = await this.collectDebugInfo();
    
    // Check 1: Pi Browser
    if (!info.isPiBrowser) {
      issues.push('⚠️ Not running in Pi Browser - Pi Auth requires Pi Browser');
    }
    
    // Check 2: SDK availability
    if (!info.sdkAvailable) {
      issues.push('⚠️ Pi SDK not loaded - Check CDN connection or wait for SDK to load');
    }
    
    // Check 3: Storage
    if (!info.storageAvailable) {
      issues.push('⚠️ localStorage not available - Check browser privacy settings');
    }
    
    // Check 4: Ad network support
    if (info.nativeFeatures && !info.nativeFeatures.includes('ad_network')) {
      issues.push('ℹ️ Ad Network not supported - Update Pi Browser to latest version');
    }
    
    // Check 5: Previous authentication
    const hasToken = info.localStorageKeys.includes('pi_accessToken');
    const hasUser = info.localStorageKeys.includes('pi_user');
    if (!hasToken && !hasUser) {
      issues.push('ℹ️ No previous authentication found - First time sign-in required');
    }
    
    // Check 6: Mobile detection
    if (info.userAgent.includes('Android') || info.userAgent.includes('iPhone')) {
      if (!info.isPiBrowser) {
        issues.push('⚠️ Mobile device detected but not Pi Browser - Open link in Pi Browser');
      }
    }
    
    if (issues.length === 0) {
      issues.push('✅ Environment looks good - If authentication fails, user may need to authorize app in Pi Network settings');
    }
    
    return issues;
  }
  
  /**
   * Copy debug report to clipboard
   */
  static async copyDebugReport(): Promise<boolean> {
    try {
      const report = await this.generateDebugReport();
      await navigator.clipboard.writeText(report);
      console.log('[PI DEBUG] ✅ Debug report copied to clipboard');
      return true;
    } catch (error) {
      console.error('[PI DEBUG] ❌ Failed to copy debug report:', error);
      return false;
    }
  }
  
  /**
   * Check specific error codes
   */
  static interpretError(error: any): string {
    const errorStr = String(error?.message || error || '');
    
    if (errorStr.includes('Authentication failed')) {
      return '90% chance: User has not authorized app in Pi Network settings. Go to Pi Network app → Settings → Connected Apps → Authorize Droplink';
    }
    
    if (errorStr.includes('No accessToken')) {
      return 'Pi.authenticate() did not return an access token. This usually means user denied permission or app is not authorized.';
    }
    
    if (errorStr.includes('Invalid access token')) {
      return 'Token verification failed with Pi API. Token may be expired or invalid.';
    }
    
    if (errorStr.includes('payments')) {
      return 'Payment scope was rejected. User may not have approved payment permissions. Try with just ["username"] scope.';
    }
    
    if (errorStr.includes('401')) {
      return 'Unauthorized - Token is invalid or expired. User needs to re-authenticate.';
    }
    
    if (errorStr.includes('Network')) {
      return 'Network error - Check internet connection or Pi API availability.';
    }
    
    return `Unknown error: ${errorStr}. Check console for [PI DEBUG] logs.`;
  }
}

/**
 * Quick diagnostic function for console
 */
export async function diagnosePiAuth() {
  console.log('=== Pi Auth Diagnostic ===');
  const issues = await PiAuthDebugger.diagnoseIssues();
  issues.forEach(issue => console.log(issue));
  console.log('\nFor full report, call: PiAuthDebugger.generateDebugReport()');
}

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).diagnosePiAuth = diagnosePiAuth;
  (window as any).PiAuthDebugger = PiAuthDebugger;
}
