/**
 * Secure Logging Utility for Node.js
 * Prevents accidental exposure of sensitive environment variables and data
 */

// List of sensitive keywords that should be masked
const SENSITIVE_KEYWORDS = [
  'api_key',
  'apikey', 
  'secret',
  'password',
  'token',
  'private_key',
  'privatekey',
  'auth',
  'authorization',
  'bearer',
  'jwt',
  'session',
  'cookie',
  'supabase_key',
  'database_url',
  'connection_string',
];

/**
 * Masks sensitive data in strings
 */
function maskSensitiveData(value) {
  if (typeof value === 'string') {
    // Check if the string contains sensitive keywords
    const lowerValue = value.toLowerCase();
    const isSensitive = SENSITIVE_KEYWORDS.some(keyword => 
      lowerValue.includes(keyword) || 
      lowerValue.includes(`vite_${keyword}`) ||
      lowerValue.includes(`${keyword}_`)
    );
    
    if (isSensitive && value.length > 8) {
      // Mask all but first 4 and last 4 characters for long sensitive strings
      return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
    }
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => maskSensitiveData(item));
    }
    
    const maskedObj = {};
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      const isKeysensitive = SENSITIVE_KEYWORDS.some(keyword => 
        lowerKey.includes(keyword) || 
        lowerKey.includes(`vite_${keyword}`) ||
        lowerKey.includes(`${keyword}_`)
      );
      
      if (isKeysensitive && typeof val === 'string' && val.length > 8) {
        maskedObj[key] = `${val.substring(0, 4)}${'*'.repeat(val.length - 8)}${val.substring(val.length - 4)}`;
      } else {
        maskedObj[key] = maskSensitiveData(val);
      }
    }
    return maskedObj;
  }
  
  return value;
}

/**
 * Secure console log that automatically masks sensitive data
 */
class SecureLogger {
  constructor(options = {}) {
    this.options = {
      maskSensitive: true,
      environment: process.env.NODE_ENV || 'development',
      ...options,
    };
  }

  processArgs(args) {
    if (!this.options.maskSensitive) {
      return args;
    }
    
    return args.map(arg => maskSensitiveData(arg));
  }

  shouldLog() {
    // In production, reduce logging unless explicitly needed
    return this.options.environment === 'development' || process.env.ENABLE_PRODUCTION_LOGS === 'true';
  }

  log(...args) {
    if (this.shouldLog()) {
      console.log(...this.processArgs(args));
    }
  }

  warn(...args) {
    if (this.shouldLog()) {
      console.warn(...this.processArgs(args));
    }
  }

  error(...args) {
    // Always log errors, but mask sensitive data
    console.error(...this.processArgs(args));
  }

  debug(...args) {
    if (this.shouldLog() && (process.env.DEBUG_LOGS === 'true' || this.options.environment === 'development')) {
      console.debug(...this.processArgs(args));
    }
  }

  /**
   * Log environment variable status without exposing values
   */
  logEnvStatus(envName, value) {
    const hasValue = !!(value || process.env[envName]);
    const prefix = '[SERVER ENV]';
    
    if (hasValue) {
      this.log(`${prefix} ✅ ${envName} is configured`);
    } else {
      this.warn(`${prefix} ❌ ${envName} is missing`);
    }
  }

  /**
   * Log API status without exposing keys
   */
  logApiStatus(serviceName, apiKey) {
    const hasKey = !!apiKey;
    if (hasKey) {
      this.log(`🔑 ${serviceName} API key is configured`);
    } else {
      this.warn(`🔑 ${serviceName} API key is missing`);
    }
  }
}

// Create default logger instance
const secureLog = new SecureLogger();

// Export for use
module.exports = {
  secureLog,
  SecureLogger,
  maskSensitiveData,
  logEnvStatus: (envName, value) => secureLog.logEnvStatus(envName, value),
  logApiStatus: (serviceName, apiKey) => secureLog.logApiStatus(serviceName, apiKey)
};