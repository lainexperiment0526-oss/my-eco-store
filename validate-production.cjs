/**
 * Production Environment Validator
 * Ensures all mainnet configurations are properly set
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Production Environment...');
console.log('=====================================');

const checks = {
  piToml: false,
  vercelConfig: false,
  envProduction: false,
  mainnetRefs: false,
  securityHeaders: false
};

// Check 1: Pi TOML file
try {
  const piTomlPath = path.join(__dirname, 'public', 'pi.toml');
  const piTomlContent = fs.readFileSync(piTomlPath, 'utf8');
  
  if (piTomlContent.includes('Pi Mainnet') && 
      piTomlContent.includes('GBVTV77XFMDYSSVIG6ZGSRAGZ3S7KA4275YYLOLIROOD3Y3F3TH5U3EI')) {
    console.log('✅ Pi TOML configured for mainnet');
    checks.piToml = true;
  } else {
    console.log('❌ Pi TOML not properly configured for mainnet');
  }
} catch (error) {
  console.log('❌ Pi TOML file not found');
}

// Check 2: Vercel configuration
try {
  const vercelPath = path.join(__dirname, 'vercel.json');
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  const config = JSON.parse(vercelContent);
  
  const hasWellKnownRoute = config.rewrites?.some(r => r.source.includes('.well-known'));
  const hasMainnetEnv = config.env?.VITE_PI_NETWORK === 'mainnet';
  
  if (hasWellKnownRoute && hasMainnetEnv) {
    console.log('✅ Vercel configured for mainnet deployment');
    checks.vercelConfig = true;
  } else {
    console.log('❌ Vercel configuration incomplete');
  }
} catch (error) {
  console.log('❌ Vercel configuration file issue');
}

// Check 3: Production environment file
try {
  const envPath = path.join(__dirname, '.env.production');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_PI_NETWORK=mainnet') && 
        envContent.includes('api.mainnet.minepi.com')) {
      console.log('✅ Production environment configured');
      checks.envProduction = true;
    }
  }
} catch (error) {
  console.log('❌ Production environment file issue');
}

// Check 4: Scan for mainnet references in code
const scanForMainnetRefs = () => {
  try {
    const piContextPath = path.join(__dirname, 'src', 'contexts', 'PiContext.tsx');
    const piContextContent = fs.readFileSync(piContextPath, 'utf8');
    
    const hasMainnetApi = piContextContent.includes('api.mainnet.minepi.com');
    const hasSandboxFalse = piContextContent.includes('sandbox: false');
    
    if (hasMainnetApi && hasSandboxFalse) {
      console.log('✅ Pi Context configured for mainnet');
      checks.mainnetRefs = true;
    } else {
      console.log('❌ Pi Context still has testnet/sandbox references');
    }
  } catch (error) {
    console.log('❌ Could not verify Pi Context configuration');
  }
};

// Check 5: Security headers
try {
  const vercelPath = path.join(__dirname, 'vercel.json');
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  const config = JSON.parse(vercelContent);
  
  const hasSecurityHeaders = config.headers?.some(h => 
    h.headers?.some(header => header.key.includes('X-Frame-Options'))
  );
  
  if (hasSecurityHeaders) {
    console.log('✅ Security headers configured');
    checks.securityHeaders = true;
  } else {
    console.log('⚠️  Security headers may need review');
  }
} catch (error) {
  console.log('❌ Could not verify security headers');
}

// Run all checks
scanForMainnetRefs();

// Summary
console.log('\\n📊 Validation Summary:');
console.log('=====================');
Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
});

const allPassed = Object.values(checks).every(Boolean);
console.log(`\\n${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'READY FOR DEPLOYMENT' : 'NEEDS ATTENTION'}`);

if (allPassed) {
  console.log('\\n🚀 Ready to deploy to production!');
  console.log('Run: vercel --prod');
} else {
  console.log('\\n🔧 Please fix the failed checks before deploying');
}

process.exit(allPassed ? 0 : 1);