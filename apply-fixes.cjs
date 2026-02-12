// ========================================
// Apply Database Fixes Script
// ========================================
// Run with: node apply-fixes.cjs
// ========================================

const fs = require('fs');
const path = require('path');

// Hardcoded Supabase credentials (update with your project details)
const SUPABASE_URL = "https://idkjfuctyukspexmijvb.supabase.co";

// YOU NEED TO ADD YOUR SERVICE ROLE KEY HERE
// Get it from: Supabase Dashboard > Project Settings > API > service_role key
const SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";

async function applySQLFix() {
  try {
    console.log('\n========================================');
    console.log('🔧 Applying Database Fixes...');
    console.log('========================================\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-all-issues.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL File: fix-all-issues.sql');
    console.log('📡 Target: ' + SUPABASE_URL);
    console.log('\nThis will fix:');
    console.log('  ✓ Follow/Unfollow functionality');
    console.log('  ✓ Search user functionality');
    console.log('  ✓ Public bio visibility');
    console.log('  ✓ Message sending & inbox\n');
    
    if (SUPABASE_SERVICE_KEY === "YOUR_SERVICE_ROLE_KEY_HERE") {
      console.error('❌ Error: Please update SUPABASE_SERVICE_KEY in apply-fixes.cjs');
      console.log('\n📝 To get your service role key:');
      console.log('   1. Go to: ' + SUPABASE_URL);
      console.log('   2. Navigate to: Project Settings > API');
      console.log('   3. Copy the "service_role" key (NOT the anon key)');
      console.log('   4. Paste it in apply-fixes.cjs line 11\n');
      
      console.log('========================================');
      console.log('🔧 ALTERNATIVE: Manual Application');
      console.log('========================================\n');
      console.log('1. Go to Supabase Dashboard: ' + SUPABASE_URL);
      console.log('2. Click on "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Copy the contents of: fix-all-issues.sql');
      console.log('5. Paste into the SQL Editor');
      console.log('6. Click "Run" to execute\n');
      
      return;
    }
    
    console.log('🚀 Executing SQL...\n');
    
    // Split SQL into individual statements and execute them
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error executing SQL:', error);
      
      console.log('\n========================================');
      console.log('🔧 Please Apply Manually');
      console.log('========================================\n');
      console.log('1. Go to: ' + SUPABASE_URL);
      console.log('2. Navigate to: SQL Editor');
      console.log('3. Copy contents from: fix-all-issues.sql');
      console.log('4. Paste and click "Run"\n');
      
      return;
    }
    
    console.log('✅ SQL executed successfully!\n');
    console.log('========================================');
    console.log('✨ All fixes have been applied!');
    console.log('========================================\n');
    console.log('What was fixed:');
    console.log('  ✅ Followers table column names corrected');
    console.log('  ✅ RLS policies updated for Pi Network users');
    console.log('  ✅ Search functionality columns added');
    console.log('  ✅ Public bio visibility fixed');
    console.log('  ✅ Messages and inbox policies updated');
    console.log('  ✅ Automatic follower count updates enabled\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n========================================');
    console.log('🔧 Manual Application Required');
    console.log('========================================\n');
    console.log('Please apply the SQL manually:');
    console.log('1. Go to: ' + SUPABASE_URL);
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Open and copy: fix-all-issues.sql');
    console.log('4. Paste and click "Run"\n');
  }
}

applySQLFix();
