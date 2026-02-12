# Supabase Schema Deployment Script

# Load environment variables
$envFile = Get-Content ".env.production" -Raw
$env_lines = $envFile -split "`n"

$SUPABASE_URL = ""
$SUPABASE_ANON_KEY = ""

foreach ($line in $env_lines) {
    if ($line -match "VITE_SUPABASE_URL=(.+)") {
        $SUPABASE_URL = $matches[1].Trim()
    }
    if ($line -match "VITE_SUPABASE_ANON_KEY=(.+)") {
        $SUPABASE_ANON_KEY = $matches[1].Trim()
    }
}

Write-Host "Supabase Schema Deployment"
Write-Host "============================="
Write-Host ""
Write-Host "Supabase URL: $SUPABASE_URL"
Write-Host "Using Anon Key: $($SUPABASE_ANON_KEY.Substring(0, 20))..."
Write-Host ""

# Read the SQL schema file
$sqlFile = "supabase\full_user_data_schema.sql"
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "Read schema from: $sqlFile"
Write-Host ""

# Extract project ID from URL
$projectId = $SUPABASE_URL.Split('.')[0].Replace('https://', '')

Write-Host "Project ID: $projectId"
Write-Host ""
Write-Host "To deploy the schema to your Supabase:"
Write-Host "1. Go to https://supabase.com/dashboard/project/$projectId/sql"
Write-Host "2. Click New Query"
Write-Host "3. Paste and run the SQL below:"
Write-Host ""
Write-Host "============= SQL SCHEMA ============="
Write-Host ""
Write-Host $sqlContent
Write-Host ""
Write-Host "======================================="
