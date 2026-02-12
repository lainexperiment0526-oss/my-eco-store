# Setup script for Pi Network API Key in Supabase (Mainnet)
# This sets the PI_API_KEY environment variable for all edge functions

Write-Host "Setting up Pi Network API Key for Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
try {
    $null = & supabase --version 2>&1
    Write-Host "Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Mainnet API Key (DropLink Official)
$PI_API_KEY = "ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"

Write-Host "Setting PI_API_KEY environment variable..." -ForegroundColor Cyan
Write-Host "API Key: $($PI_API_KEY.Substring(0, 10))..." -ForegroundColor Gray

# Run supabase secrets set
& supabase secrets set PI_API_KEY="$PI_API_KEY"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Successfully set PI_API_KEY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The API key is now configured for all edge functions:" -ForegroundColor Green
    Write-Host "  - pi-payment-approve" -ForegroundColor Green
    Write-Host "  - pi-payment-complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can verify by checking your Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "  Project Settings -> Edge Functions -> Secrets" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pi Network Docs: https://pi-apps.github.io/community-developer-guide/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Failed to set API key. Please check your Supabase CLI configuration." -ForegroundColor Red
    Write-Host "Try running: supabase link" -ForegroundColor Yellow
    exit 1
}
