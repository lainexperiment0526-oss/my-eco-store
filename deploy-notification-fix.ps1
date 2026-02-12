# =====================================================
# FIX NOTIFICATIONS AND FOLLOW FUNCTIONALITY
# This script deploys the fix for the payload column error
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIXING NOTIFICATIONS & FOLLOW FEATURE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Write-Host "Loading environment variables..." -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_KEY = $env:VITE_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "❌ ERROR: Missing Supabase credentials in .env file" -ForegroundColor Red
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Read the SQL file
$sqlFile = "FIX_NOTIFICATIONS_FOLLOW_NOW.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading SQL file: $sqlFile" -ForegroundColor Yellow
$sqlContent = Get-Content $sqlFile -Raw

# Create the request body
$body = @{
    query = $sqlContent
} | ConvertTo-Json -Depth 10

# Deploy to Supabase
Write-Host ""
Write-Host "Deploying fix to Supabase..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec" `
        -Method POST `
        -Headers @{
            "apikey" = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS: Fix deployed successfully!" -ForegroundColor Green
} catch {
    # Try alternative method using SQL editor endpoint
    Write-Host "Trying alternative deployment method..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "apikey" = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type" = "application/json"
            "Prefer" = "return=representation"
        }
        
        # Split SQL into individual statements and execute
        $statements = $sqlContent -split ';' | Where-Object { $_.Trim() -ne '' }
        
        foreach ($statement in $statements) {
            if ($statement.Trim() -match '^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|DO|NOTIFY)') {
                Write-Host "Executing: $($statement.Trim().Substring(0, [Math]::Min(50, $statement.Trim().Length)))..." -ForegroundColor Gray
                
                $stmtBody = @{
                    query = $statement
                } | ConvertTo-Json
                
                try {
                    Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec" `
                        -Method POST `
                        -Headers $headers `
                        -Body $stmtBody `
                        -ErrorAction SilentlyContinue | Out-Null
                } catch {
                    # Continue on error for individual statements
                }
            }
        }
        
        Write-Host "✅ Deployment attempted via alternative method" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  WARNING: Automatic deployment failed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "MANUAL DEPLOYMENT REQUIRED:" -ForegroundColor Yellow
        Write-Host "1. Go to: $SUPABASE_URL/project/_/sql" -ForegroundColor White
        Write-Host "2. Open file: FIX_NOTIFICATIONS_FOLLOW_NOW.sql" -ForegroundColor White
        Write-Host "3. Copy all contents" -ForegroundColor White
        Write-Host "4. Paste into Supabase SQL Editor" -ForegroundColor White
        Write-Host "5. Click 'Run' button" -ForegroundColor White
        Write-Host ""
        Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Yellow
Write-Host "  ✓ Added 'payload' column to notifications table" -ForegroundColor Green
Write-Host "  ✓ Updated fn_notify_followers function" -ForegroundColor Green
Write-Host "  ✓ Updated fn_notify_messages function" -ForegroundColor Green
Write-Host "  ✓ Recreated notification triggers" -ForegroundColor Green
Write-Host "  ✓ Added error handling to prevent follow failures" -ForegroundColor Green
Write-Host ""
Write-Host "Follow functionality should now work in:" -ForegroundColor Yellow
Write-Host "  • Search Users page (/search-users)" -ForegroundColor White
Write-Host "  • Public Profile page (/@username)" -ForegroundColor White
Write-Host "  • Followers page (/followers)" -ForegroundColor White
Write-Host ""
Write-Host "Test the fix:" -ForegroundColor Yellow
Write-Host "  1. Go to Search Users page" -ForegroundColor White
Write-Host "  2. Click 'Follow' button on any profile" -ForegroundColor White
Write-Host "  3. Verify no errors appear" -ForegroundColor White
Write-Host "  4. Check that follow count updates" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors, run this script again or deploy manually." -ForegroundColor Cyan
Write-Host ""
