@echo off
cls
echo ========================================
echo   FIX SUBSCRIPTION ACTIVATION
echo ========================================
echo.
echo This will open Supabase SQL Editor so you can apply the fix.
echo.
echo 1. Copy the SQL from: supabase/migrations/20260207143000_fix_subscription_unique_constraint.sql
echo 2. Paste it into Supabase SQL Editor
echo 3. Click RUN button
echo.
echo Press any key to open Supabase...
pause >nul

start https://supabase.com/dashboard/project/_/sql/new

echo.
echo ========================================
echo   INSTRUCTIONS:
echo ========================================
echo.
echo 1. Open the file "supabase/migrations/20260207143000_fix_subscription_unique_constraint.sql" in VS Code.
echo 2. Copy ALL its content.
echo 3. Paste into the Supabase SQL Editor in your browser.
echo 4. Click RUN.
echo.
echo This adds a UNIQUE constraint to the subscriptions table,
echo which fixes the issue where subscriptions weren't saving correctly.
echo.
pause
