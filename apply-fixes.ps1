# ========================================
# Apply Database Fixes for Follow, Search, and Public Bio
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Applying Database Fixes..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read the SQL file
$sqlContent = Get-Content "fix-all-issues.sql" -Raw

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env
$envContent = Get-Content ".env"
$supabaseUrl = ""
$supabaseKey = ""

foreach ($line in $envContent) {
    if ($line -match "^VITE_SUPABASE_URL=(.+)$") {
        $supabaseUrl = $matches[1].Trim('"')
    }
    if ($line -match "^VITE_SUPABASE_ANON_KEY=(.+)$") {
        $supabaseKey = $matches[1].Trim('"')
    }
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Error: Could not find Supabase credentials in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "📡 Target: $supabaseUrl" -ForegroundColor Green
Write-Host "📄 Applying fixes from: fix-all-issues.sql" -ForegroundColor Green
Write-Host ""
Write-Host "This will fix:" -ForegroundColor Yellow
Write-Host "  ✓ Follow/Unfollow functionality" -ForegroundColor White
Write-Host "  ✓ Search user functionality" -ForegroundColor White
Write-Host "  ✓ Public bio visibility" -ForegroundColor White
Write-Host "  ✓ Message sending & inbox" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to continue? (y/n)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Aborted by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying SQL fixes..." -ForegroundColor Cyan

# You can manually copy the SQL content and paste it into Supabase SQL Editor
# Or use the REST API (requires service role key)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MANUAL STEPS TO APPLY:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to your Supabase Dashboard:" -ForegroundColor White
Write-Host "   $supabaseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Navigate to: SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "3. Click 'New Query'" -ForegroundColor White
Write-Host ""
Write-Host "4. Copy and paste the contents of:" -ForegroundColor White
Write-Host "   fix-all-issues.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Click 'Run' to execute the SQL" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or, press Ctrl+C to copy the SQL file path and open it manually" -ForegroundColor Yellow
Write-Host ""

# Open the SQL file in default editor
Write-Host "Opening fix-all-issues.sql in default editor..." -ForegroundColor Green
Start-Process "fix-all-issues.sql"

Write-Host ""
Write-Host "✅ Done! Please apply the SQL in Supabase Dashboard." -ForegroundColor Green
Write-Host ""
