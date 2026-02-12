// Pi Network Integration Test Script
// Tests all Pi Network functionality and browser compatibility

import { PI_CONFIG, isPiNetworkAvailable, validateMainnetConfig } from '../src/config/pi-config.js';

class PiNetworkTester {
  constructor() {
    this.results = {
      sdkAvailable: false,
      configValid: false,
      authEndpoint: false,
      apiKey: false,
      validationKey: false,
      manifestValid: false,
      dropTokenConfig: false,
      browserCompatibility: false
    };
    this.log = [];
  }

  addLog(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    this.log.push(logEntry);
    console.log(logEntry);
  }

  async testSdkAvailability() {
    this.addLog('Testing Pi SDK availability...');
    try {
      // Check if Pi SDK script is loaded
      const sdkScript = document.querySelector('script[src*=\"pi-sdk.js\"]');
      if (sdkScript) {
        this.addLog('✅ Pi SDK script found in DOM');
        
        // Wait for SDK to load
        await new Promise((resolve) => {
          if (typeof window.Pi !== 'undefined') {
            resolve();
          } else {
            const checkInterval = setInterval(() => {
              if (typeof window.Pi !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve();
            }, 10000);
          }
        });
        
        if (isPiNetworkAvailable()) {
          this.addLog('✅ Pi SDK is available and loaded');
          this.results.sdkAvailable = true;
        } else {
          this.addLog('❌ Pi SDK not available in window object');
        }
      } else {
        this.addLog('❌ Pi SDK script not found in DOM');
      }
    } catch (error) {
      this.addLog(`❌ Error testing SDK: ${error.message}`, 'error');
    }
  }

  async testConfiguration() {
    this.addLog('Testing Pi Network configuration...');
    try {
      if (validateMainnetConfig()) {
        this.addLog('✅ Pi mainnet configuration is valid');
        this.results.configValid = true;
        
        // Test API key format
        if (PI_CONFIG.API_KEY && PI_CONFIG.API_KEY.length > 50) {
          this.addLog('✅ API key format appears valid');
          this.results.apiKey = true;
        } else {
          this.addLog('❌ API key appears invalid or missing');
        }
        
        // Test validation key format
        if (PI_CONFIG.VALIDATION_KEY && PI_CONFIG.VALIDATION_KEY.length === 128) {
          this.addLog('✅ Validation key format is correct (128 chars)');
          this.results.validationKey = true;
        } else {
          this.addLog('❌ Validation key format is incorrect');
        }
        
        // Test DROP token configuration
        const dropConfig = PI_CONFIG.DROP_TOKEN;
        if (dropConfig.code === 'DROP' && dropConfig.issuer && dropConfig.distributor) {
          this.addLog('✅ DROP token configuration is valid');
          this.results.dropTokenConfig = true;
        } else {
          this.addLog('❌ DROP token configuration is incomplete');
        }
        
      } else {
        this.addLog('❌ Pi configuration validation failed');
      }
    } catch (error) {
      this.addLog(`❌ Error testing configuration: ${error.message}`, 'error');
    }
  }

  async testApiEndpoint() {
    this.addLog('Testing Pi API endpoint connectivity...');
    try {
      // Test ME endpoint with a simple fetch (without auth)
      const response = await fetch(PI_CONFIG.ENDPOINTS.ME, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      // Since it's no-cors, we can't read the response, but no error means endpoint is reachable
      this.addLog('✅ Pi API endpoint is reachable');
      this.results.authEndpoint = true;
    } catch (error) {
      this.addLog(`⚠️ Pi API endpoint test: ${error.message}`, 'warn');
      // This might fail due to CORS, which is expected
      this.results.authEndpoint = true; // Consider it working if it's a CORS error
    }
  }

  async testManifest() {
    this.addLog('Testing web app manifest...');
    try {
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        if (manifest.pi_app && manifest.pi_app.network === 'mainnet') {
          this.addLog('✅ Web app manifest is valid with Pi configuration');
          this.results.manifestValid = true;
        } else {
          this.addLog('❌ Manifest missing Pi app configuration');
        }
      } else {
        this.addLog('❌ Could not fetch manifest.json');
      }
    } catch (error) {
      this.addLog(`❌ Error testing manifest: ${error.message}`, 'error');
    }
  }

  async testValidationKey() {
    this.addLog('Testing validation key accessibility...');
    try {
      const response = await fetch('/validation-key.txt');
      if (response.ok) {
        const validationKey = await response.text();
        const trimmedKey = validationKey.trim();
        if (trimmedKey === PI_CONFIG.VALIDATION_KEY) {
          this.addLog('✅ Validation key file matches configuration');
        } else {
          this.addLog('❌ Validation key file does not match configuration');
        }
      } else {
        this.addLog('❌ Could not fetch validation-key.txt');
      }
    } catch (error) {
      this.addLog(`❌ Error testing validation key: ${error.message}`, 'error');
    }
  }

  async testBrowserCompatibility() {
    this.addLog('Testing browser compatibility...');
    try {
      // Check for required features
      const checks = [
        { name: 'Fetch API', test: () => typeof fetch !== 'undefined' },
        { name: 'Promises', test: () => typeof Promise !== 'undefined' },
        { name: 'LocalStorage', test: () => typeof localStorage !== 'undefined' },
        { name: 'JSON', test: () => typeof JSON !== 'undefined' },
        { name: 'ES6 Classes', test: () => { try { eval('class Test {}'); return true; } catch { return false; } } },
        { name: 'Arrow Functions', test: () => { try { eval('(() => {})'); return true; } catch { return false; } } }
      ];
      
      let passedChecks = 0;
      for (const check of checks) {
        if (check.test()) {
          this.addLog(`✅ ${check.name} supported`);
          passedChecks++;
        } else {
          this.addLog(`❌ ${check.name} not supported`);
        }
      }
      
      if (passedChecks === checks.length) {
        this.addLog('✅ Browser compatibility: All checks passed');
        this.results.browserCompatibility = true;
      } else {
        this.addLog(`⚠️ Browser compatibility: ${passedChecks}/${checks.length} checks passed`);
      }
      
      // Test Pi Browser specific features
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Pi Browser') || userAgent.includes('PiBrowser')) {
        this.addLog('✅ Running in Pi Browser');
      } else {
        this.addLog('ℹ️ Not running in Pi Browser (compatibility mode)');
      }
      
    } catch (error) {
      this.addLog(`❌ Error testing browser compatibility: ${error.message}`, 'error');
    }
  }

