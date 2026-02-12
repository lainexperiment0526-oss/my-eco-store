import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, '..', 'dev-certs');

console.log('🔧 Setting up HTTPS certificates for Pi SDK development...\n');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('📁 Created dev-certs directory');
}

try {
  // Check if OpenSSL is available
  try {
    execSync('openssl version', { stdio: 'ignore' });
    console.log('✅ OpenSSL found');
  } catch (error) {
    throw new Error('OpenSSL not found. Please install OpenSSL or use WSL on Windows.');
  }

  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️  HTTPS certificates already exist. Skipping creation.');
    console.log('   Delete dev-certs folder to regenerate.');
    process.exit(0);
  }

  // Generate private key
  console.log('🔑 Generating private key...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

  // Generate certificate
  console.log('🎫 Generating self-signed certificate...');
  const opensslCmd = [
    'openssl', 'req', '-new', '-x509',
    '-key', `"${keyPath}"`,
    '-out', `"${certPath}"`,
    '-days', '365',
    '-subj', '/CN=localhost'
  ].join(' ');
  
  execSync(opensslCmd, { stdio: 'inherit' });

  console.log('\n✅ HTTPS certificates created successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npm run dev:https');
  console.log('   2. Accept the security warning in your browser');
  console.log('   3. Pi SDK will work properly with HTTPS');
  console.log('\n🔒 Your app will be available at: https://localhost:8080');
  
} catch (error) {
  console.error('\n❌ Error setting up HTTPS certificates:', error.message);
  console.log('\n💡 Alternative solutions:');
  console.log('   1. Use a tool like mkcert: https://github.com/FiloSottile/mkcert');
  console.log('   2. Use Ngrok to create HTTPS tunnel: npx ngrok http 8080');
  console.log('   3. Deploy to a staging environment with HTTPS');
  process.exit(1);
}