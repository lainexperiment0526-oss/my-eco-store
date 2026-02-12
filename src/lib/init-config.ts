/**
 * Initialization configuration for DropLink
 * Handles Pi SDK initialization without console spam
 */

// Suppress unnecessary debug logs in console
const isDevelopment = import.meta.env.DEV;

/**
 * Initialize Pi SDK if available
 * Called after window.Pi is ready
 */
export function initializePiSDK() {
  if (typeof window === 'undefined') {
    return;
  }

  // Wait for Pi SDK to be available
  const checkPi = () => {
    if ((window as any).Pi) {
      if (isDevelopment) {
        // Silently check without logging in production
      }
      return true;
    }
    return false;
  };

  // Check immediately
  if (checkPi()) {
    return;
  }

  // Check on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkPi();
    });
  } else {
    // Page already loaded
    window.addEventListener('load', () => {
      checkPi();
    });
  }
}

/**
 * Check if Pi SDK is available
 */
export function isPiAvailable(): boolean {
  return typeof window !== 'undefined' && (window as any).Pi !== undefined;
}

/**
 * Get Pi SDK instance
 */
export function getPiInstance() {
  if (typeof window !== 'undefined') {
    return (window as any).Pi;
  }
  return null;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializePiSDK();
}
