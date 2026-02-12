// Pi Browser Troubleshooting Script
// Helps diagnose and fix Pi Browser white screen issues

const troubleshootPiBrowser = () => {
  console.log('🔧 Pi Browser Troubleshooting Tool');
  console.log('==================================');
  
  const issues = [];
  const fixes = [];
  
  // Check 1: Console errors
  const originalConsoleError = console.error;
  const capturedErrors = [];
  console.error = (...args) => {
    capturedErrors.push(args.join(' '));
    originalConsoleError.apply(console, args);
  };
  
  // Check 2: CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    issues.push(`CSP Violation: ${event.violatedDirective} - ${event.blockedURI}`);
    fixes.push('Update Content-Security-Policy in index.html to allow the blocked resource');
  });
  
  // Check 3: Failed resource loads
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      issues.push(`Failed to load: ${event.target.src || event.target.href}`);
      fixes.push('Check network connectivity and ensure resource URLs are correct');
    }
  });
  
  // Check 4: Pi SDK issues
  setTimeout(() => {
    if (typeof window.Pi === 'undefined') {
      issues.push('Pi SDK not loaded');
      fixes.push('Ensure Pi SDK script is properly loaded and not blocked by CSP');
    }
  }, 3000);
  
  // Check 5: Basic DOM issues
  if (!document.getElementById('root')) {
    issues.push('Root element not found');
    fixes.push('Check if React app root element exists in HTML');
  }
  
  // Run diagnostic after page load
  setTimeout(() => {
    console.log('\\n📋 Diagnostic Results:');
    console.log('======================');
    
    // Browser info
    console.log(`Browser: ${navigator.userAgent}`);
    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`Pi Browser: ${navigator.userAgent.includes('Pi Browser') ? 'Yes' : 'No'}`);
    
    // Check for white screen indicators
    const body = document.body;
    const rootElement = document.getElementById('root');
    
    if (rootElement && rootElement.children.length === 0) {
      issues.push('React app not rendering (empty root element)');
      fixes.push('Check React app initialization and component mounting');
    }
    
    if (body.scrollHeight <= window.innerHeight && body.children.length < 3) {
      issues.push('Minimal page content detected (possible white screen)');
      fixes.push('Check JavaScript console for React/component errors');
    }
    
    // Check critical resources
    const criticalSelectors = ['#root', 'script[src*=\"pi-sdk\"]', 'link[rel=\"manifest\"]'];
    criticalSelectors.forEach(selector => {
      if (!document.querySelector(selector)) {
        issues.push(`Missing critical element: ${selector}`);
        fixes.push(`Add ${selector} to your HTML`);
      }
    });
    
    // Report captured errors
    if (capturedErrors.length > 0) {
      console.log('\\n🚨 Console Errors:');
      capturedErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    // Report issues and fixes
    if (issues.length > 0) {
      console.log('\\n⚠️ Issues Found:');
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
      
      console.log('\\n💡 Suggested Fixes:');
      fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix}`);
      });
      
      console.log('\\n🔧 Quick Fixes to Try:');
      console.log('1. Clear browser cache and reload');
      console.log('2. Try incognito/private browsing mode');
      console.log('3. Check network connection');
      console.log('4. Ensure using Pi Browser for full compatibility');
      console.log('5. Check browser console for detailed error messages');
      
    } else {
      console.log('\\n✅ No obvious issues detected');
      console.log('If still experiencing white screen:');
      console.log('1. Check network connectivity');
      console.log('2. Try refreshing the page');
      console.log('3. Clear browser cache');
    }
    
    // Pi-specific checks
    console.log('\\n🥧 Pi Network Specific Checks:');
    console.log('================================');
    
    const piChecks = [
      {
        name: 'Pi SDK Loaded',
        test: () => typeof window.Pi !== 'undefined',
        fix: 'Ensure Pi SDK script is not blocked and loads properly'
      },
      {
        name: 'Validation Key Accessible',
        test: async () => {
          try {
            const response = await fetch('/validation-key.txt');
            return response.ok;
          } catch { return false; }
        },
        fix: 'Ensure validation-key.txt is in public folder and accessible'
      },
      {
        name: 'Manifest Valid',
        test: async () => {
          try {
            const response = await fetch('/manifest.json');
            if (!response.ok) return false;
            const manifest = await response.json();
            return manifest.pi_app && manifest.pi_app.network;
          } catch { return false; }
        },
        fix: 'Check manifest.json has valid pi_app configuration'
      }
    ];
    
    piChecks.forEach(async (check) => {
      const result = await check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (!result) {
        console.log(`   Fix: ${check.fix}`);
      }
    });
    
  }, 5000);
};

// Auto-run troubleshooting
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', troubleshootPiBrowser);
  } else {
    troubleshootPiBrowser();
  }
}

// Make available globally for manual use
if (typeof window !== 'undefined') {
  window.troubleshootPiBrowser = troubleshootPiBrowser;
}