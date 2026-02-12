@echo off
REM Supabase Schema Deployment Helper for Windows

echo.
echo ========================================
echo Supabase Schema Deployment
echo ========================================
echo.

REM Check if SQL file exists
if not exist "supabase\full_user_data_schema.sql" (
    echo ERROR: SQL file not found at supabase\full_user_data_schema.sql
    pause
    exit /b 1
)

echo Your Supabase Project Info:
echo Supabase URL: https://idkjfuctyukspexmijvb.supabase.co
echo Project ID: idkjfuctyukspexmijvb
echo.

echo.
echo Choose deployment method:
echo.
echo 1. Manual Deploy (Copy/Paste to Supabase Dashboard)
echo 2. View Deployment Guide
echo 3. Show SQL Content
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Opening Supabase SQL Editor...
    start https://supabase.com/dashboard/project/idkjfuctyukspexmijvb/sql
    echo.
    echo Instructions:
    echo 1. The Supabase dashboard opened in your browser
    echo 2. Click "New Query" button
    echo 3. Copy the SQL from: supabase\full_user_data_schema.sql
    echo 4. Paste it into the query editor
    echo 5. Click "RUN" button
    echo.
    pause
)

if "%choice%"=="2" (
    echo.
    start notepad DEPLOY_SCHEMA_GUIDE.md
    pause
)

if "%choice%"=="3" (
    echo.
    type supabase\full_user_data_schema.sql
    echo.
    pause
)

if "%choice%"=="4" (
    exit /b 0
)
