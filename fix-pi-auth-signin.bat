@echo off
REM Fix Pi Authentication Sign-In Issues
REM This script deploys the RLS policy fix to Supabase

echo.
echo ============================================
echo Pi Authentication RLS Fix Deployment
echo ============================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase CLI not found!
    echo Please install it from: https://supabase.com/docs/guides/cli/getting-started
    echo.
    pause
    exit /b 1
)

REM Get project ID from environment or user input
if not defined SUPABASE_PROJECT_ID (
    echo Please enter your Supabase Project ID (from dashboard URL):
    set /p SUPABASE_PROJECT_ID=
)

if not defined SUPABASE_DB_PASSWORD (
    echo Please enter your Supabase Database Password:
    set /p SUPABASE_DB_PASSWORD=
)

echo.
echo Step 1: Connecting to Supabase database...
echo Project: %SUPABASE_PROJECT_ID%
echo.

REM Run the fix SQL
echo Step 2: Deploying RLS policy fixes...
echo.

supabase db push FIX_PI_AUTH_RLS_COMPLETE.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! RLS policies have been fixed!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Try signing in with Pi Network
    echo 2. Check browser console for success logs
    echo 3. Verify in Supabase Dashboard
    echo.
    echo Documentation: PI_AUTH_SIGNIN_FIX_GUIDE.md
    echo.
) else (
    echo.
    echo ERROR: Failed to deploy fix
    echo.
    echo Try manual deployment:
    echo 1. Go to Supabase Dashboard
    echo 2. Open SQL Editor
    echo 3. Create new query
    echo 4. Copy contents of FIX_PI_AUTH_RLS_COMPLETE.sql
    echo 5. Run the query
    echo.
    pause
)
