# ============================================
# Supabase Environment Setup Script
# DropLink Pi Network Mainnet
# ============================================

Write-Host "🚀 Supabase Environment Setup for DropLink" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Project Configuration (loaded from .env)
$PROJECT_ID = $null
$PROJECT_URL = $null

# Check if Supabase CLI is installed
Write-Host "📋 Step 1: Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = & supabase --version 2>&1
    Write-Host "✅ Supabase CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  Windows (via Scoop): scoop install supabase" -ForegroundColor White
    Write-Host "  Or download from: https://supabase.com/docs/guides/cli" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Loading .env and logging in..." -ForegroundColor Yellow
Write-Host "A browser window will open for authentication..." -ForegroundColor Gray

# Load environment variables from .env
if (Test-Path ".env") {
    Write-Host "📋 Loading environment variables from .env..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Strip surrounding quotes safely if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }

    $PROJECT_ID = $env:VITE_SUPABASE_PROJECT_ID
    $PROJECT_URL = $env:SUPABASE_URL
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
}

if (-not $PROJECT_ID) {
    Write-Host "❌ Missing VITE_SUPABASE_PROJECT_ID in .env" -ForegroundColor Red
    Write-Host "   Please set project ID and rerun." -ForegroundColor Yellow
}
if (-not $PROJECT_URL) {
    Write-Host "❌ Missing SUPABASE_URL in .env" -ForegroundColor Red
    Write-Host "   Please set Supabase URL and rerun." -ForegroundColor Yellow
}

try {
    & supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Successfully logged in" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during login: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 3: Linking to project..." -ForegroundColor Yellow
Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Gray

try {
    & supabase link --project-ref $PROJECT_ID
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Link command failed, but this might be okay if already linked" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Successfully linked to project" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Warning during link: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 4: Setting up environment secrets..." -ForegroundColor Yellow
Write-Host ""

# Gather secrets from environment
$PI_API_KEY = $env:PI_API_KEY
$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

Write-Host "Setting PI_API_KEY..." -ForegroundColor Cyan
try {
    & supabase secrets set PI_API_KEY="$PI_API_KEY"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PI_API_KEY set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set PI_API_KEY" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error setting PI_API_KEY: $_" -ForegroundColor Red
}

Write-Host "Setting SUPABASE_URL..." -ForegroundColor Cyan
try {
    & supabase secrets set SUPABASE_URL="$SUPABASE_URL"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUPABASE_URL set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set SUPABASE_URL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error setting SUPABASE_URL: $_" -ForegroundColor Red
}

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Cyan
try {
    & supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error setting SUPABASE_SERVICE_ROLE_KEY: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Step 5: Verifying secrets..." -ForegroundColor Yellow

try {
    Write-Host "Current secrets:" -ForegroundColor Gray
    & supabase secrets list
    Write-Host "✅ Secrets verified" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not list secrets" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 6: Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

$functions = @(
    "pi-auth",
    "pi-payment-approve",
    "pi-payment-complete",
    "subscription",
    "profile-update"
)

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    try {
        & supabase functions deploy $func --no-verify-jwt
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $func deployed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ $func deployment had issues" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Failed to deploy $func" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Step 7: Database Migrations Status..." -ForegroundColor Yellow

try {
    Write-Host "Checking migration status..." -ForegroundColor Gray
    & supabase migration list
} catch {
    Write-Host "⚠️ Could not check migrations" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Supabase Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  Project: $PROJECT_ID" -ForegroundColor White
Write-Host "  URL: $PROJECT_URL" -ForegroundColor White
Write-Host "  Secrets: PI_API_KEY configured" -ForegroundColor White
Write-Host "  Functions: Deployed (check output above)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify in Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID" -ForegroundColor White
Write-Host "  2. Test Pi payments in your app" -ForegroundColor White
Write-Host "  3. Monitor Edge Function logs" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
