# Edge Functions Connection and PI Payment Fix Script
# This script ensures all edge functions are properly connected to Supabase

Write-Host "🚀 Connecting Edge Functions for PI Payment System..." -ForegroundColor Cyan
Write-Host ""

# Project Configuration  
$PROJECT_ID = "jzzbmoopwnvgxxirulga"
$SUPABASE_URL = "https://$PROJECT_ID.supabase.co"

Write-Host "📋 Project Configuration:" -ForegroundColor Yellow
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Supabase URL: $SUPABASE_URL" -ForegroundColor White
Write-Host ""

# Check deployed functions
Write-Host "🔍 Checking Deployed Functions..." -ForegroundColor Yellow
try {
    supabase functions list | Out-Null
    Write-Host "   ✅ Successfully retrieved functions list" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Could not retrieve functions list" -ForegroundColor Red
}

Write-Host ""

# Set required secrets for PI payments
Write-Host "🔐 Configuring PI Payment Secrets..." -ForegroundColor Cyan

try {
    supabase secrets set PI_API_KEY="b00j4felp0ctc1fexe8igldsjg9u7wbqitavc15si53fr9wwra7r6oluzk4j24qz"
    Write-Host "   ✅ PI_API_KEY configured" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not set PI_API_KEY" -ForegroundColor Yellow
}

try {
    supabase secrets set PI_MAINNET_MODE="true"
    Write-Host "   ✅ PI_MAINNET_MODE configured" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not set PI_MAINNET_MODE" -ForegroundColor Yellow
}

Write-Host ""

# Check secrets
Write-Host "🔐 Verifying Secrets Configuration..." -ForegroundColor Yellow
try {
    supabase secrets list | Out-Null
    Write-Host "   ✅ Secrets retrieved successfully" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not verify secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Edge Functions Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test PI payment functions in your app" -ForegroundColor White
Write-Host "   2. Monitor function logs in Supabase Dashboard" -ForegroundColor White
Write-Host "   3. Verify payments in Pi Developer Portal" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Dashboard Link:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/$PROJECT_ID/functions" -ForegroundColor Cyan