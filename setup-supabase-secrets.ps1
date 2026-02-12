# Setup Supabase Edge Function Secrets for Pi Network Mainnet
# Run this script to configure all required secrets in Supabase

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Supabase Edge Functions Secrets Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCLI) {
    Write-Host "[ERROR] Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Load .env file
Write-Host "Loading environment variables from .env..." -ForegroundColor Yellow
$envFile = Get-Content ".env" -Raw
$envVars = @{}

$envFile -split "`n" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().TrimStart('"').TrimEnd('"')
            $envVars[$key] = $value
        }
    }
}

Write-Host "[✓] Environment variables loaded" -ForegroundColor Green
Write-Host ""

# Verify required keys
Write-Host "Verifying required environment variables..." -ForegroundColor Yellow
Write-Host ""

$requiredKeys = @(
    'PI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
)

$allFound = $true
foreach ($key in $requiredKeys) {
    if ($envVars.ContainsKey($key) -and $envVars[$key]) {
        $value = $envVars[$key]
        if ($value.Length -gt 20) {
            $display = $value.Substring(0, 20) + "..."
        } else {
            $display = $value
        }
        Write-Host "  [✓] $key" -ForegroundColor Green
        Write-Host "      $display" -ForegroundColor Gray
    } else {
        Write-Host "  [✗] $key - MISSING" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""

if (-not $allFound) {
    Write-Host "[ERROR] Missing required environment variables" -ForegroundColor Red
    exit 1
}

# Check if linked to Supabase
Write-Host "Checking Supabase project link..." -ForegroundColor Yellow
try {
    supabase status | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Supabase project is linked" -ForegroundColor Green
    } else {
        Write-Host "[⚠] Supabase project not linked. Linking..." -ForegroundColor Yellow
        supabase link
    }
} catch {
    Write-Host "[⚠] Could not verify link" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting Supabase Edge Function Secrets..." -ForegroundColor Cyan
Write-Host ""

# Secrets to set
$secrets = @(
    @{
        name = 'PI_API_KEY'
        value = $envVars['PI_API_KEY']
        description = 'Pi Network API Key for mainnet payments'
    },
    @{
        name = 'SUPABASE_URL'
        value = $envVars['SUPABASE_URL']
        description = 'Supabase project URL'
    },
    @{
        name = 'SUPABASE_SERVICE_ROLE_KEY'
        value = $envVars['SUPABASE_SERVICE_ROLE_KEY']
        description = 'Supabase service role key for backend operations'
    },
    @{
        name = 'SUPABASE_JWT_SECRET'
        value = $envVars['SUPABASE_JWT_SECRET']
        description = 'JWT secret for token verification'
    },
    @{
        name = 'PI_PAYMENT_RECEIVER_WALLET'
        value = $envVars['PI_PAYMENT_RECEIVER_WALLET']
        description = 'Pi Network wallet address for payment receiver'
    }
)

$setCount = 0
foreach ($secret in $secrets) {
    Write-Host "Setting $($secret.name)..." -ForegroundColor White
    Write-Host "  $($secret.description)" -ForegroundColor Gray
    
    try {
        # Use echo to pipe secret value to supabase secrets set
        $secret.value | supabase secrets set $secret.name 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [✓] Set successfully" -ForegroundColor Green
            $setCount++
        } else {
            Write-Host "  [⚠] May already exist or error occurred" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [⚠] Error setting secret: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Supabase Secrets Setup Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Configured $setCount secrets" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy updated edge functions:" -ForegroundColor White
Write-Host "     supabase functions deploy pi-auth pi-payment-approve pi-payment-complete pi-ad-verify" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Rebuild and redeploy your frontend:" -ForegroundColor White
Write-Host "     bun run build" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test in Pi Browser:" -ForegroundColor White
Write-Host "     - Sign in with Pi Network" -ForegroundColor Gray
Write-Host "     - Verify profile is created in Supabase" -ForegroundColor Gray
Write-Host "     - Test a payment (small amount for safety)" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Monitor logs:" -ForegroundColor White
Write-Host "     supabase functions logs --project-ref <ref> pi-payment-approve" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - If secrets fail, set manually in Supabase Dashboard" -ForegroundColor Gray
Write-Host "    → Settings → Edge Functions → Secrets" -ForegroundColor Gray
Write-Host "  - Ensure PI_API_KEY matches VITE_PI_API_KEY in .env" -ForegroundColor Gray
Write-Host "  - Verify VITE_PI_PAYMENTS_ENABLED=true in .env" -ForegroundColor Gray
Write-Host ""
