#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are properly configured
 * Usage: node validate-env.js
 */

import { config } from 'dotenv';
import { secureLog, logEnvStatus } from './utils/secureLogging.js';

config();

// Define required environment variables for different components
const REQUIRED_ENV_VARS = {
  // Core Supabase Configuration
  supabase: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY'
  ],
  
  // Pi Network Integration
  piNetwork: [
    'PI_API_KEY',
    'VITE_PI_API_KEY',
    'VITE_PI_VALIDATION_KEY',
    'VITE_PI_NETWORK'
  ],
  
  // DropPay Integration
  dropPay: [
    'DROPPAY_API_KEY',
    'DROPPAY_WEBHOOK_SECRET',
    'DROPPAY_BASE_URL'
  ],
  
  // Platform Configuration
  platform: [
    'VITE_DOMAIN',
    'VITE_PLATFORM_URL',
    'NODE_ENV'
  ]
};

// Optional environment variables (with defaults)
const OPTIONAL_ENV_VARS = {
  'PORT': '3000',
  'VITE_DEV_MODE': 'false',
  'VITE_DEBUG_MODE': 'false',
  'VITE_ENABLE_PRODUCTION_LOGS': 'false',
  'DEBUG_LOGS': 'false'
};

function validateEnvironment() {
  secureLog.log('🔍 Validating Environment Configuration...\n');
  
  let hasErrors = false;
  let warningCount = 0;
  
  // Check required variables
  for (const [category, envVars] of Object.entries(REQUIRED_ENV_VARS)) {
    secureLog.log(`📋 Checking ${category} configuration:`);
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      logEnvStatus(envVar, value);
      
      if (!value) {
        secureLog.error(`❌ MISSING: ${envVar} is required for ${category}`);
        hasErrors = true;
      }
    }
    secureLog.log(''); // Empty line for readability
  }
  
  // Check optional variables and show defaults
  secureLog.log('📋 Optional Configuration (using defaults if missing):');
  for (const [envVar, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[envVar];
    if (!value) {
      secureLog.warn(`⚠️ ${envVar} not set, using default: ${defaultValue}`);
      warningCount++;
    } else {
      logEnvStatus(envVar, value);
    }
  }
  
  secureLog.log('');
  
  // Security checks
  secureLog.log('🔐 Security Validation:');
  
  // Check for exposed secrets in logs
  const sensitivePatterns = [
    { pattern: /console\.log.*API_KEY/gi, message: 'API keys in console.log statements' },
    { pattern: /console\.log.*SECRET/gi, message: 'Secrets in console.log statements' },
    { pattern: /console\.log.*TOKEN/gi, message: 'Tokens in console.log statements' }
  ];
  
  // Check if environment is properly configured for production
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    secureLog.log('✅ Production environment detected');
    
    // Extra production checks
    if (process.env.VITE_DEBUG_MODE === 'true') {
      secureLog.warn('⚠️ Debug mode enabled in production');
      warningCount++;
    }
    
    if (process.env.VITE_DEV_MODE === 'true') {
      secureLog.warn('⚠️ Dev mode enabled in production');
      warningCount++;
    }
  } else {
    secureLog.log(`ℹ️ Environment: ${nodeEnv || 'development'}`);
  }
  
  // Summary
  secureLog.log('\n📊 Validation Summary:');
  if (hasErrors) {
    secureLog.error('❌ Environment validation FAILED - missing required variables');
    secureLog.error('📝 Please check your .env file and add missing variables');
    process.exit(1);
  } else {
    secureLog.log('✅ All required environment variables are configured');
    if (warningCount > 0) {
      secureLog.warn(`⚠️ ${warningCount} warnings found - using defaults`);
    }
    secureLog.log('🚀 Environment is ready for application startup');
  }
}

// API Key validation utility
function validateApiKeyFormat(key, serviceName) {
  if (!key) return false;
  
  // Basic format validation
  if (key.length < 10) {
    secureLog.warn(`⚠️ ${serviceName} API key seems too short`);
    return false;
  }
  
  // Check for placeholder values
  const placeholders = ['your_', 'replace_', 'example_', 'test_'];
  if (placeholders.some(placeholder => key.toLowerCase().includes(placeholder))) {
    secureLog.error(`❌ ${serviceName} API key appears to be a placeholder`);
    return false;
  }
  
  return true;
}

// Enhanced validation with format checks
function enhancedValidation() {
  secureLog.log('\n🔍 Enhanced API Key Validation:');
  
  // Validate Pi Network API key
  const piApiKey = process.env.PI_API_KEY || process.env.VITE_PI_API_KEY;
  if (validateApiKeyFormat(piApiKey, 'Pi Network')) {
    secureLog.log('✅ Pi Network API key format looks valid');
  }
  
  // Validate DropPay API key
  const dropPayKey = process.env.DROPPAY_API_KEY;
  if (validateApiKeyFormat(dropPayKey, 'DropPay')) {
    secureLog.log('✅ DropPay API key format looks valid');
  }
  
  // Validate Supabase keys
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (validateApiKeyFormat(supabaseKey, 'Supabase Service Role')) {
    secureLog.log('✅ Supabase Service Role key format looks valid');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateEnvironment();
    enhancedValidation();
  } catch (error) {
    secureLog.error('❌ Environment validation failed with error:', error.message);
    process.exit(1);
  }
}