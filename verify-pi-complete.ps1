Write-Host "`n=== Pi Environment Configuration Verification ===" -ForegroundColor Cyan

# Check .env file
Write-Host "`n1. Checking .env (Development)..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'VITE_PI_API_KEY="([^"]+)"') {
    $devApiKey = $Matches[1]
    Write-Host "   API Key: $($devApiKey.Substring(0, 20))... (length: $($devApiKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   API Key: NOT FOUND" -ForegroundColor Red
}

if ($envContent -match 'VITE_PI_VALIDATION_KEY="([^"]+)"') {
    $devValKey = $Matches[1]
    Write-Host "   Validation Key: $($devValKey.Substring(0, 20))... (length: $($devValKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   Validation Key: NOT FOUND" -ForegroundColor Red
}

# Check .env.production file
Write-Host "`n2. Checking .env.production (Production)..." -ForegroundColor Yellow
$prodContent = Get-Content ".env.production" -Raw
if ($prodContent -match 'VITE_PI_API_KEY=([^\r\n]+)') {
    $prodApiKey = $Matches[1].Trim()
    Write-Host "   API Key: $($prodApiKey.Substring(0, 20))... (length: $($prodApiKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   API Key: NOT FOUND" -ForegroundColor Red
}

if ($prodContent -match 'VITE_PI_VALIDATION_KEY=([^\r\n]+)') {
    $prodValKey = $Matches[1].Trim()
    Write-Host "   Validation Key: $($prodValKey.Substring(0, 20))... (length: $($prodValKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   Validation Key: NOT FOUND" -ForegroundColor Red
}

# Check manifest.json
Write-Host "`n3. Checking public/manifest.json..." -ForegroundColor Yellow
$manifestContent = Get-Content "public\manifest.json" -Raw | ConvertFrom-Json
$manifestApiKey = $manifestContent.pi_app.api_key
$manifestValKey = $manifestContent.pi_app.validation_key

Write-Host "   API Key: $($manifestApiKey.Substring(0, 20))... (length: $($manifestApiKey.Length))" -ForegroundColor Green
Write-Host "   Validation Key: $($manifestValKey.Substring(0, 20))... (length: $($manifestValKey.Length))" -ForegroundColor Green

# Check validation-key.txt
Write-Host "`n4. Checking public/validation-key.txt..." -ForegroundColor Yellow
$valKeyFile = (Get-Content "public\validation-key.txt" -Raw).Trim()
Write-Host "   Validation Key: $($valKeyFile.Substring(0, 20))... (length: $($valKeyFile.Length))" -ForegroundColor Green

# Compare ALL values
Write-Host "`n5. Cross-Validation Results..." -ForegroundColor Yellow

# Development checks
$devApiMatch = $devApiKey -eq $manifestApiKey
$devValMatch = $devValKey -eq $manifestValKey
$devValFileMatch = $devValKey -eq $valKeyFile

if ($devApiMatch) {
    Write-Host "   ✓ DEV: API Key matches manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ DEV: API Key MISMATCH with manifest.json" -ForegroundColor Red
    Write-Host "      .env: $($devApiKey.Substring(0, 30))..." -ForegroundColor Yellow
    Write-Host "      manifest: $($manifestApiKey.Substring(0, 30))..." -ForegroundColor Yellow
}

if ($devValMatch) {
    Write-Host "   ✓ DEV: Validation Key matches manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ DEV: Validation Key MISMATCH with manifest.json" -ForegroundColor Red
}

if ($devValFileMatch) {
    Write-Host "   ✓ DEV: Validation Key matches validation-key.txt" -ForegroundColor Green
} else {
    Write-Host "   ✗ DEV: Validation Key MISMATCH with validation-key.txt" -ForegroundColor Red
}

# Production checks
$prodApiMatch = $prodApiKey -eq $manifestApiKey
$prodValMatch = $prodValKey -eq $manifestValKey
$prodValFileMatch = $prodValKey -eq $valKeyFile

if ($prodApiMatch) {
    Write-Host "   ✓ PROD: API Key matches manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ PROD: API Key MISMATCH with manifest.json" -ForegroundColor Red
    Write-Host "      .env.production: $($prodApiKey.Substring(0, 30))..." -ForegroundColor Yellow
    Write-Host "      manifest: $($manifestApiKey.Substring(0, 30))..." -ForegroundColor Yellow
}

if ($prodValMatch) {
    Write-Host "   ✓ PROD: Validation Key matches manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ PROD: Validation Key MISMATCH with manifest.json" -ForegroundColor Red
}

if ($prodValFileMatch) {
    Write-Host "   ✓ PROD: Validation Key matches validation-key.txt" -ForegroundColor Green
} else {
    Write-Host "   ✗ PROD: Validation Key MISMATCH with validation-key.txt" -ForegroundColor Red
}

Write-Host "`n6. NODE_ENV Check..." -ForegroundColor Yellow
if ($envContent -match 'NODE_ENV') {
    Write-Host "   ⚠ WARNING: NODE_ENV found in .env (should be removed)" -ForegroundColor Red
} else {
    Write-Host "   ✓ .env is clean (no NODE_ENV)" -ForegroundColor Green
}

if ($prodContent -match 'NODE_ENV') {
    Write-Host "   ⚠ WARNING: NODE_ENV found in .env.production (should be removed)" -ForegroundColor Red
} else {
    Write-Host "   ✓ .env.production is clean (no NODE_ENV)" -ForegroundColor Green
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($devApiMatch -and $devValMatch -and $prodApiMatch -and $prodValMatch) {
    Write-Host "✓ ALL CHECKS PASSED - Pi environment is correctly configured!" -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor White
    Write-Host "  - Test in development: http://localhost:8080/" -ForegroundColor Cyan
    Write-Host "  - Build for production: npm run build" -ForegroundColor Cyan
    Write-Host "  - Deploy to Pi Browser" -ForegroundColor Cyan
} else {
    Write-Host "✗ CONFIGURATION ERRORS DETECTED - Please review above" -ForegroundColor Red
}
Write-Host ""
