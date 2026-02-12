# PowerShell script for setting up Pi Network API Key in Supabase
# Run this script in PowerShell to set the PI_API_KEY environment variable

Write-Host "Setting up Pi Network API Key for Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Mainnet API Key
$PI_API_KEY = "ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"

Write-Host "Setting PI_API_KEY environment variable..." -ForegroundColor Yellow
supabase secrets set PI_API_KEY="$PI_API_KEY"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully set PI_API_KEY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The API key is now configured for all edge functions:" -ForegroundColor Cyan
    Write-Host "  - pi-payment-approve" -ForegroundColor White
    Write-Host "  - pi-payment-complete" -ForegroundColor White
    Write-Host ""
    Write-Host "You can verify by checking your Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "  Project Settings → Edge Functions → Secrets" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to set API key. Please check your Supabase CLI configuration." -ForegroundColor Red
    exit 1
}

