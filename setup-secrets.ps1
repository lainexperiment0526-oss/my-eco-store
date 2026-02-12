#!/usr/bin/env pwsh
# Simple Supabase Env Setup - Load .env and set secrets

Write-Host "Supabase Setup: Load .env, link, set secrets"
Write-Host ""

# Check Supabase CLI
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found" -ForegroundColor Red
    exit 1
}

# Simple .env loader
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
    Write-Host "OK: Loaded .env" -ForegroundColor Green
} else {
    Write-Host "ERROR: .env not found" -ForegroundColor Red
    exit 1
}

$PROJECT_ID = $env_vars['VITE_SUPABASE_PROJECT_ID']
$SUPABASE_URL = $env_vars['SUPABASE_URL']
$SUPABASE_SERVICE_ROLE_KEY = $env_vars['SUPABASE_SERVICE_ROLE_KEY']
$PI_API_KEY = $env_vars['PI_API_KEY']

if (!$PROJECT_ID -or !$SUPABASE_URL -or !$SUPABASE_SERVICE_ROLE_KEY -or !$PI_API_KEY) {
    Write-Host "ERROR: Missing required env vars" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Linking project: $PROJECT_ID" -ForegroundColor Cyan
supabase link --project-ref $PROJECT_ID

Write-Host ""
Write-Host "Setting secrets..." -ForegroundColor Cyan
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
supabase secrets set PI_API_KEY="$PI_API_KEY"

Write-Host ""
Write-Host "Verifying secrets..." -ForegroundColor Cyan
supabase secrets list

Write-Host ""
Write-Host "OK: Setup complete" -ForegroundColor Green
