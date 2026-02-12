#!/usr/bin/env pwsh
# Simple Supabase Env Setup - No fancy parsing, just load .env and set secrets
# Run this after: supabase login

Write-Host "🚀 Setting up Supabase secrets from .env" -ForegroundColor Cyan
Write-Host ""

# Check Supabase CLI
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    exit 1
}

# Simple .env loader - read each line and split on =
$env_vars = @{}
if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object {
        $parts = $_ -split "=", 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim() -replace '^"|"$', ''
            $env_vars[$key] = $value
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✅ Loaded .env" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

$PROJECT_ID = $env_vars['VITE_SUPABASE_PROJECT_ID']
$SUPABASE_URL = $env_vars['SUPABASE_URL']
$SUPABASE_SERVICE_ROLE_KEY = $env_vars['SUPABASE_SERVICE_ROLE_KEY']
$PI_API_KEY = $env_vars['PI_API_KEY']

if (!$PROJECT_ID -or !$SUPABASE_URL -or !$SUPABASE_SERVICE_ROLE_KEY -or !$PI_API_KEY) {
    Write-Host "❌ Missing required env vars" -ForegroundColor Red
    Write-Host "   Need: VITE_SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PI_API_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Step 1: Link Supabase project" -ForegroundColor Cyan
supabase link --project-ref $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Link may have failed or already linked" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 2: Set secrets in Supabase" -ForegroundColor Cyan
Write-Host ""

Write-Host "  → Setting SUPABASE_URL..." -ForegroundColor Gray
supabase secrets set SUPABASE_URL=$SUPABASE_URL
Write-Host "  → Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Gray
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
Write-Host "  → Setting PI_API_KEY..." -ForegroundColor Gray
supabase secrets set PI_API_KEY=$PI_API_KEY

Write-Host ""
Write-Host "✅ Secrets configured" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 3: Verify secrets" -ForegroundColor Cyan
supabase secrets list
Write-Host ""

Write-Host "✅ Setup complete! Run deploy-edge-functions.ps1 next." -ForegroundColor Green
