#!/usr/bin/env node

/**
 * Pi Network Environment Variables Verification Script
 * Checks all required variables for Pi Auth, Payments, and Ad Network
 * 
 * Run with: npm run validate-env
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logCheckmark(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=["']?([^"']*?)["']?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

// Configuration checks
const checks = {
  pi_auth: {
    title: '🔐 Pi Network Authentication',
    variables: [
      { key: 'VITE_PI_APP_ID', required: true, description: 'Pi App ID' },
      { key: 'VITE_PI_API_KEY', required: true, description: 'Pi API Key (secret)' },
      { key: 'VITE_PI_VALIDATION_KEY', required: true, description: 'Validation Key' },
      { key: 'VITE_PI_AUTHENTICATION_ENABLED', required: true, expectedValue: 'true', description: 'Authentication enabled' },
      { key: 'VITE_PI_NETWORK', required: true, expectedValue: 'mainnet', description: 'Network mode (must be mainnet)' },
      { key: 'VITE_PI_MAINNET_MODE', required: true, expectedValue: 'true', description: 'Mainnet flag' },
    ],
  },
  pi_payments: {
    title: '💰 Pi Network Payments',
    variables: [
      { key: 'VITE_PI_PAYMENTS_ENABLED', required: true, expectedValue: 'true', description: 'Payments enabled' },
      { key: 'VITE_PI_PAYMENT_RECEIVER_WALLET', required: true, description: 'Payment receiver wallet address' },
      { key: 'VITE_PI_PAYMENT_CURRENCY', required: true, expectedValue: 'PI', description: 'Payment currency' },
      { key: 'VITE_PI_PAYMENT_TIMEOUT', required: true, description: 'Payment timeout (milliseconds)' },
      { key: 'VITE_PI_MAX_PAYMENT_AMOUNT', required: true, description: 'Max payment amount' },
      { key: 'VITE_PI_MIN_PAYMENT_AMOUNT', required: true, description: 'Min payment amount' },
      { key: 'VITE_SUPABASE_URL', required: true, description: 'Supabase URL (for Edge Functions)' },
    ],
  },
  pi_ads: {
    title: '📺 Pi Ad Network',
    variables: [
      { key: 'VITE_PI_AD_NETWORK_ENABLED', required: true, expectedValue: 'true', description: 'Ad Network enabled' },
      { key: 'VITE_PI_AD_NETWORK_VERSION', required: true, expectedValue: '2.0', description: 'Ad Network version' },
      { key: 'VITE_PI_INTERSTITIAL_ADS_ENABLED', required: true, expectedValue: 'true', description: 'Interstitial ads enabled' },
      { key: 'VITE_PI_REWARDED_ADS_ENABLED', required: true, expectedValue: 'true', description: 'Rewarded ads enabled' },
      { key: 'VITE_PI_AD_FREQUENCY_CAP', required: true, description: 'Ad frequency cap (ads per hour)' },
      { key: 'VITE_PI_AD_COOLDOWN_MINUTES', required: true, description: 'Ad cooldown (minutes between ads)' },
    ],
  },
  network: {
    title: '🌐 Network Configuration',
    variables: [
      { key: 'VITE_PI_NETWORK_PASSPHRASE', required: true, expectedValue: 'Pi Mainnet', description: 'Network passphrase' },
      { key: 'VITE_PI_STELLAR_NETWORK', required: true, expectedValue: 'mainnet', description: 'Stellar network' },
      { key: 'VITE_PI_STELLAR_HORIZON_URL', required: true, description: 'Stellar Horizon URL' },
      { key: 'VITE_PI_API_URL', required: true, expectedValue: 'https://api.minepi.com', description: 'Pi API URL' },
    ],
  },
};

// Run checks
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

Object.entries(checks).forEach(([category, config]) => {
  logSection(config.title);
  
  config.variables.forEach(variable => {
    totalChecks++;
    const value = env[variable.key];
    const isMissing = !value;
    const isWrongValue = variable.expectedValue && value !== variable.expectedValue;
    
    if (isMissing) {
      logError(`${variable.key} is missing - ${variable.description}`);
      failedChecks++;
    } else if (isWrongValue) {
      logError(
        `${variable.key} is incorrect\n` +
        `     Expected: ${variable.expectedValue}\n` +
        `     Got: ${value}`
      );
      failedChecks++;
    } else if (variable.key.includes('KEY') || variable.key.includes('SECRET')) {
      // Hide secrets but confirm they're set
      logCheckmark(`${variable.key} is set (${value.length} chars) - ${variable.description}`);
      passedChecks++;
    } else {
      logCheckmark(`${variable.key}=${value} - ${variable.description}`);
      passedChecks++;
    }
  });
});

// Summary
logSection('📊 Summary');
log(`Total Checks: ${totalChecks}`, 'blue');
log(`Passed: ${passedChecks}`, 'green');
log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');

// Warnings
logSection('⚠️  Important Notes');
logWarning('Make sure you are in the Pi Browser, not a regular browser');
logWarning('Sensitive keys (API key, validation key) should never be committed to git');
logWarning('Ensure .env file is added to .gitignore');

// Final status
if (failedChecks === 0) {
  logSection('✅ Configuration Valid');
  log('All Pi Network environment variables are correctly configured!', 'green');
  log('You can proceed with testing Pi Auth, Payments, and Ad Network.', 'green');
  process.exit(0);
} else {
  logSection('❌ Configuration Invalid');
  log(`${failedChecks} variable(s) need to be fixed before proceeding.`, 'red');
  log('Please review the errors above and update your .env file.', 'red');
  process.exit(1);
}
