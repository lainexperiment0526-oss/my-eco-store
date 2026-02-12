// Test Supabase Connection and Profile Loading
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('📡 Testing database connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('profiles').select('count').single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!\n');
    
    // Test 2: List all profiles
    console.log('📋 Fetching all profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, business_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return false;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles:\n`);
    
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. Username: ${profile.username}`);
        console.log(`   Business Name: ${profile.business_name}`);
        console.log(`   Profile ID: ${profile.id}`);
        console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No profiles found in database.');
      console.log('This is normal for a new database or if profiles haven\'t been created yet.\n');
    }
    
    // Test 3: Check table structure
    console.log('🔍 Checking profiles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError.message);
      return false;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Table columns:', Object.keys(tableInfo[0]).join(', '));
      console.log('');
    }
    
    // Test 4: Check RLS policies
    console.log('🔒 Testing Row Level Security (RLS)...');
    const { data: testInsert, error: rlsError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('⚠️  RLS may be blocking access:', rlsError.message);
      console.log('Make sure RLS policies allow anonymous read access.\n');
    } else {
      console.log('✅ RLS policies allow read access\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  const success = await testConnection();
  
  console.log('\n' + '='.repeat(60));
  
  if (success) {
    console.log('✅ All tests passed! Supabase is properly configured.');
    console.log('\nYour dashboard should now be able to:');
    console.log('  • Connect to the database');
    console.log('  • Load existing profiles');
    console.log('  • Create new profiles');
    console.log('  • Display user data');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
    console.log('\nTroubleshooting:');
    console.log('  1. Verify your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('  2. Check that the profiles table exists in Supabase');
    console.log('  3. Ensure RLS policies allow anonymous access');
    console.log('  4. Try running the database migrations');
  }
  
  console.log('='.repeat(60) + '\n');
}

main();
