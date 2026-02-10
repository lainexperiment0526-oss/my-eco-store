# Deploy Script for Windows
Write-Host "Starting deployment process..." -ForegroundColor Cyan

# Add all changes
Write-Host "Adding changes..."
git add .

# Commit changes
$commitMsg = Read-Host "Enter commit message (press Enter for default 'Update')"
if ([string]::IsNullOrWhiteSpace($commitMsg)) { 
    $commitMsg = "Update" 
}

try {
    git commit -m "$commitMsg"
} catch {
    Write-Host "Nothing to commit or commit failed." -ForegroundColor Yellow
}

# Push to GitHub
Write-Host "Pushing to GitHub..."
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "If your Vercel project is connected to this repository, a new deployment has been triggered." -ForegroundColor Cyan
} else {
    Write-Host "Push failed. Please check your connection or conflicts." -ForegroundColor Red
}
