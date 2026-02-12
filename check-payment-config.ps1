# Payment Configuration Checker
# This script verifies that all payment configurations are correct

Write-Host "🔍 Checking Payment Configuration..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: .env file exists
Write-Host "1. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file found" -ForegroundColor Green
    
    # Load and check PI_API_KEY
    $envContent = Get-Content .env -Raw
    if ($envContent -match 'PI_API_KEY="([^"]+)"') {
        $apiKey = $matches[1]
        Write-Host "   ✅ PI_API_KEY found: $($apiKey.Substring(0, 10))..." -ForegroundColor Green
    } else {
        Write-Host "   ❌ PI_API_KEY not found in .env" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check 2: Supabase CLI installed
Write-Host "2. Checking Supabase CLI..." -ForegroundColor Yellow
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Supabase CLI is installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "   Install with: npm install -g supabase" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check 3: Edge functions exist
Write-Host "3. Checking Edge Functions..." -ForegroundColor Yellow
$functionsPath = "supabase\functions"
$requiredFunctions = @("pi-payment-approve", "pi-payment-complete")

foreach ($func in $requiredFunctions) {
    if (Test-Path "$functionsPath\$func\index.ts") {
        Write-Host "   ✅ $func exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $func not found" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Check 4: Try to get secrets (requires supabase to be linked)
Write-Host "4. Checking Supabase Project Link..." -ForegroundColor Yellow
try {
    $null = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase project is linked" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "5. Checking Supabase Secrets..." -ForegroundColor Yellow
        try {
            $secrets = supabase secrets list 2>&1 | Out-String
            if ($secrets -match "PI_API_KEY") {
                Write-Host "   ✅ PI_API_KEY is set in Supabase" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  PI_API_KEY not set in Supabase" -ForegroundColor Yellow
                Write-Host "   Run: supabase secrets set PI_API_KEY='your-key'" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ⚠️  Could not check secrets (may need permissions)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Supabase project not linked" -ForegroundColor Yellow
        Write-Host "   Run: supabase link" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not check Supabase status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($allGood) {
    Write-Host ""
    Write-Host "✨ Configuration looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Set PI_API_KEY in Supabase Dashboard:" -ForegroundColor White
    Write-Host "   Settings → Edge Functions → Secrets" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deploy edge functions:" -ForegroundColor White
    Write-Host "   .\deploy-edge-functions.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test payment in Pi Browser" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Some issues found. Please fix them first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Cyan
    Write-Host "- Missing .env? Copy from .env.example" -ForegroundColor White
    Write-Host "- No Supabase CLI? Run: npm install -g supabase" -ForegroundColor White
    Write-Host "- Not linked? Run: supabase link" -ForegroundColor White
    Write-Host ""
}

Write-Host "For detailed setup guide, see: COMPLETE_PAYMENT_SETUP.md" -ForegroundColor Cyan
Write-Host ""
