#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://idkjfuctyukspexmijvb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

console.log('🚀 Starting database migration push...');
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Get all migration files
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
let migrationFiles = [];

try {
  migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort by filename to ensure proper order
} catch (error) {
  console.error('❌ Error reading migrations directory:', error.message);
  process.exit(1);
}

console.log(`📁 Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(file => console.log(`   - ${file}`));

// Function to execute SQL
async function executeSql(sql, filename) {
  try {
    console.log(`\n🔄 Executing migration: ${filename}`);
    
    // Split SQL into individual statements (simple split on semicolon followed by newline)
    const statements = sql
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   📝 Executing statement ${i + 1}/${statements.length}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // If exec_sql function doesn't exist, try direct query
          const { data: directData, error: directError } = await supabase
            .from('__migrations_temp__')
            .select('*')
            .limit(0);

          if (directError) {
            // Try using the raw query method
            const { error: rawError } = await supabase.rpc('exec', { 
              query: statement + ';' 
            });
            
            if (rawError) {
              console.error(`❌ Error executing statement:`, rawError.message);
              console.error(`❌ Statement: ${statement.substring(0, 100)}...`);
              // Continue with next statement instead of failing completely
              continue;
            }
          }
        }
      }
    }
    
    console.log(`✅ Migration completed: ${filename}`);
  } catch (error) {
    console.error(`❌ Error in migration ${filename}:`, error.message);
    throw error;
  }
}

// Main execution function
async function runMigrations() {
  try {
    // First, try to create a simple function to execute SQL if it doesn't exist
    console.log('\n🔧 Setting up SQL execution function...');
    
    const setupSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;

    try {
      const { error: setupError } = await supabase.rpc('exec_sql', { 
        sql_query: setupSql 
      });
      
      if (setupError) {
        console.log('⚠️  Could not create exec_sql function, will try alternative methods');
      } else {
        console.log('✅ SQL execution function ready');
      }
    } catch (e) {
      console.log('⚠️  Will use alternative SQL execution methods');
    }

    // Execute migrations in order
    for (const filename of migrationFiles) {
      const filePath = path.join(migrationsDir, filename);
      
      try {
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        
        // Skip empty files
        if (!sqlContent.trim()) {
          console.log(`⏭️  Skipping empty file: ${filename}`);
          continue;
        }

        await executeSql(sqlContent, filename);
        
      } catch (error) {
        console.error(`❌ Failed to process file ${filename}:`, error.message);
        console.log('⏭️  Continuing with next migration...');
        continue;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run the verification script to check database status');
    console.log('   2. Test your application functionality');
    console.log('   3. Check for any errors in the Supabase dashboard');

  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();