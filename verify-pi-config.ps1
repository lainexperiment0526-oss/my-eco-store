# Verify Pi Configuration in Built Files
Write-Host "`n=== Pi Configuration Verification ===" -ForegroundColor Cyan

# Check .env.production
Write-Host "`n1. Checking .env.production..." -ForegroundColor Yellow
$envContent = Get-Content ".env.production" -Raw
$apiKeyMatch = $envContent -match 'VITE_PI_API_KEY=([^\r\n]+)'
$valKeyMatch = $envContent -match 'VITE_PI_VALIDATION_KEY=([^\r\n]+)'

if ($apiKeyMatch) {
    $envApiKey = $Matches[1].Trim()
    Write-Host "   API Key: $($envApiKey.Substring(0, 20))... (length: $($envApiKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   API Key: NOT FOUND" -ForegroundColor Red
}

if ($valKeyMatch) {
    $envValKey = $Matches[1].Trim()
    Write-Host "   Validation Key: $($envValKey.Substring(0, 20))... (length: $($envValKey.Length))" -ForegroundColor Green
} else {
    Write-Host "   Validation Key: NOT FOUND" -ForegroundColor Red
}

# Check manifest.json
Write-Host "`n2. Checking public/manifest.json..." -ForegroundColor Yellow
$manifestContent = Get-Content "public\manifest.json" -Raw | ConvertFrom-Json
$manifestApiKey = $manifestContent.pi_app.api_key
$manifestValKey = $manifestContent.pi_app.validation_key

Write-Host "   API Key: $($manifestApiKey.Substring(0, 20))... (length: $($manifestApiKey.Length))" -ForegroundColor Green
Write-Host "   Validation Key: $($manifestValKey.Substring(0, 20))... (length: $($manifestValKey.Length))" -ForegroundColor Green

# Check validation-key.txt
Write-Host "`n3. Checking public/validation-key.txt..." -ForegroundColor Yellow
$valKeyFile = (Get-Content "public\validation-key.txt" -Raw).Trim()
Write-Host "   Validation Key: $($valKeyFile.Substring(0, 20))... (length: $($valKeyFile.Length))" -ForegroundColor Green

# Compare values
Write-Host "`n4. Comparing values..." -ForegroundColor Yellow
$apiMatch = $envApiKey -eq $manifestApiKey
$valMatch = $envValKey -eq $manifestValKey
$valFileMatch = $envValKey -eq $valKeyFile

if ($apiMatch) {
    Write-Host "   ✓ API Key matches between .env.production and manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ API Key MISMATCH between .env.production and manifest.json" -ForegroundColor Red
}

if ($valMatch) {
    Write-Host "   ✓ Validation Key matches between .env.production and manifest.json" -ForegroundColor Green
} else {
    Write-Host "   ✗ Validation Key MISMATCH between .env.production and manifest.json" -ForegroundColor Red
}

if ($valFileMatch) {
    Write-Host "   ✓ Validation Key matches between .env.production and validation-key.txt" -ForegroundColor Green
} else {
    Write-Host "   ✗ Validation Key MISMATCH between .env.production and validation-key.txt" -ForegroundColor Red
}

# Check built files
Write-Host "`n5. Checking built files..." -ForegroundColor Yellow
if (Test-Path "dist\assets\index-*.js") {
    $jsFile = Get-ChildItem "dist\assets\index-*.js" | Select-Object -First 1
    $jsContent = Get-Content $jsFile.FullName -Raw
    
    # Search for the API key in the built file (it will be embedded as a string)
    if ($jsContent -match [regex]::Escape($envApiKey.Substring(0, 30))) {
        Write-Host "   ✓ API Key found in built JavaScript file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ API Key not found in built JavaScript (this is OK if using different build)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ No built JavaScript files found in dist/assets/" -ForegroundColor Yellow
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
