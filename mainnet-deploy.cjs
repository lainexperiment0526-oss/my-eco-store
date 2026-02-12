#!/usr/bin/env node
/**
 * Mainnet Deployment Configuration Script
 * Configures DROP token for Pi Network Mainnet production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuring DropLink for Pi Network Mainnet...');
console.log('================================================');

// Mainnet Configuration
const MAINNET_CONFIG = {
  pi: {
    network: 'mainnet',
    api: 'https://api.mainnet.minepi.com',
    sdk: 'https://sdk.minepi.com/pi-sdk.js',
    sandbox: false
  },
  drop: {
    code: 'DROP',
    issuer: 'GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI',
    distributor: 'GCTPMH43NGN7E4IXLQ27H2XWGGWWDY3I6UAPBFXYQSEUPEKNQE2BZXC2',
    totalSupply: '100000000',
    decimals: 7
  },
  platform: {
    name: 'DropLink',
    domain: 'droplink.space',
    url: 'https://droplink.space',
    email: 'support@droplink.space'
  }
};

// Verification steps
const verifyConfiguration = () => {
  console.log('🔍 Verifying mainnet configuration...');
  
  // Check if pi.toml exists
  const piTomlPath = path.join(__dirname, 'public', 'pi.toml');
  if (!fs.existsSync(piTomlPath)) {
    console.error('❌ pi.toml file not found in public directory');
    process.exit(1);
  }
  
  // Verify pi.toml content
  const piTomlContent = fs.readFileSync(piTomlPath, 'utf8');
  if (!piTomlContent.includes('Pi Mainnet')) {
    console.log('⚠️  pi.toml may still reference testnet');
  } else {
    console.log('✅ pi.toml configured for mainnet');
  }
  
  // Check vercel.json
  const vercelPath = path.join(__dirname, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    const vercelContent = fs.readFileSync(vercelPath, 'utf8');
    if (vercelContent.includes('mainnet')) {
      console.log('✅ vercel.json configured for mainnet');
    } else {
      console.log('⚠️  vercel.json may need mainnet configuration');
    }
  }
  
  console.log('✅ Configuration verification complete');
};

// Generate deployment checklist
const generateChecklist = () => {
  console.log('\\n📋 Pre-deployment Checklist:');
  console.log('=============================');
  console.log('□ 1. Verify domain ownership: droplink.space');
  console.log('□ 2. Deploy pi.toml to: https://droplink.space/.well-known/pi.toml');
  console.log('□ 3. Test Pi SDK initialization in production');
  console.log('□ 4. Verify DROP token visibility in Pi Wallet');
  console.log('□ 5. Test wallet import/export functionality');
  console.log('□ 6. Validate QR code generation');
  console.log('□ 7. Test tip functionality on public bio pages');
  console.log('□ 8. Verify CORS headers for pi.toml');
  console.log('□ 9. Test on multiple devices and browsers');
  console.log('□ 10. Monitor error logs after deployment');
};

// Display important URLs
const displayUrls = () => {
  console.log('\\n🌐 Important URLs for Verification:');
  console.log('===================================');
  console.log(`Pi TOML: https://${MAINNET_CONFIG.platform.domain}/.well-known/pi.toml`);
  console.log(`Platform: ${MAINNET_CONFIG.platform.url}`);
  console.log(`Pi API: ${MAINNET_CONFIG.pi.api}`);
  console.log(`Token Explorer: ${MAINNET_CONFIG.pi.api}/assets?asset_code=${MAINNET_CONFIG.drop.code}&asset_issuer=${MAINNET_CONFIG.drop.issuer}`);
};

// Security reminders
const securityReminders = () => {
  console.log('\\n🔒 Security Reminders:');
  console.log('======================');
  console.log('• Never expose private keys in frontend code');
  console.log('• Validate all user inputs before processing');
  console.log('• Use HTTPS for all Pi Network communications');
  console.log('• Implement proper error handling for network failures');
  console.log('• Monitor for suspicious wallet activities');
  console.log('• Keep dependencies updated for security patches');
};

// Main execution
const main = () => {
  try {
    verifyConfiguration();
    generateChecklist();
    displayUrls();
    securityReminders();
    
    console.log('\\n🎉 Mainnet configuration ready for deployment!');
    console.log('Deploy to Vercel with: vercel --prod');
    console.log('\\n📞 Support: support@droplink.space');
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
  }
};

// Run the script
main();