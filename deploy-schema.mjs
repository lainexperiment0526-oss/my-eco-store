#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment from .env.production
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Supabase credentials not found in .env.production');
  process.exit(1);
}

console.log('Supabase Schema Deployment');
console.log('==========================\n');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Project ID:', SUPABASE_URL.split('.')[0].replace('https://', ''));
console.log('');

// Read SQL file
const sqlPath = path.join(__dirname, 'supabase', 'full_user_data_schema.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Split into statements
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);
console.log('Deploying schema...\n');

let completed = 0;
let failed = 0;

async function executeStatement(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/query_raw`);
    
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function deploy() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
    
    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);
      await executeStatement(stmt);
      console.log(`[${i + 1}/${statements.length}] SUCCESS\n`);
      completed++;
    } catch (err) {
      console.log(`[${i + 1}/${statements.length}] ERROR: ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n==========================');
  console.log(`Deployment Complete!`);
  console.log(`Completed: ${completed}/${statements.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}/${statements.length}`);
  }
  console.log('==========================');
}

deploy().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