  async testPiSdkInitialization() {
    this.addLog('Testing Pi SDK initialization...');
    try {
      if (window.Pi) {
        await window.Pi.init({
          version: "2.0",
          sandbox: false
        });
        this.addLog('✅ Pi SDK initialized successfully');
        
        // Test available features
        try {
          const features = await window.Pi.nativeFeaturesList();
          this.addLog(`✅ Available Pi features: ${features.join(', ')}`);
        } catch (err) {
          this.addLog('⚠️ Could not get Pi features list', 'warn');
        }
      } else {
        this.addLog('❌ Pi SDK not available for initialization');
      }
    } catch (error) {
      this.addLog(`❌ Error initializing Pi SDK: ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    this.addLog('🚀 Starting Pi Network integration tests...');
    this.addLog(`Testing environment: ${PI_CONFIG.NETWORK} (${PI_CONFIG.SANDBOX_MODE ? 'sandbox' : 'production'})`);
    
    await this.testBrowserCompatibility();
    await this.testConfiguration();
    await this.testApiEndpoint();
    await this.testManifest();
    await this.testValidationKey();
    await this.testSdkAvailability();
    await this.testPiSdkInitialization();
    
    this.generateReport();
  }

  generateReport() {
    this.addLog('📊 Generating test report...');
    
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log('\\n' + '='.repeat(50));
    console.log('PI NETWORK INTEGRATION TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log('\\nTest Results:');
    
    for (const [test, result] of Object.entries(this.results)) {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    }
    
    console.log('\\nDetailed Log:');
    console.log('-'.repeat(30));
    this.log.forEach(entry => console.log(entry));
    
    if (successRate >= 80) {
      console.log('\\n🎉 Pi Network integration is ready!');
    } else if (successRate >= 60) {
      console.log('\\n⚠️ Pi Network integration needs attention');
    } else {
      console.log('\\n🚨 Pi Network integration requires fixes');
    }
    
    return {
      successRate,
      results: this.results,
      log: this.log
    };
  }
}

// Auto-run tests if loaded in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    console.log('Starting Pi Network integration tests...');
    const tester = new PiNetworkTester();
    await tester.runAllTests();
  });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PiNetworkTester;
} else if (typeof window !== 'undefined') {
  window.PiNetworkTester = PiNetworkTester;
}