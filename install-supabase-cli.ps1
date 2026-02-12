# Install Supabase CLI on Windows
Write-Host "🔧 Installing Supabase CLI..." -ForegroundColor Cyan

$version = "v2.9.2"  # Latest stable as of Dec 2025
$arch = if ([Environment]::Is64BitOperatingSystem) { "windows-amd64" } else { "windows-386" }
$url = "https://github.com/supabase/cli/releases/download/$version/supabase_$($version)_$arch.zip"
$tempZip = "$env:TEMP\supabase-cli.zip"
$installDir = "$env:LOCALAPPDATA\Programs\Supabase"

try {
    # Download
    Write-Host "⬇️  Downloading from GitHub..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $tempZip -UseBasicParsing
    
    # Extract
    Write-Host "📦 Extracting..." -ForegroundColor Yellow
    if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
    
    # Add to PATH for current session
    $env:PATH += ";$installDir"
    
    # Add to user PATH permanently
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
        Write-Host "✅ Added to PATH (restart terminal to persist)" -ForegroundColor Green
    }
    
    # Cleanup
    Remove-Item $tempZip -Force
    
    # Verify
    Write-Host "`n✅ Supabase CLI installed successfully!" -ForegroundColor Green
    & "$installDir\supabase.exe" --version
    Write-Host "`n💡 Run in a NEW terminal or reload PATH:" -ForegroundColor Cyan
    Write-Host "   `$env:PATH += ';$installDir'" -ForegroundColor White
    
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    Write-Host "Manual install: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    exit 1
}
