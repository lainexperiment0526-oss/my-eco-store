// Pi SDK CORS Fix for Development
// This script patches the Pi SDK to work with localhost development

(function() {
  'use strict';
  
  console.log('[PI CORS FIX] 🔧 Applying Pi SDK CORS patches for development...');
  
  // Store original postMessage
  const originalPostMessage = window.postMessage;
  const originalFetch = window.fetch;
  
  // Override postMessage to handle origin mismatches
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      // If it's a Pi SDK message and we're on localhost, avoid origin mismatch errors
      if (targetOrigin && targetOrigin.includes('minepi.com') && window.location.hostname === 'localhost') {
        const safeOrigin = window.location.origin;
        return originalPostMessage.call(this, message, safeOrigin, transfer);
      }

      // For all other cases, use original postMessage
      return originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (error) {
      // Fallback to a safe same-origin target
      try {
        return originalPostMessage.call(this, message, window.location.origin, transfer);
      } catch (fallbackError) {
        return;
      }
    }
  };
  
  // Override fetch to add CORS headers ONLY for Pi SDK requests
  // DO NOT intercept Supabase, other APIs - they have their own CORS handling
  window.fetch = function(url, options = {}) {
    // ONLY intercept Pi Network SDK requests
    if (typeof url === 'string' && url.includes('minepi.com') && url.includes('/pi-sdk')) {
      console.log('[PI CORS FIX] 📡 Intercepting Pi SDK fetch request');
      const corsOptions = {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Access-Control-Allow-Origin': '*',
        }
      };
      return originalFetch.call(this, url, corsOptions);
    }
    // For all other requests (Supabase, etc.), use original fetch without modification
    return originalFetch.call(this, url, options);
  };
  
  // Pi SDK environment detection without mocking
  function setupPiFallback() {
    // Do NOT create any Pi SDK fallback/mock - it interferes with real SDK
    if (typeof window.Pi === 'undefined') {
      console.warn('[PI CORS FIX] ⚠️ Pi SDK not detected - app should only work in Pi Browser');
    } else {
      console.log('[PI CORS FIX] ✅ Pi SDK is available');
    }
  }
  
  // Apply fallback immediately and after DOM ready
  setupPiFallback();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPiFallback);
  } else {
    setupPiFallback();
  }
  
  // Monitor for Pi SDK loading
  let checkCount = 0;
  const maxChecks = 50; // 5 seconds
  
  const checkPiSDK = setInterval(() => {
    checkCount++;
    
    if (typeof window.Pi !== 'undefined' && window.Pi.init) {
      console.log('[PI CORS FIX] ✅ Real Pi SDK detected, no fallback needed');
      clearInterval(checkPiSDK);
    } else if (checkCount >= maxChecks) {
      console.warn('[PI CORS FIX] ⏰ Pi SDK check timeout; still no SDK detected.');
      clearInterval(checkPiSDK);
      setupPiFallback();
    }
  }, 100);
  
  console.log('[PI CORS FIX] ✅ Pi SDK CORS patches applied successfully');
})();

