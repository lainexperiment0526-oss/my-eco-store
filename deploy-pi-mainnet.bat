@echo off
REM =====================================================
REM Pi Network Mainnet Database Deployment Script (Windows)
REM Quick deployment for Supabase
REM =====================================================

echo.
echo ======================================
echo Pi Network Mainnet Database Deployment
echo ======================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Supabase CLI not found
    echo Install it with: npm install -g supabase
    exit /b 1
)

echo [OK] Supabase CLI found
echo.

REM Check if we're in the right directory
if not exist "supabase\migrations\20251208000000_pi_mainnet_complete_integration.sql" (
    echo [ERROR] Migration file not found
    echo Please run this script from the project root directory
    exit /b 1
)

echo [OK] Migration file found
echo.

REM Show configuration
echo Configuration:
echo   Network: Pi Network Mainnet
echo   API Key: 96tnxytg82pev...m5
echo   Environment: Production
echo.

REM Confirm deployment
set /p confirm="Do you want to proceed with deployment? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo.
    echo [WARNING] Deployment cancelled
    exit /b 0
)

echo.
echo Applying migration...
echo.

REM Apply the migration
call npx supabase db push

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Migration applied successfully!
    echo.
    
    REM Ask if user wants to run verification
    set /p verify="Do you want to run the verification script? (yes/no): "
    
    if /i "%verify%"=="yes" (
        echo.
        echo Running verification...
        echo.
        
        REM Note: Verification script needs to be run manually in SQL Editor
        echo [INFO] Please run the verification script manually:
        echo   1. Open Supabase Dashboard - SQL Editor
        echo   2. Copy contents of: supabase\migrations\20251208000001_verify_pi_mainnet.sql
        echo   3. Paste and execute
        echo   4. Review the results
    )
    
    echo.
    echo Next Steps:
    echo   1. Run verification script (if not done^)
    echo   2. Test Pi authentication
    echo   3. Record a test transaction
    echo   4. Monitor Supabase logs
    echo.
    echo [SUCCESS] Deployment Complete!
    echo.
    echo Documentation:
    echo   - Deployment Guide: PI_MAINNET_DATABASE_DEPLOYMENT.md
    echo   - SQL Reference: PI_MAINNET_SQL_REFERENCE.md
    echo   - Complete Summary: PI_MAINNET_COMPLETE_SUMMARY.md
    
) else (
    echo.
    echo [ERROR] Migration failed
    echo Please check the error messages above and try again
    echo.
    echo Troubleshooting:
    echo   1. Check database connection
    echo   2. Verify Supabase CLI is configured
    echo   3. Ensure you have database permissions
    echo   4. Review migration file syntax
    exit /b 1
)

echo.
pause
