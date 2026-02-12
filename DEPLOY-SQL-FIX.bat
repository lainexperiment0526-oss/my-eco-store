@echo off
cls
echo ========================================
echo   FIX FOLLOW BUTTON - DEPLOY SQL NOW
echo ========================================
echo.
echo This will open Supabase SQL Editor
echo Then you need to:
echo.
echo 1. Copy the SQL from: FIX_NOTIFICATIONS_FOLLOW_NOW.sql
echo 2. Paste it into Supabase SQL Editor
echo 3. Click RUN button
echo.
echo Press any key to open Supabase...
pause >nul

start https://supabase.com/dashboard/project/idkjfuctyukspexmijvb/sql/new

echo.
echo ========================================
echo   NOW DO THIS:
echo ========================================
echo.
echo 1. In Supabase SQL Editor (opened in browser):
echo    - You'll see an empty query editor
echo.
echo 2. Open: FIX_NOTIFICATIONS_FOLLOW_NOW.sql
echo    - Press Ctrl+A to select all
echo    - Press Ctrl+C to copy
echo.
echo 3. Back in Supabase:
echo    - Press Ctrl+V to paste
echo    - Click the RUN button (bottom right, green)
echo.
echo 4. Wait for success message:
echo    - You should see: "SUCCESS: payload column exists"
echo.
echo 5. Test your app:
echo    - Go to /search-users
echo    - Click Follow button
echo    - Should work now!
echo.
echo ========================================
pause
