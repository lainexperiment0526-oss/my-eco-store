# Dynamic OG Metadata Testing Script (PowerShell)
# This script helps test the dynamic metadata implementation

param(
    [string]$BaseUrl = "https://droplink.space",
    [string]$TestUsername = "testuser"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Droplink Dynamic OG Metadata Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Test Username: $TestUsername" -ForegroundColor Yellow
Write-Host ""

# Helper function to check for text in response
function Test-MetaTag {
    param(
        [string]$Html,
        [string]$Pattern,
        [string]$TagName
    )
    
    if ($Html -match $Pattern) {
        Write-Host "✓ Found $TagName tag" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Missing $TagName tag" -ForegroundColor Red
        return $false
    }
}

# Test 1: Direct HTML endpoint
Write-Host "Test 1: Fetching profile HTML..." -ForegroundColor Yellow
$Url = "$BaseUrl/@$TestUsername"
Write-Host "URL: $Url"

try {
    $Response = Invoke-WebRequest -Uri $Url -ErrorAction Stop
    $Html = $Response.Content
    $StatusCode = $Response.StatusCode
    
    Write-Host "HTTP Status: $StatusCode" -ForegroundColor Green
    
    Test-MetaTag -Html $Html -Pattern 'property="og:title"' -TagName "og:title"
    Test-MetaTag -Html $Html -Pattern 'property="og:image"' -TagName "og:image"
    Test-MetaTag -Html $Html -Pattern 'name="twitter:card"' -TagName "twitter:card"
    Test-MetaTag -Html $Html -Pattern 'property="og:description"' -TagName "og:description"
    Test-MetaTag -Html $Html -Pattern 'name="twitter:image"' -TagName "twitter:image"
} catch {
    Write-Host "Error fetching profile: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: API endpoint
Write-Host "Test 2: Fetching metadata via API..." -ForegroundColor Yellow
$ApiUrl = "$BaseUrl/api/metadata/$TestUsername"
Write-Host "URL: $ApiUrl"

try {
    $ApiResponse = Invoke-WebRequest -Uri $ApiUrl -ErrorAction Stop
    $Metadata = $ApiResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ API request successful" -ForegroundColor Green
    
    if ($Metadata.title) { Write-Host "✓ Title: $($Metadata.title)" -ForegroundColor Green }
    if ($Metadata.description) { Write-Host "✓ Description: $($Metadata.description.Substring(0, [Math]::Min(50, $Metadata.description.Length)))..." -ForegroundColor Green }
    if ($Metadata.ogImage) { Write-Host "✓ OG Image: $($Metadata.ogImage)" -ForegroundColor Green }
    if ($Metadata.username) { Write-Host "✓ Username: $($Metadata.username)" -ForegroundColor Green }
    
    Write-Host ""
    Write-Host "Full API Response:" -ForegroundColor Yellow
    $Metadata | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Error fetching metadata API: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Invalid username
Write-Host "Test 3: Testing invalid username format..." -ForegroundColor Yellow
$InvalidUrl = "$BaseUrl/@!!!invalid"

try {
    $InvalidResponse = Invoke-WebRequest -Uri $InvalidUrl -ErrorAction SilentlyContinue
    Write-Host "Status: $($InvalidResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Non-existent user
Write-Host "Test 4: Testing non-existent user..." -ForegroundColor Yellow
$NotFoundUrl = "$BaseUrl/@nonexistentuser123456789"

try {
    $NotFoundResponse = Invoke-WebRequest -Uri $NotFoundUrl -ErrorAction SilentlyContinue
    if ($NotFoundResponse.Content -match "Profile Not Found") {
        Write-Host "✓ Returns proper not found message" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing not found message" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Extract and display meta tags
Write-Host "Test 5: Key Meta Tags Found:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open Graph Tags:" -ForegroundColor Cyan

$OgMatches = [regex]::Matches($Html, 'property="og:([^"]+)" content="([^"]*)"')
foreach ($Match in $OgMatches | Select-Object -First 5) {
    $Property = $Match.Groups[1].Value
    $Content = $Match.Groups[2].Value.Substring(0, [Math]::Min(60, $Match.Groups[2].Value.Length))
    Write-Host "  og:$Property = $Content..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Twitter Tags:" -ForegroundColor Cyan

$TwitterMatches = [regex]::Matches($Html, 'name="twitter:([^"]+)" content="([^"]*)"')
foreach ($Match in $TwitterMatches | Select-Object -First 5) {
    $Property = $Match.Groups[1].Value
    $Content = $Match.Groups[2].Value.Substring(0, [Math]::Min(60, $Match.Groups[2].Value.Length))
    Write-Host "  twitter:$Property = $Content..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Test Summary Complete" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps - Test with real social platforms:" -ForegroundColor Yellow
Write-Host "1. Facebook: https://developers.facebook.com/tools/debug/" -ForegroundColor White
Write-Host "2. Twitter:  https://cards-dev.twitter.com/validator" -ForegroundColor White
Write-Host "3. Telegram: Paste URL in chat preview" -ForegroundColor White
Write-Host "4. LinkedIn: Post URL and check preview" -ForegroundColor White
Write-Host ""
