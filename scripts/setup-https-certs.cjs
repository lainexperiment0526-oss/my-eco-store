const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certsDir = path.join(__dirname, '..', 'dev-certs');

console.log('🔧 Setting up HTTPS certificates for Pi SDK development...\n');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('📁 Created dev-certs directory');
}

// For Windows, let's use a simpler approach with PowerShell
try {
  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️  HTTPS certificates already exist. Skipping creation.');
    console.log('   Delete dev-certs folder to regenerate.');
    process.exit(0);
  }

  console.log('💡 For Windows users, we recommend using mkcert for easy HTTPS setup:');
  console.log('\n📋 Quick HTTPS Setup Options:');
  console.log('\n🔧 Option 1 - Use mkcert (Recommended):');
  console.log('   1. Install mkcert: choco install mkcert');
  console.log('   2. Install CA: mkcert -install');
  console.log('   3. Create cert: mkcert -key-file dev-certs/key.pem -cert-file dev-certs/cert.pem localhost 127.0.0.1');
  
  console.log('\n🔧 Option 2 - Use Ngrok (Cloud tunnel):');
  console.log('   1. Run: npx ngrok http 8082');
  console.log('   2. Use the provided HTTPS URL');
  
  console.log('\n🔧 Option 3 - Continue with HTTP + CORS fixes:');
  console.log('   1. Your app already includes CORS fixes for localhost');
  console.log('   2. Pi SDK will use fallback mode for development');
  console.log('   3. Access: http://localhost:8082');
  
  console.log('\n🔒 For production: Always use HTTPS for Pi SDK validation');

} catch (error) {
  console.error('\n❌ Error setting up HTTPS certificates:', error.message);
  console.log('\n💡 No worries! Your app includes CORS fixes for development.');
  console.log('   Continue with: http://localhost:8082');
}