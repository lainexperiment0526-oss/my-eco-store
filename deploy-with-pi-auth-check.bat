@echo off
REM ============================================================================
REM Droplink Deployment Script with Pi Authentication Verification
REM ============================================================================
REM 
REM This script ensures Pi authentication works reliably every deployment
REM by verifying database schema and refreshing Supabase cache
REM
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo 🚀 Droplink Deployment with Pi Auth Verification
echo ============================================================================
echo.

REM Step 1: Verify Node.js and npm are available
echo 📋 Checking dependencies...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm not found! Please install Node.js
    exit /b 1
)
echo ✅ npm found

REM Step 2: Build the application
echo.
echo 📦 Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful

REM Step 3: Display Supabase setup instructions
echo.
echo ============================================================================
echo ⚠️  IMPORTANT - Manual Supabase Setup Required
echo ============================================================================
echo.
echo Before deploying, you must complete these steps in Supabase:
echo.
echo 1. Open Supabase Dashboard
echo    https://supabase.com/dashboard
echo.
echo 2. Select your droplink-testnet project
echo.
echo 3. Go to Database ^> SQL Editor (top left)
echo.
echo 4. Create a NEW QUERY and paste the entire content from:
echo    FILE: verify-pi-auth-schema.sql (located in project root)
echo.
echo 5. Click "RUN" button to execute the script
echo    (Wait for all checks to complete - should see green checkmarks)
echo.
echo 6. Verify the output shows:
echo    ✅ All Pi auth columns verified successfully!
echo    ✅ authenticate_pi_user_safe function created successfully!
echo    🔄 Schema cache refresh notification sent to PostgREST
echo.
echo 7. Wait 30-60 seconds for schema cache to refresh in Supabase
echo    (This is critical - do not skip this step!)
echo.
echo ============================================================================
echo.
pause

REM Step 4: Deploy to production
echo 🌐 Deploying to production...
echo.

REM Check if using Vercel
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Vercel CLI not installed. Installing globally...
    call npm install -g vercel
)

REM Deploy with Vercel
call npx vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo ✅ DEPLOYMENT SUCCESSFUL!
echo ============================================================================
echo.
echo 🧪 Next Steps - Verify Pi Authentication:
echo.
echo 1. Visit your deployed site:
echo    https://droplink.space/auth (or your domain)
echo.
echo 2. Click "Sign in with Pi Network" button
echo.
echo 3. Complete the Pi Network authentication flow
echo.
echo 4. Check browser console (F12 ^> Console tab):
echo    - Should NOT see "Could not find column" errors
echo    - Should see successful authentication messages
echo.
echo 5. Verify in Supabase that user profile was created:
echo    - Go to Supabase ^> Database ^> profiles table
echo    - Look for new row with pi_username
echo    - Check pi_user_id, pi_wallet_address fields are populated
echo.
echo ============================================================================
echo.
echo 📝 TROUBLESHOOTING:
echo.
echo If you see "Could not find column" error:
echo    1. Go back to Supabase SQL Editor
echo    2. Run: NOTIFY pgrst, 'reload schema';
echo    3. Wait 30 seconds
echo    4. Clear browser cache (Ctrl+Shift+Delete)
echo    5. Reload the page
echo.
echo If Pi login still fails:
echo    1. Check Supabase logs (Database ^> Logs)
echo    2. Verify all columns exist (see verify-pi-auth-schema.sql)
echo    3. Ensure authenticate_pi_user_safe function exists
echo.
echo ============================================================================
echo.

pause
