# =====================================================
# Apply Pi Auth Profile Update Migration
# =====================================================

Write-Host "🔐 Applying Pi Authentication Profile Update..." -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
$migrationFile = "supabase\migrations\20251211000000_pi_auth_profile_update.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Migration file found" -ForegroundColor Green
Write-Host ""

# Supabase project details
$projectRef = "idkjfuctyukspexmijvb"
$supabaseUrl = "https://$projectRef.supabase.co"

Write-Host "🎯 Target Project: $projectRef" -ForegroundColor Yellow
Write-Host "🌐 Supabase URL: $supabaseUrl" -ForegroundColor Yellow
Write-Host ""

Write-Host "📖 This migration will:" -ForegroundColor Cyan
Write-Host "  1. Add/verify Pi authentication columns (pi_user_id, pi_username)" -ForegroundColor White
Write-Host "  2. Create optimized indexes for Pi user lookups" -ForegroundColor White
Write-Host "  3. Update RLS policies to support Pi users" -ForegroundColor White
Write-Host "  4. Create helper functions for Pi user management" -ForegroundColor White
Write-Host ""

Write-Host "🔗 To apply this migration:" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1 - Via Supabase CLI (Recommended):" -ForegroundColor Yellow
Write-Host "  supabase db push" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Via Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://app.supabase.com/project/$projectRef/editor" -ForegroundColor White
Write-Host "  2. Open SQL Editor" -ForegroundColor White
Write-Host "  3. Copy contents of: $migrationFile" -ForegroundColor White
Write-Host "  4. Run the SQL" -ForegroundColor White
Write-Host ""

# Ask user if they want to open the Supabase dashboard
$response = Read-Host "Would you like to open the Supabase Dashboard? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    $dashboardUrl = "https://app.supabase.com/project/$projectRef/editor"
    Start-Process $dashboardUrl
    Write-Host "✅ Opening Supabase Dashboard..." -ForegroundColor Green
    Write-Host ""
}

Write-Host "📄 Migration file location:" -ForegroundColor Cyan
Write-Host "  $((Get-Item $migrationFile).FullName)" -ForegroundColor White
Write-Host ""

Write-Host "✨ After applying the migration, your app will:" -ForegroundColor Green
Write-Host "  ✅ Support Pi authentication (no Gmail required)" -ForegroundColor White
Write-Host "  ✅ Auto-create profiles for Pi users" -ForegroundColor White
Write-Host "  ✅ Allow Pi users to follow other profiles" -ForegroundColor White
Write-Host "  ✅ Work seamlessly in Pi Browser" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Ready to deploy!" -ForegroundColor Cyan
