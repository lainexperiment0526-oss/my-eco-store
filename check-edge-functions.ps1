# Edge Functions Health Check
# Verifies all Supabase Edge Functions are properly configured and working

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Supabase Edge Functions Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$functionsPath = "supabase\functions"
$allGood = $true

# List of critical edge functions
$criticalFunctions = @(
    @{ Name = "pi-payment-approve"; Description = "Approves Pi Network payments"; Critical = $true },
    @{ Name = "pi-payment-complete"; Description = "Completes Pi Network payments"; Critical = $true },
    @{ Name = "pi-auth"; Description = "Authenticates Pi Network users"; Critical = $true },
    @{ Name = "subscription"; Description = "Manages subscriptions"; Critical = $false },
    @{ Name = "search-users"; Description = "User search functionality"; Critical = $false },
    @{ Name = "profile-update"; Description = "Updates user profiles"; Critical = $false },
    @{ Name = "store"; Description = "Store/product management"; Critical = $false },
    @{ Name = "wallet-increment"; Description = "DROP token wallet updates"; Critical = $false },
    @{ Name = "theme-management"; Description = "Theme customization"; Critical = $false },
    @{ Name = "send-gift-card-email"; Description = "Gift card email notifications"; Critical = $false }
)

Write-Host "Edge Functions Inventory:" -ForegroundColor Yellow
Write-Host ""

$foundFunctions = 0
$missingFunctions = 0

foreach ($func in $criticalFunctions) {
    $funcPath = "$functionsPath\$($func.Name)\index.ts"
    
    if (Test-Path $funcPath) {
        $foundFunctions++
        Write-Host "  [OK] $($func.Name)" -ForegroundColor Green
        Write-Host "       $($func.Description)" -ForegroundColor Gray
        
        # Check for common issues
        $content = Get-Content $funcPath -Raw
        
        # Check 1: Has serve() call
        if ($content -notmatch "serve\s*\(") {
            Write-Host "       [WARNING] Missing serve() call" -ForegroundColor Yellow
            $allGood = $false
        }
        
        # Check 2: Has CORS headers
        if ($content -notmatch "corsHeaders|CORS") {
            Write-Host "       [WARNING] Missing CORS headers" -ForegroundColor Yellow
        }
        
        # Check 3: Has error handling
        if ($content -notmatch "try\s*\{|catch") {
            Write-Host "       [WARNING] Missing error handling" -ForegroundColor Yellow
        }
        
        # Check 4: Payment functions need PI_API_KEY
        if ($func.Name -match "pi-payment" -and $content -notmatch "PI_API_KEY") {
            Write-Host "       [ERROR] Missing PI_API_KEY check" -ForegroundColor Red
            $allGood = $false
        }
        
    } else {
        $missingFunctions++
        if ($func.Critical) {
            Write-Host "  [ERROR] $($func.Name)" -ForegroundColor Red
            Write-Host "          MISSING (CRITICAL)" -ForegroundColor Red
            $allGood = $false
        } else {
            Write-Host "  [SKIP] $($func.Name)" -ForegroundColor Yellow
            Write-Host "         Missing (Optional)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Summary: $foundFunctions found, $missingFunctions missing" -ForegroundColor Cyan
Write-Host ""

# Check for required environment variables
Write-Host "Checking Environment Variables:" -ForegroundColor Yellow
Write-Host ""

# Check local .env file
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    
    if ($envContent -match "PI_API_KEY=") {
        Write-Host "  [OK] PI_API_KEY - Found in .env" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] PI_API_KEY - Missing from .env" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($envContent -match "VITE_SUPABASE_URL=") {
        Write-Host "  [OK] VITE_SUPABASE_URL - Found in .env" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] VITE_SUPABASE_URL - Missing from .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARNING] .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Check if Supabase CLI is available
Write-Host "Checking Deployment Tools:" -ForegroundColor Yellow
Write-Host ""

$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCLI) {
    Write-Host "  [OK] Supabase CLI is installed" -ForegroundColor Green
    
    # Check if project is linked
    $projectLinked = $false
    try {
        $statusResult = supabase status 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            $projectLinked = $true
            Write-Host "  [OK] Supabase project is linked" -ForegroundColor Green
        }
    } catch {
        # Ignore
    }
    
    if (-not $projectLinked) {
        Write-Host "  [WARNING] Supabase project not linked" -ForegroundColor Yellow
        Write-Host "            Run: supabase link" -ForegroundColor Gray
    }
} else {
    Write-Host "  [ERROR] Supabase CLI not installed" -ForegroundColor Red
    Write-Host "          Install: npm install -g supabase" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

if ($allGood) {
    Write-Host "[SUCCESS] All Edge Functions Check Passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Ensure PI_API_KEY is set in Supabase:" -ForegroundColor White
    Write-Host "   Dashboard -> Settings -> Edge Functions -> Secrets" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deploy all functions:" -ForegroundColor White
    Write-Host "   .\deploy-edge-functions.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test payment flow in Pi Browser" -ForegroundColor White
} else {
    Write-Host "[WARNING] Issues Found - Please Fix:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Critical Actions Required:" -ForegroundColor Red
    Write-Host "1. Ensure all critical edge functions exist" -ForegroundColor White
    Write-Host "2. Set PI_API_KEY in Supabase Dashboard" -ForegroundColor White
    Write-Host "3. Link Supabase project: supabase link" -ForegroundColor White
    Write-Host "4. Deploy functions: .\deploy-edge-functions.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "For detailed guides, see:" -ForegroundColor Cyan
Write-Host "  - EDGE_FUNCTIONS_STATUS.md" -ForegroundColor Gray
Write-Host "  - COMPLETE_PAYMENT_SETUP.md" -ForegroundColor Gray
Write-Host ""
