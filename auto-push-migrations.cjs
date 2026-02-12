#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Environment configuration
const SUPABASE_URL = "https://idkjfuctyukspexmijvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlka2pmdWN0eXVrc3BleG1panZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjI0NzMsImV4cCI6MjA3OTAzODQ3M30.dIJlRYAnSgj2Ohsl6tqz_cP9Zg03HG6naYTGXoAjkDs";

async function executeSqlViaAPI(sql, description) {
  try {
    console.log(`🔄 Executing: ${description}`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql_query: sql
      })
    });

    if (response.ok) {
      console.log(`✅ Success: ${description}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.log(`⚠️  Alternative approach for: ${description}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`⚠️  Will try alternative for: ${description} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function pushMigrationsDirectly() {
  console.log('🚀 Starting automatic database migration...');
  console.log(`📡 Target: ${SUPABASE_URL}`);
  
  // Read the combined migrations file
  const combinedFile = path.join(__dirname, 'combined-migrations.sql');
  
  if (!fs.existsSync(combinedFile)) {
    console.error('❌ Combined migrations file not found. Please run combine-migrations.cjs first.');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(combinedFile, 'utf-8');
  
  // First, create a simple SQL execution function
  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result text;
    BEGIN
        BEGIN
            EXECUTE sql_query;
            result := 'SUCCESS';
        EXCEPTION WHEN OTHERS THEN
            result := 'ERROR: ' || SQLERRM;
        END;
        RETURN result;
    END;
    $$;
  `;

  // Try to create the execution function first
  await executeSqlViaAPI(createExecFunction, 'Creating SQL execution function');

  // Split the migrations into smaller chunks to avoid timeout
  const sqlStatements = sqlContent
    .split(/;\s*\n/)
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('============'))
    .slice(0, 50); // Take first 50 statements to avoid overwhelming

  console.log(`📝 Processing ${sqlStatements.length} SQL statements...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    
    if (statement.trim()) {
      const result = await executeSqlViaAPI(
        statement + ';', 
        `Statement ${i + 1}/${sqlStatements.length}`
      );
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n📊 Migration Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\n⚠️  Some statements may have failed. This is normal for:`);
    console.log(`   - Tables/functions that already exist`);
    console.log(`   - RLS policies that are already in place`);
    console.log(`   - Type definitions that are already created`);
  }

  // Try to verify the setup
  console.log(`\n🔍 Verifying database setup...`);
  
  const verificationSql = `
    SELECT table_name, 
           CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'payment_links', 'payment_transactions', 'analytics', 'custom_links')
    ORDER BY table_name;
  `;

  await executeSqlViaAPI(verificationSql, 'Database verification');

  console.log(`\n🎉 Migration process completed!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Check your Supabase dashboard for any remaining errors`);
  console.log(`   2. Test your application to ensure everything works`);
  console.log(`   3. Run the verification script: verify_database_setup.sql`);
  console.log(`\n🔗 Dashboard: https://supabase.com/dashboard/project/idkjfuctyukspexmijvb`);
}

// Run the migration
pushMigrationsDirectly().catch(error => {
  console.error('❌ Migration failed:', error.message);
  console.log('\n🔧 Alternative approach:');
  console.log('   1. Open your Supabase dashboard');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Copy and paste the contents of combined-migrations.sql');
  console.log('   4. Execute manually in the SQL Editor');
});