@echo off
REM Droplink Database Setup Script for Windows
echo 🗄️ Setting up Droplink database schema...
echo.

echo 📋 Database Schema Required:
echo    - profiles (main user profiles)
echo    - products (digital products)
echo    - followers (user relationships)  
echo    - analytics (tracking data)
echo    - subscriptions (premium plans)
echo    - And more...
echo.

echo 🔧 Manual Setup Required:
echo 1. Go to Supabase Dashboard: https://app.supabase.com/
echo 2. Select your project: idkjfuctyukspexmijvb
echo 3. Go to 'SQL Editor'
echo 4. Run the SQL file: supabase\migrations\20251118000001_complete_database_schema.sql
echo.

echo 📝 Quick Setup SQL (copy to Supabase SQL Editor):
echo ----------------------------------------------------------------------
echo -- Complete Droplink Database Schema
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo.
echo -- Create profiles table
echo CREATE TABLE IF NOT EXISTS public.profiles (
echo     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
echo     username TEXT UNIQUE NOT NULL,
echo     pi_user_id TEXT,
echo     business_name TEXT NOT NULL DEFAULT '',
echo     email TEXT DEFAULT '',
echo     description TEXT DEFAULT '',
echo     has_premium BOOLEAN DEFAULT false,
echo     pi_wallet_address TEXT DEFAULT ''
echo );
echo.
echo -- Enable RLS and create permissive policies
echo ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
echo CREATE POLICY "Public access" ON public.profiles FOR ALL USING (true);
echo GRANT ALL ON public.profiles TO anon, authenticated;
echo ----------------------------------------------------------------------
echo.

echo ✅ After running the SQL:
echo 1. Refresh your Droplink app
echo 2. Try Pi authentication again  
echo 3. Profile creation should work!
echo.

echo 🌐 Database Info:
echo URL: https://idkjfuctyukspexmijvb.supabase.co
echo Project: idkjfuctyukspexmijvb
echo.

pause