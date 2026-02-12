#!/bin/bash

# Droplink Database Setup Script
# This script sets up the complete database schema for Droplink

echo "🗄️  Setting up Droplink database schema..."

# Database connection details
SUPABASE_URL="https://idkjfuctyukspexmijvb.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiss3MiOiJzdXBhYmFzZSIsInJlZiI6Imlka2pmdWN0eXVrc3BleG1panZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjI0NzMsImV4cCI6MjA3OTAzODQ3M30.dIJlRYAnSgj2Ohsl6tqz_cP9Zg03HG6naYTGXoAjkDs"

echo "📋 Database Schema Required:"
echo "   - profiles (main user profiles)"
echo "   - products (digital products)"  
echo "   - followers (user relationships)"
echo "   - analytics (tracking data)"
echo "   - subscriptions (premium plans)"
echo "   - gifts (Pi Network gifts)"
echo "   - notifications (user alerts)"
echo "   - custom_domains (domain mapping)"
echo "   - And more..."
echo ""

echo "🔧 Manual Setup Required:"
echo "1. Go to Supabase Dashboard: https://app.supabase.com/"
echo "2. Select your project: idkjfuctyukspexmijvb"
echo "3. Go to 'SQL Editor'"
echo "4. Run the SQL file: supabase/migrations/20251118000001_complete_database_schema.sql"
echo ""

echo "📝 Alternatively, copy and paste this SQL into Supabase SQL Editor:"
echo "----------------------------------------------------------------------"

cat << 'EOF'
-- Complete Droplink Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    pi_user_id TEXT,
    business_name TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    social_links JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{"primaryColor": "#3b82f6", "backgroundColor": "#000000", "iconStyle": "rounded", "buttonStyle": "filled", "customLinks": []}',
    has_premium BOOLEAN DEFAULT false,
    show_share_button BOOLEAN DEFAULT true,
    pi_wallet_address TEXT DEFAULT '',
    pi_donation_message TEXT DEFAULT 'Send me a coffee ☕',
    crypto_wallets JSONB DEFAULT '{"wallets": []}',
    bank_details JSONB DEFAULT '{"accounts": []}',
    youtube_video_url TEXT DEFAULT ''
);

-- Create other essential tables
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT NOT NULL DEFAULT '0',
    file_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_agent TEXT DEFAULT ''
);

-- Enable RLS and create permissive policies for development
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
CREATE POLICY "Public access for profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public access for products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public access for analytics" ON public.analytics FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.analytics TO anon, authenticated;
EOF

echo "----------------------------------------------------------------------"
echo ""

echo "✅ After running the SQL:"
echo "1. Refresh your Droplink app: http://localhost:8084"
echo "2. Try Pi authentication again"
echo "3. Profile creation should now work!"
echo ""

echo "🚀 Your Droplink database will be ready for:"
echo "   ✅ Pi Network authentication"
echo "   ✅ Profile creation and management"  
echo "   ✅ Product listings and sales"
echo "   ✅ Analytics and tracking"
echo "   ✅ Social features and following"
echo "   ✅ Premium subscriptions"
echo ""

echo "📞 Need Help?"
echo "   - Check Supabase logs for errors"
echo "   - Verify API keys are correct"
echo "   - Ensure RLS policies are set properly"