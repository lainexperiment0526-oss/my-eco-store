/**
 * Production Security Layer
 * Suppresses console errors, hides sensitive data
 * Mainnet production environment only
 * 
 * IMPORTANT: Only enabled on actual production domain (droplink.space)
 * NOT enabled on localhost or development environments
 */

// ONLY enable in production with HTTPS
const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production';
const isHTTPS = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;
const isProductionDomain = typeof window !== 'undefined' ? 
  window.location.hostname === 'droplink.space' || window.location.hostname === 'www.droplink.space'
  : false;

// Only enable if ALL conditions are met
const shouldEnable = isProduction && isHTTPS && isProductionDomain;

const hideConsoleErrors = import.meta.env.VITE_HIDE_CONSOLE_ERRORS === 'true' && shouldEnable;
const disableDebugLogs = import.meta.env.VITE_DISABLE_DEBUG_LOGS === 'true' && shouldEnable;
const hideSensitiveData = import.meta.env.VITE_HIDE_SENSITIVE_DATA === 'true' && shouldEnable;
const suppressErrorDetails = import.meta.env.VITE_SUPPRESS_ERROR_DETAILS === 'true' && shouldEnable;

// Store original console methods BEFORE we override them
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalDebug = console.debug;

/**
 * Safe console logging - strips sensitive data in production
 * Uses STORED original methods to avoid infinite recursion
 */
export const safeConsole = {
  log: (...args: any[]) => {
    if (!shouldEnable) {
      originalLog(...args);
      return;
    }
    if (disableDebugLogs) {
      return; // Silent in production
    }
    if (hideSensitiveData) {
      const sanitized = sanitizeArgs(args);
      originalLog(...sanitized);
    } else {
      originalLog(...args);
    }
  },

  error: (...args: any[]) => {
    if (!shouldEnable) {
      originalError(...args);
      return;
    }
    if (hideConsoleErrors) {
      return; // Silent error logging in production
    }
    if (suppressErrorDetails) {
      // Only log generic message
      originalError('[PRODUCTION ERROR] An error occurred');
      return;
    }
    if (hideSensitiveData) {
      const sanitized = sanitizeArgs(args);
      originalError(...sanitized);
    } else {
      originalError(...args);
    }
  },

  warn: (...args: any[]) => {
    if (!shouldEnable) {
      originalWarn(...args);
      return;
    }
    if (disableDebugLogs) {
      return; // Silent warnings in production
    }
    if (hideSensitiveData) {
      const sanitized = sanitizeArgs(args);
      originalWarn(...sanitized);
    } else {
      originalWarn(...args);
    }
  },

  debug: (...args: any[]) => {
    if (!shouldEnable) {
      originalDebug(...args);
      return;
    }
    // No debug logs in production
    return;
  },
};

/**
 * Sanitize sensitive data from logs
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeString(arg);
    }
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
}

/**
 * Sanitize string values
 */
function sanitizeString(str: string): string {
  let sanitized = str;

  // Hide API keys
  sanitized = sanitized.replace(
    /([Aa]pi[_-]?[Kk]ey|[Aa]pplication[_-]?[Kk]ey)\s*[:=]\s*([a-z0-9]{10,})/gi,
    '$1: [REDACTED]'
  );

  // Hide tokens
  sanitized = sanitized.replace(
    /([Aa]ccess|[Bb]earer|[Tt]oken)\s*[:=]\s*([a-z0-9]{10,})/gi,
    '$1: [REDACTED]'
  );

  // Hide wallet addresses (Stellar addresses start with G)
  sanitized = sanitized.replace(
    /G[A-Z2-7]{55,}/g,
    'WALLET_ADDRESS_REDACTED'
  );

  // Hide private keys
  sanitized = sanitized.replace(
    /([Pp]rivate[_-]?[Kk]ey|[Ss]ecret[_-]?[Kk]ey)\s*[:=]\s*([a-z0-9]{20,})/gi,
    '$1: [REDACTED]'
  );

  // Hide UUIDs
  sanitized = sanitized.replace(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
    'UUID_REDACTED'
  );

  return sanitized;
}

/**
 * Sanitize objects (like error objects)
 */
function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      }
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive keys entirely
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Check if key is sensitive
 */
function isSensitiveKey(key: string): boolean {
  const sensitiveKeys = [
    'apikey',
    'api_key',
    'token',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'privatekey',
    'private_key',
    'secretkey',
    'secret_key',
    'password',
    'secret',
    'authorization',
    'bearer',
    'credential',
    'credentials',
    'auth',
    'key',
    'keys',
  ];
  return sensitiveKeys.includes(key.toLowerCase());
}

/**
 * Override console in production
 * ONLY runs on actual production domain with HTTPS
 */
export function enableProductionSecurity() {
  // Only enable on actual production (not localhost)
  if (!shouldEnable) {
    originalLog('[PRODUCTION SECURITY] Skipped - not on production domain');
    return;
  }

  // Replace console methods with SAFE versions
  console.log = safeConsole.log;
  console.error = safeConsole.error;
  console.warn = safeConsole.warn;
  console.debug = safeConsole.debug;

  // Safe error handler for uncaught errors
  window.addEventListener('error', (event) => {
    if (suppressErrorDetails) {
      event.preventDefault();
      originalLog('[UNCAUGHT ERROR] An unexpected error occurred');
    }
  });

  // Safe error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (suppressErrorDetails) {
      event.preventDefault();
      originalLog('[UNHANDLED REJECTION] An unexpected error occurred');
    }
  });

  originalLog('[PRODUCTION SECURITY] ✅ Security layer activated on production domain');
}

/**
 * Get safe error message for users
 */
export function getSafeErrorMessage(error: any): string {
  if (!isProduction) {
    return error?.message || JSON.stringify(error);
  }

  // Return generic message in production
  if (error?.code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your connection and try again.';
  }
  if (error?.code === 'AUTH_ERROR') {
    return 'Authentication failed. Please sign in again.';
  }
  if (error?.code === 'PAYMENT_ERROR') {
    return 'Payment processing failed. Please try again.';
  }

  return 'An error occurred. Please try again later.';
}

/**
 * Validate mainnet configuration (production safety check)
 */
export function validateProductionSecurity(): boolean {
  // Skip validation on localhost (development)
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    originalLog('[PRODUCTION SECURITY] ℹ️ Development mode - skipping validation');
    return true;
  }

  const checks = [
    {
      name: 'Environment',
      valid: import.meta.env.VITE_ENVIRONMENT === 'production',
    },
    {
      name: 'Sandbox Disabled',
      valid: import.meta.env.VITE_PI_SANDBOX_MODE !== 'true',
    },
    {
      name: 'Mainnet Enabled',
      valid: import.meta.env.VITE_PI_MAINNET_MODE === 'true',
    },
    {
      name: 'Debug Mode Disabled',
      valid: import.meta.env.VITE_DEBUG_MODE === 'false',
    },
    {
      name: 'HTTPS Enforced',
      valid: typeof window !== 'undefined' ? window.location.protocol === 'https:' : true,
    },
  ];

  let allValid = true;
  checks.forEach(check => {
    if (!check.valid) {
      allValid = false;
      originalError(`[PRODUCTION SECURITY] ❌ Check failed: ${check.name}`);
    }
  });

  if (allValid && shouldEnable) {
    originalLog('[PRODUCTION SECURITY] ✅ All security checks passed');
  }

  return allValid;
}
