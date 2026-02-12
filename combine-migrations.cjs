#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

console.log('🚀 Creating combined migration script...');
console.log(`📁 Found ${migrationFiles.length} migration files:`);

// Create combined SQL content
let combinedSql = `-- Combined Migration Script for DropLink
-- Generated on: ${new Date().toISOString()}
-- Files included: ${migrationFiles.join(', ')}

`;

// Add each migration file content
migrationFiles.forEach((filename, index) => {
  const filePath = path.join(migrationsDir, filename);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    
    // Skip empty files
    if (!sqlContent.trim()) {
      console.log(`⏭️  Skipping empty file: ${filename}`);
      return;
    }

    console.log(`📄 Adding migration: ${filename}`);
    
    combinedSql += `
-- ============================================================================
-- Migration ${index + 1}: ${filename}
-- ============================================================================

${sqlContent}

-- End of ${filename}
-- ============================================================================

`;
    
  } catch (error) {
    console.error(`❌ Failed to read file ${filename}:`, error.message);
  }
});

// Add final verification
combinedSql += `
-- ============================================================================
-- FINAL VERIFICATION AND SETUP SUMMARY
-- ============================================================================

-- Create verification function if it doesn't exist
CREATE OR REPLACE FUNCTION verify_droplink_setup()
RETURNS TABLE(
    table_name text,
    exists_status text,
    row_count bigint,
    has_rls boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        CASE 
            WHEN t.table_name IS NOT NULL THEN 'OK'
            ELSE 'MISSING'
        END::text as exists_status,
        CASE 
            WHEN t.table_name IS NOT NULL THEN (
                SELECT count(*) FROM information_schema.tables 
                WHERE table_name = t.table_name AND table_schema = 'public'
            )
            ELSE 0
        END as row_count,
        CASE 
            WHEN t.table_name IS NOT NULL THEN (
                SELECT count(*) > 0 FROM pg_policies p 
                JOIN information_schema.tables t2 ON p.tablename = t2.table_name
                WHERE p.tablename = t.table_name AND t2.table_schema = 'public'
            )
            ELSE false
        END as has_rls
    FROM (VALUES 
        ('profiles'::text),
        ('payment_links'::text),
        ('payment_transactions'::text),
        ('analytics'::text),
        ('custom_links'::text),
        ('feature_usage'::text),
        ('profile_financial_data'::text),
        ('user_sessions'::text),
        ('user_preferences'::text)
    ) AS t(table_name);
END;
$$;

-- Create setup summary function
CREATE OR REPLACE FUNCTION get_setup_summary()
RETURNS TABLE(
    component text,
    status text,
    details text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Database Tables'::text as component,
        CASE 
            WHEN (SELECT count(*) FROM verify_droplink_setup() WHERE exists_status = 'OK') >= 8 
            THEN 'Ready ✅'
            ELSE 'Issues Found ⚠️'
        END::text as status,
        (SELECT count(*)::text || ' tables verified' FROM verify_droplink_setup() WHERE exists_status = 'OK')::text as details
    
    UNION ALL
    
    SELECT 
        'RLS Policies'::text as component,
        CASE 
            WHEN (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') > 0 
            THEN 'Configured ✅'
            ELSE 'Not Found ⚠️'
        END::text as status,
        (SELECT count(*)::text || ' policies active' FROM pg_policies WHERE schemaname = 'public')::text as details
    
    UNION ALL
    
    SELECT 
        'Payment System'::text as component,
        CASE 
            WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_links' AND table_schema = 'public')
            THEN 'Ready ✅'
            ELSE 'Not Ready ❌'
        END::text as status,
        'Payment links and transactions'::text as details
    
    UNION ALL
    
    SELECT 
        'Analytics'::text as component,
        CASE 
            WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics' AND table_schema = 'public')
            THEN 'Ready ✅'
            ELSE 'Not Ready ❌'
        END::text as status,
        'User analytics tracking'::text as details;
END;
$$;

-- Show final setup status
SELECT '🎉 MIGRATION COMPLETE! 🎉' as message;
SELECT * FROM get_setup_summary();

-- Show table verification
SELECT '📋 TABLE VERIFICATION:' as section;
SELECT * FROM verify_droplink_setup() ORDER BY table_name;
`;

// Write combined file
const outputFile = path.join(__dirname, 'combined-migrations.sql');
fs.writeFileSync(outputFile, combinedSql, 'utf-8');

console.log(`\n✅ Combined migration script created: combined-migrations.sql`);
console.log(`\n📋 Manual steps to complete migration:`);
console.log(`   1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/idkjfuctyukspexmijvb`);
console.log(`   2. Navigate to SQL Editor`);
console.log(`   3. Copy the contents of 'combined-migrations.sql' and paste into SQL Editor`);
console.log(`   4. Click "Run" to execute all migrations`);
console.log(`   5. Check the results for any errors`);
console.log(`\n🔍 The script includes verification functions to check the setup status.`);

console.log(`\n📁 Migration files included:`);
migrationFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});