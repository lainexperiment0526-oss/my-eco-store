# ============================================
# Vercel Production Deployment Script
# DropLink Pi Network Mainnet
# ============================================

Write-Host "🚀 Vercel Production Deployment for DropLink" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
$currentDir = Get-Location
Write-Host "📁 Current directory: $currentDir" -ForegroundColor Gray

# Step 2: Install dependencies
Write-Host ""
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 3: Build production version
Write-Host ""
Write-Host "🏗️ Step 2: Building production version..." -ForegroundColor Yellow
npm run build:mainnet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Production build complete" -ForegroundColor Green

# Step 4: Check if Vercel CLI is installed
Write-Host ""
Write-Host "📋 Step 3: Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = & vercel --version 2>&1
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Vercel CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g vercel" -ForegroundColor White
    Write-Host ""
    $install = Read-Host "Install now? (y/n)"
    if ($install -eq "y") {
        npm install -g vercel
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Vercel CLI installation failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
    } else {
        exit 1
    }
}

# Step 5: Login to Vercel
Write-Host ""
Write-Host "📋 Step 4: Vercel Login..." -ForegroundColor Yellow
Write-Host "Checking Vercel authentication..." -ForegroundColor Gray

try {
    & vercel whoami 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $user = & vercel whoami
        Write-Host "✅ Already logged in as: $user" -ForegroundColor Green
    } else {
        Write-Host "Logging into Vercel..." -ForegroundColor Cyan
        & vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Vercel login failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Successfully logged in" -ForegroundColor Green
    }
} catch {
    Write-Host "Logging into Vercel..." -ForegroundColor Cyan
    & vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Vercel login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Successfully logged in" -ForegroundColor Green
}

# Step 6: Display deployment confirmation
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📋 Production Deployment Summary" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: MAINNET (Production)" -ForegroundColor White
Write-Host "Features:" -ForegroundColor White
Write-Host "  ✅ Pi Authentication (Mainnet)" -ForegroundColor Green
Write-Host "  ✅ Pi Payments (Real transactions)" -ForegroundColor Green
Write-Host "  ✅ Pi Ad Network (Enabled)" -ForegroundColor Green
Write-Host "  ✅ Supabase Backend" -ForegroundColor Green
Write-Host "  ✅ DROP Token Support" -ForegroundColor Green
Write-Host ""
Write-Host "Sandbox Mode: DISABLED" -ForegroundColor Red
Write-Host "Debug Mode: DISABLED" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️ WARNING: This will deploy to PRODUCTION" -ForegroundColor Yellow
Write-Host "⚠️ Real Pi coins will be used in transactions" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with production deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Step 7: Deploy to Vercel
Write-Host ""
Write-Host "🚀 Step 5: Deploying to Vercel Production..." -ForegroundColor Yellow
Write-Host ""

& vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check Vercel Dashboard for deployment URL" -ForegroundColor White
Write-Host "  2. Verify Pi SDK loads correctly" -ForegroundColor White
Write-Host "  3. Test Pi Authentication" -ForegroundColor White
Write-Host "  4. Test Pi Payment (small amount)" -ForegroundColor White
Write-Host "  5. Test Pi Ad Network" -ForegroundColor White
Write-Host "  6. Monitor Supabase Edge Function logs" -ForegroundColor White
Write-Host ""
Write-Host "📊 Important Links:" -ForegroundColor Yellow
Write-Host "  Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "  Supabase Dashboard: https://supabase.com/dashboard/project/idkjfuctyukspexmijvb" -ForegroundColor Cyan
Write-Host "  Production URL: https://droplink.space" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
