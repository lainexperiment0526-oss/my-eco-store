@echo off
echo ========================================
echo FIXING NOTIFICATIONS FOLLOW FEATURE
echo ========================================
echo.
echo This will fix the error:
echo "column payload of relation notifications does not exist"
echo.
echo MANUAL DEPLOYMENT REQUIRED:
echo.
echo 1. Go to Supabase Dashboard SQL Editor:
echo    https://supabase.com/dashboard/project/idkjfuctyukspexmijvb/sql
echo.
echo 2. Click "New Query" button
echo.
echo 3. Copy ALL contents from this file:
echo    FIX_NOTIFICATIONS_FOLLOW_NOW.sql
echo.
echo 4. Paste into SQL Editor
echo.
echo 5. Click "Run" button (or press Ctrl+Enter)
echo.
echo 6. Wait for success message
echo.
echo 7. Test follow functionality in your app
echo.
echo ========================================
echo.
echo Opening SQL file in notepad...
notepad FIX_NOTIFICATIONS_FOLLOW_NOW.sql
echo.
echo Opening Supabase Dashboard in browser...
start https://supabase.com/dashboard/project/idkjfuctyukspexmijvb/sql
echo.
echo ========================================
echo READY TO DEPLOY
echo ========================================
echo.
echo After running the SQL:
echo  - Follow button will work in Search Users
echo  - Follow button will work in Public Profiles  
echo  - No more "payload" column errors
echo.
pause
