/**
 * DASHBOARD DEBUGGING SCRIPT
 * 
 * Copy and paste this code into your browser's DevTools Console (F12)
 * to test and debug your dashboard profile loading
 */

console.clear();
console.log('%c🔍 DASHBOARD DEBUGGING TOOL', 'font-size: 16px; font-weight: bold; color: #0066cc;');
console.log('%c' + '='.repeat(60), 'color: #666;');

// TEST 1: Check Authentication Status
console.log('\n📋 TEST 1: Authentication Status');
console.log('━'.repeat(60));
console.log('• Pi Authentication:', window.__PI_AUTH__ ? 'Active' : 'Not detected');
console.log('• User ID:', window.__USER_ID__ || 'Not set');
console.log('• Session:', window.__SESSION__ ? 'Active' : 'None');

// TEST 2: Check Local Storage
console.log('\n📋 TEST 2: Local Storage (Profile Cache)');
console.log('━'.repeat(60));
const allStorageKeys = Object.keys(localStorage);
const profileKeys = allStorageKeys.filter(k => k.includes('profile'));
console.log('Found profile keys:', profileKeys.length);
profileKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`  ✓ ${key}:`, {
      username: data.username,
      businessName: data.businessName,
      hasLogo: !!data.logo,
      productsCount: data.products?.length || 0,
      linksCount: data.customLinks?.length || 0,
      lastSynced: data.lastSynced
    });
  } catch (e) {
    console.warn(`  ✗ ${key}: Invalid JSON`);
  }
});

// TEST 3: Check for Console Errors
console.log('\n📋 TEST 3: Recent Console Messages');
console.log('━'.repeat(60));
console.log('✅ If you see "Profile loaded successfully:" messages above');
console.log('   this means the profile is loading correctly.');
console.log('❌ If you see red errors, profile loading failed.');

// TEST 4: Check Supabase Client
console.log('\n📋 TEST 4: Supabase Configuration');
console.log('━'.repeat(60));

// Helper to test Supabase
async function testSupabaseConnection() {
  try {
    // Dynamically import Supabase if available
    console.log('Testing Supabase connection...');
    
    // This will work if Supabase is imported in the app
    if (window.supabaseClient) {
      console.log('✅ Supabase client found');
      
      // Try a simple query
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, username, business_name')
        .limit(1);
      
      if (error) {
        console.error('❌ Query error:', error.message);
      } else {
        console.log('✅ Supabase connection works!');
        console.log('  Sample profile:', data?.[0]);
      }
    } else {
      console.log('⚠️  Supabase client not directly accessible from window');
      console.log('   This is normal - it may be imported differently');
    }
  } catch (e) {
    console.error('Error testing Supabase:', e.message);
  }
}

// TEST 5: Check React State (if available)
console.log('\n📋 TEST 5: React Component State');
console.log('━'.repeat(60));
console.log('To inspect React state in your Dashboard component:');
console.log('1. Open React DevTools extension');
console.log('2. Select the Dashboard component');
console.log('3. Look at the "profile" state value');
console.log('4. Check if it has all expected fields');

// TEST 6: Manual Profile Query
console.log('\n📋 TEST 6: Manual Profile Query');
console.log('━'.repeat(60));
console.log('Attempting to load a sample profile from database...');

// Create an async function to test
async function loadSampleProfile() {
  // This is just logging - we can't actually run Supabase queries here
  // without the proper setup, but we can show what should happen
  console.log(`
Expected console output when profile loads:
  ✅ Profile loaded successfully:
  - Profile ID: [UUID]
  - Username: [your-username]
  - Business Name: [business-name]
  - Description: [description]
  - Logo: [url-or-empty]
  - Products count: [number]
  - Custom Links count: [number]
  - Social Links: [array-with-platforms]
  - Theme: [color-settings]

If you don't see this, check:
  1. Browser console for any red errors
  2. Network tab to see if Supabase API calls are being made
  3. Check if authentication is working (pi_user or supabaseUser)
  `);
}

// TEST 7: Data Verification Checklist
console.log('\n📋 TEST 7: Data Verification Checklist');
console.log('━'.repeat(60));
const checks = [
  ['Profile ID exists', 'profile.id !== ""'],
  ['Username set', 'profile.username !== ""'],
  ['Business Name set', 'profile.businessName !== ""'],
  ['Social links loaded', 'profile.socialLinks.length > 0'],
  ['Theme configured', 'profile.theme.primaryColor !== undefined'],
  ['Custom links present', 'profile.customLinks.length >= 0'],
  ['Products loaded', 'profile.products.length >= 0'],
  ['Logo optional', 'profile.logo can be empty string'],
];

console.log('Your profile should have:');
checks.forEach(([name, condition]) => {
  console.log(`  • ${name} (${condition})`);
});

// TEST 8: Quick Health Check
console.log('\n📋 TEST 8: Quick Health Check');
console.log('━'.repeat(60));
console.log('Copy and paste this into the console to run a quick check:');
console.log(`
// Check if app state looks healthy
const isHealthy = {
  hasLocalStorage: localStorage.length > 0,
  hasSessionStorage: sessionStorage.length > 0,
  documentReady: document.readyState === 'complete',
  consoleErrors: 'Check console for red errors',
  recommendation: localStorage.length > 0 ? '✅ Looks good!' : '⚠️ May need to reload'
};
console.table(isHealthy);
`);

// TEST 9: Troubleshooting Commands
console.log('\n📋 TEST 9: Troubleshooting Commands');
console.log('━'.repeat(60));
console.log('If dashboard doesn\'t work, try these in order:');
console.log('\n1. Clear cache and reload:');
console.log('   localStorage.clear(); location.reload();');
console.log('\n2. Check for errors:');
console.log('   (Look for red text in console)');
console.log('\n3. Check local profile data:');
console.log('   Object.keys(localStorage).filter(k => k.includes("profile"))');
console.log('\n4. Verify authentication:');
console.log('   (Check if you see auth-related messages)');

// TEST 10: Run Supabase Connection Test
console.log('\n📋 TEST 10: Supabase Connection');
console.log('━'.repeat(60));
await testSupabaseConnection();

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('%c✅ DEBUGGING CHECKLIST COMPLETE', 'font-size: 14px; font-weight: bold; color: #00aa00;');
console.log('='.repeat(60));
console.log(`
Next steps:
1. Look at the messages above
2. Check for any ❌ red errors
3. If you see ✅ messages, your profile loaded successfully
4. If errors exist, screenshot them and share for help

Common issues and fixes:
  • "Profile loaded successfully" but still nothing shows?
    → Refresh the page
    → Clear localStorage and reload
    
  • See red errors in console?
    → Note the error message
    → Check your Supabase credentials in .env
    → Verify database tables exist
    
  • Nothing shows in local storage?
    → Profile never loaded from database
    → Check authentication is working
    → Check Supabase connection
`);
console.log('%c' + '='.repeat(60), 'color: #666;');
