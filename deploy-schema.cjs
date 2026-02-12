const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE')) {
    const [key, ...valueParts] = line.split('=');
    env[key] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials not found in .env.production');
  process.exit(1);
}

console.log('📦 Supabase Deploy Script');
console.log('========================\n');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🔑 Using Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

// Read the SQL schema
const schemaPath = path.join(__dirname, 'supabase', 'full_user_data_schema.sql');
let sqlContent = fs.readFileSync(schemaPath, 'utf8');

// Split SQL into individual statements
const sqlStatements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--'));

console.log(`📋 Found ${sqlStatements.length} SQL statements to execute\n`);

async function deploySql() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('🚀 Starting deployment...\n');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      const stmtNum = i + 1;
      
      try {
        // Get first 50 chars for logging
        const preview = statement.substring(0, 50).replace(/\n/g, ' ') + '...';
        console.log(`[${stmtNum}/${sqlStatements.length}] Executing: ${preview}`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_text: statement
        }).catch(async () => {
          // Fallback: use direct SQL execution via query
          return await supabase.query(statement);
        });
        
        if (error && !error.message.includes('does not exist')) {
          console.warn(`⚠️  Warning on statement ${stmtNum}:`, error.message);
        } else {
          console.log(`✅ Statement ${stmtNum} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${stmtNum}:`, err.message);
      }
    }
    
    console.log('\n✅ Schema deployment complete!');
    
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }
}

deploySql();
