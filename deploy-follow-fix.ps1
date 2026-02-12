#!/usr/bin/env pwsh
# Quick script to deploy the follow fix to Supabase

Write-Host "🔧 Deploying Follow Functionality Fix..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're linked to a project
supabase projects list 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Available SQL fixes:" -ForegroundColor Green
Write-Host "   1. fix-follow-now.sql (Quick follow fix)" -ForegroundColor White
Write-Host "   2. fix-all-issues.sql (Complete fix: follow, search, bio, messages)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Which fix do you want to deploy? (1 or 2)"

if ($choice -eq "1") {
    $sqlFile = "fix-follow-now.sql"
} elseif ($choice -eq "2") {
    $sqlFile = "fix-all-issues.sql"
} else {
    Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

if (!(Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying $sqlFile to Supabase..." -ForegroundColor Cyan

# Execute the SQL file
$result = supabase db execute -f $sqlFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully deployed $sqlFile!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 What was fixed:" -ForegroundColor Cyan
    if ($choice -eq "1") {
        Write-Host "   ✅ Followers table RLS policies updated" -ForegroundColor White
        Write-Host "   ✅ Column names fixed (if needed)" -ForegroundColor White
        Write-Host "   ✅ Pi Network authentication support added" -ForegroundColor White
        Write-Host "   ✅ Public profiles readable" -ForegroundColor White
    } else {
        Write-Host "   ✅ Follow functionality fixed" -ForegroundColor White
        Write-Host "   ✅ Search users fixed" -ForegroundColor White
        Write-Host "   ✅ Public bio loading fixed" -ForegroundColor White
        Write-Host "   ✅ Message sending with images fixed" -ForegroundColor White
        Write-Host "   ✅ Follower counts updated" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "🎉 You can now test the follow functionality!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Error:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Run the SQL manually" -ForegroundColor Yellow
    Write-Host "   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new" -ForegroundColor White
    Write-Host "   2. Copy contents of $sqlFile" -ForegroundColor White
    Write-Host "   3. Paste and click 'Run'" -ForegroundColor White
    exit 1
}
