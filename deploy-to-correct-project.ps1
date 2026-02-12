# Deploy Edge Functions to Correct Supabase Project
# This script deploys all functions to project jzzbmoopwnvgxxirulga

Write-Host "🚀 Deploying Edge Functions to Correct Project..." -ForegroundColor Cyan
Write-Host ""

# Target project configuration
$TARGET_PROJECT = "jzzbmoopwnvgxxirulga"
$TARGET_URL = "https://$TARGET_PROJECT.supabase.co"

Write-Host "📋 Target Project:" -ForegroundColor Yellow
Write-Host "   Project ID: $TARGET_PROJECT" -ForegroundColor White
Write-Host "   URL: $TARGET_URL" -ForegroundColor White
Write-Host ""

# List of critical functions to deploy
$FUNCTIONS_TO_DEPLOY = @(
    "pi-auth",
    "pi-payment-approve", 
    "pi-payment-complete",
    "pi-ad-verify",
    "financial-data",
    "subscription",
    "profile-update",
    "wallet-increment",
    "search-users",
    "product",
    "store",
    "followers",
    "send-gift-card-email"
)

# First, try to create a temporary link to target project
Write-Host "🔗 Attempting to link to target project..." -ForegroundColor Yellow

# Create a temporary config for the target project
$tempConfig = @"
project_id = "$TARGET_PROJECT"

[functions.pi-auth]
verify_jwt = false

[functions.pi-payment-approve]
verify_jwt = false

[functions.pi-payment-complete] 
verify_jwt = false

[functions.pi-ad-verify]
verify_jwt = false

[functions.financial-data]
verify_jwt = false

[functions.subscription]
verify_jwt = false

[functions.profile-update]
verify_jwt = false

[functions.wallet-increment]
verify_jwt = false

[functions.search-users]
verify_jwt = false

[functions.product]
verify_jwt = false

[functions.store]
verify_jwt = false

[functions.followers]
verify_jwt = false

[functions.send-gift-card-email]
verify_jwt = false
"@

# Backup current config and create target config
if (Test-Path "supabase\config.toml") {
    Copy-Item "supabase\config.toml" "supabase\config.toml.backup"
    Write-Host "   📄 Backed up current config" -ForegroundColor Green
}

$tempConfig | Out-File -FilePath "supabase\config.toml" -Encoding UTF8
Write-Host "   📝 Created target project config" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Deploying Functions..." -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($funcName in $FUNCTIONS_TO_DEPLOY) {
    if (Test-Path "supabase\functions\$funcName\index.ts") {
        Write-Host "📦 Deploying $funcName..." -ForegroundColor White
        try {
            # Try to deploy with explicit project reference
            $result = supabase functions deploy $funcName --project-ref $TARGET_PROJECT --no-verify-jwt 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ $funcName deployed successfully" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "   ⚠️  $funcName deployment issue: $result" -ForegroundColor Yellow
                $failCount++
            }
        } catch {
            Write-Host "   ❌ Failed to deploy $funcName" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "⚠️  Function $funcName not found locally" -ForegroundColor Yellow
        $failCount++
    }
}

Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red

# Restore original config
if (Test-Path "supabase\config.toml.backup") {
    Move-Item "supabase\config.toml.backup" "supabase\config.toml" -Force
    Write-Host "   📄 Restored original config" -ForegroundColor Green
}

Write-Host ""
Write-Host "🧪 Testing Deployed Functions..." -ForegroundColor Yellow

# Test a few critical functions
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIwMzEyNSwiZXhwIjoyMDc0Nzc5MTI1fQ.BGsSUMxHQPHTNtrbKyPyRRx26CL2Qw3smDDOFYrjtTk"

$testFunctions = @("pi-auth", "pi-payment-approve", "financial-data")
foreach ($testFunc in $testFunctions) {
    $testUrl = "$TARGET_URL/functions/v1/$testFunc"
    try {
        $headers = @{
            "Authorization" = "Bearer $serviceKey"
            "Content-Type" = "application/json"
        }
        $testResponse = Invoke-RestMethod -Uri $testUrl -Method POST -Headers $headers -Body '{"test": true}' -TimeoutSec 5
        Write-Host "   ✅ $testFunc - Responding correctly" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 400 -or $statusCode -eq 422) {
            Write-Host "   ✅ $testFunc - Working (validation error expected)" -ForegroundColor Green  
        } elseif ($statusCode -eq 404) {
            Write-Host "   ❌ $testFunc - Not found (deployment failed)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $testFunc - Status: $statusCode" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🎉 Edge Functions Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Dashboard Links:" -ForegroundColor Yellow  
Write-Host "   • Functions: https://supabase.com/dashboard/project/$TARGET_PROJECT/functions" -ForegroundColor Cyan
Write-Host "   • Logs: https://supabase.com/dashboard/project/$TARGET_PROJECT/logs/edge-functions" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check the dashboard to verify all functions are deployed" -ForegroundColor White
Write-Host "   2. Test PI payments in your application" -ForegroundColor White  
Write-Host "   3. Monitor function logs for any errors" -ForegroundColor White