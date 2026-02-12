# Pi Network Setup Verification Script
Write-Host "`n=== Pi Network Integration Verification ===" -ForegroundColor Cyan

# Check validation key files
Write-Host "`n1. Checking validation key files..." -ForegroundColor Yellow
$files = @(
    "public\validation-key.txt",
    "public\.well-known\validation-key.txt"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
        $content = Get-Content $file -Raw
        Write-Host "   Key: $($content.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# Check manifest.json
Write-Host "`n2. Checking manifest.json..." -ForegroundColor Yellow
if (Test-Path "public\manifest.json") {
    $manifest = Get-Content "public\manifest.json" | ConvertFrom-Json
    Write-Host "   ✅ Manifest exists" -ForegroundColor Green
    Write-Host "   Pi App Name: $($manifest.pi_app.name)" -ForegroundColor Gray
    Write-Host "   Network: $($manifest.pi_app.network)" -ForegroundColor Gray
    Write-Host "   Domain: $($manifest.pi_app.domain)" -ForegroundColor Gray
    Write-Host "   Validation URL: $($manifest.pi_app.validation_url)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Manifest missing" -ForegroundColor Red
}

# Check index.html Pi meta tags
Write-Host "`n3. Checking index.html Pi meta tags..." -ForegroundColor Yellow
if (Test-Path "index.html") {
    $html = Get-Content "index.html" -Raw
    if ($html -match 'pi-validation-url') {
        Write-Host "   ✅ Pi meta tags found" -ForegroundColor Green
        if ($html -match 'content="([^"]*validation-key[^"]*)"') {
            Write-Host "   Validation URL: $($matches[1])" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Pi meta tags not found" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Common Issues & Solutions ===" -ForegroundColor Cyan
Write-Host "`nTesting Locally (localhost):" -ForegroundColor Yellow
Write-Host "   - Pi Browser expects production URL (droplink.space)" -ForegroundColor White
Write-Host "   - For local testing, update Pi Developer Portal to use:" -ForegroundColor White
Write-Host "     App URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "     Validation URL: http://localhost:8080/validation-key.txt" -ForegroundColor Cyan
Write-Host "   - Or use a tunneling service (ngrok, cloudflared)" -ForegroundColor White

Write-Host "`nTesting in Production:" -ForegroundColor Yellow
Write-Host "   - Ensure your app is deployed to https://droplink.space" -ForegroundColor White
Write-Host "   - Pi Developer Portal should have:" -ForegroundColor White
Write-Host "     App URL: https://droplink.space" -ForegroundColor Cyan
Write-Host "     Validation URL: https://droplink.space/validation-key.txt" -ForegroundColor Cyan

Write-Host "`nPi Developer Portal Settings:" -ForegroundColor Yellow
Write-Host "   1. Go to https://developers.minepi.com" -ForegroundColor White
Write-Host "   2. Select your app" -ForegroundColor White
Write-Host "   3. Update 'App URL' to match your testing environment" -ForegroundColor White
Write-Host "   4. Update 'Validation URL' to match your testing environment" -ForegroundColor White
Write-Host "   5. Save changes and wait 5-10 minutes for cache to clear" -ForegroundColor White

Write-Host "`nQuick Fix for Local Testing:" -ForegroundColor Yellow
Write-Host "   Run in a regular browser instead of Pi Browser for development" -ForegroundColor White
Write-Host "   Use Pi Browser only for final production testing" -ForegroundColor White

Write-Host "`n" -ForegroundColor White
