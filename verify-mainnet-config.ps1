#!/usr/bin/env pwsh
# ============================================
# Pi Network Mainnet Configuration Verification
# Verify all configuration is correct before deployment
# ============================================

Write-Host ""
Write-Host "🔍 Pi Network Mainnet Configuration Verification" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0

# Expected values
$expectedApiKey = "ajm48wt1i2x4texoodypcs2rekfuoyrgg3hqowq2pefsfxqnixzlmbtztubzquuw"
$expectedValidationKey = "7511661aac4538b1832d2c9ba117f6d972b26a54640598d3fbb9824013c7079203f65b02d125be3f418605cfb89ba0e4443e3ec997e3800eb464df0bc5410d2a"

Write-Host "📋 Checking Environment Files..." -ForegroundColor Yellow
Write-Host ""

# Check .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_PI_API_KEY=`"?$expectedApiKey`"?") {
        Write-Host "  ✅ .env - API Key correct" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ .env - API Key incorrect or missing" -ForegroundColor Red
        $errors += ".env API Key mismatch"
    }
    
    if ($envContent -match "VITE_PI_VALIDATION_KEY=`"?$expectedValidationKey`"?") {
        Write-Host "  ✅ .env - Validation Key correct" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ .env - Validation Key incorrect or missing" -ForegroundColor Red
        $errors += ".env Validation Key mismatch"
    }
    
    if ($envContent -match 'VITE_PI_NETWORK=.?mainnet.?') {
        Write-Host "  ✅ .env - Network set to mainnet" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ⚠️  .env - Network not set to mainnet" -ForegroundColor Yellow
        $warnings += ".env Network setting"
    }
} else {
    Write-Host "  ❌ .env file not found" -ForegroundColor Red
    $errors += ".env file missing"
}

Write-Host ""

# Check .env.production file
if (Test-Path ".env.production") {
    $prodEnvContent = Get-Content ".env.production" -Raw
    if ($prodEnvContent -match "VITE_PI_API_KEY=$expectedApiKey") {
        Write-Host "  ✅ .env.production - API Key correct" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ .env.production - API Key incorrect or missing" -ForegroundColor Red
        $errors += ".env.production API Key mismatch"
    }
    
    if ($prodEnvContent -match "VITE_PI_VALIDATION_KEY=$expectedValidationKey") {
        Write-Host "  ✅ .env.production - Validation Key correct" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ .env.production - Validation Key incorrect or missing" -ForegroundColor Red
        $errors += ".env.production Validation Key mismatch"
    }
} else {
    Write-Host "  ❌ .env.production file not found" -ForegroundColor Red
    $errors += ".env.production file missing"
}

Write-Host ""
Write-Host "📄 Checking Validation Key Files..." -ForegroundColor Yellow
Write-Host ""

# Check validation key files
$validationFiles = @(
    "validation-key.txt",
    "public/validation-key.txt",
    "public/.well-known/validation-key.txt"
)

foreach ($file in $validationFiles) {
    if (Test-Path $file) {
        $content = (Get-Content $file -Raw).Trim()
        if ($content -eq $expectedValidationKey) {
            Write-Host "  ✅ $file - Correct" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ $file - Content mismatch" -ForegroundColor Red
            $errors += "$file content mismatch"
        }
    } else {
        Write-Host "  ❌ $file - Not found" -ForegroundColor Red
        $errors += "$file missing"
    }
}

Write-Host ""
Write-Host "🔧 Checking Configuration Files..." -ForegroundColor Yellow
Write-Host ""

# Check pi-config.ts
if (Test-Path "src/config/pi-config.ts") {
    Write-Host "  ✅ src/config/pi-config.ts - Found" -ForegroundColor Green
    $passed++
} else {
    Write-Host "  ❌ src/config/pi-config.ts - Not found" -ForegroundColor Red
    $errors += "pi-config.ts missing"
}

# Check backend functions
$backendFunctions = @(
    "supabase/functions/pi-payment-approve/index.ts",
    "supabase/functions/pi-payment-complete/index.ts",
    "supabase/functions/pi-ad-verify/index.ts"
)

foreach ($func in $backendFunctions) {
    if (Test-Path $func) {
        Write-Host "  ✅ $func - Found" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ⚠️  $func - Not found" -ForegroundColor Yellow
        $warnings += "$func missing"
    }
}

Write-Host ""
Write-Host "📚 Checking Documentation..." -ForegroundColor Yellow
Write-Host ""

$docFiles = @(
    "PI_MAINNET_SETUP_GUIDE.md",
    "PI_MAINNET_QUICK_REFERENCE.md",
    "PI_MAINNET_INTEGRATION_COMPLETE.md",
    "DROPLINK_MAINNET_CONFIG.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc - Found" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ⚠️  $doc - Not found" -ForegroundColor Yellow
        $warnings += "$doc missing"
    }
}

Write-Host ""
Write-Host "🔐 Checking Supabase Secrets..." -ForegroundColor Yellow
Write-Host ""

# Check if Supabase CLI is available
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCLI) {
    try {
        $secrets = supabase secrets list 2>&1
        if ($secrets -match "PI_API_KEY") {
            Write-Host "  ✅ PI_API_KEY - Set in Supabase" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ⚠️  PI_API_KEY - Not set in Supabase" -ForegroundColor Yellow
            $warnings += "PI_API_KEY not in Supabase (run deploy-mainnet-config.ps1)"
        }
        
        if ($secrets -match "PI_VALIDATION_KEY") {
            Write-Host "  ✅ PI_VALIDATION_KEY - Set in Supabase" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ⚠️  PI_VALIDATION_KEY - Not set in Supabase" -ForegroundColor Yellow
            $warnings += "PI_VALIDATION_KEY not in Supabase (run deploy-mainnet-config.ps1)"
        }
    } catch {
        Write-Host "  ⚠️  Could not check Supabase secrets (not logged in?)" -ForegroundColor Yellow
        $warnings += "Supabase secrets check failed"
    }
} else {
    Write-Host "  ⚠️  Supabase CLI not found - Cannot verify secrets" -ForegroundColor Yellow
    $warnings += "Supabase CLI not installed"
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Passed Checks: $passed" -ForegroundColor Green
Write-Host "  ⚠️  Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "  ❌ Errors: $($errors.Count)" -ForegroundColor Red
Write-Host ""

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Errors:" -ForegroundColor Red
    foreach ($errMsg in $errors) {
        Write-Host "  - $errMsg" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔧 Fix the errors above before deployment!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "🎉 Configuration Verification Complete!" -ForegroundColor Green
    Write-Host ""
    
    if ($warnings.Count -eq 0) {
        Write-Host "✨ Perfect! All checks passed." -ForegroundColor Green
        Write-Host "   Ready for deployment!" -ForegroundColor Green
    } else {
        Write-Host "✅ Core configuration is correct." -ForegroundColor Green
        Write-Host "   Review warnings and deploy Supabase secrets if needed:" -ForegroundColor Yellow
        Write-Host "   .\deploy-mainnet-config.ps1" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy Supabase secrets: .\deploy-mainnet-config.ps1" -ForegroundColor White
    Write-Host "  2. Build application: npm run build" -ForegroundColor White
    Write-Host "  3. Deploy to hosting platform" -ForegroundColor White
    Write-Host "  4. Test in Pi Browser" -ForegroundColor White
    Write-Host ""
}
