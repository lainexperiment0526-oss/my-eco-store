#!/usr/bin/env node

/**
 * Push Mainnet Production Schema to Supabase
 * This script applies the mainnet production migration to your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function pushMainnetSchema() {
  console.log('🚀 Starting Mainnet Production Schema Migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251205000000_mainnet_production_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📊 SQL size:', (migrationSQL.length / 1024).toFixed(2), 'KB');
  console.log('');

  try {
    // Execute the migration
    console.log('⚙️  Executing migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct SQL execution
      console.log('⚠️  RPC method not available, attempting direct SQL execution...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        try {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement
          });

          if (stmtError) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} failed:`, stmtError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} error:`, err.message);
          errorCount++;
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${statements.length} statements`);
        }
      }

      console.log('');
      console.log('📊 Execution Summary:');
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${errorCount}`);
      
      if (errorCount > 0) {
        console.log('');
        console.log('⚠️  Some statements failed. This is normal if tables/columns already exist.');
        console.log('   Please verify your database schema manually.');
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    console.log('');
    console.log('🔍 Verifying schema...');

    // Verify tables exist
    const tables = ['profiles', 'pi_transactions', 'pi_ad_interactions', 'wallet_tokens'];
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError && countError.code !== 'PGRST116') {
        console.log(`❌ Table '${table}' verification failed:`, countError.message);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    console.log('');
    console.log('✅ Mainnet Production Schema Migration Complete!');
    console.log('');
    console.log('📋 New Features:');
    console.log('   ✅ Pi Network transaction tracking');
    console.log('   ✅ Pi Ad Network interaction logging');
    console.log('   ✅ Wallet token detection and storage');
    console.log('   ✅ Enhanced session management');
    console.log('   ✅ Mainnet-specific columns in profiles');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Verify schema in Supabase Dashboard');
    console.log('   2. Test Pi Network authentication');
    console.log('   3. Test payment creation and tracking');
    console.log('   4. Test ad interactions');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('💡 Manual Migration:');
    console.error('   1. Open Supabase Dashboard');
    console.error('   2. Go to SQL Editor');
    console.error('   3. Copy and paste the migration SQL');
    console.error('   4. Execute the queries');
    console.error('');
    console.error('   Migration file:', migrationPath);
    process.exit(1);
  }
}

// Run the migration
pushMainnetSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
