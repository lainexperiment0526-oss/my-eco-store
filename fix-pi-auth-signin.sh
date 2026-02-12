#!/bin/bash
# Pi Authentication Sign-In Fix - Deployment Script
# For Mac/Linux systems

echo ""
echo "============================================"
echo "Pi Authentication RLS Fix Deployment"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI not found!"
    echo "Please install it from: https://supabase.com/docs/guides/cli/getting-started"
    echo ""
    exit 1
fi

# Get project ID if not set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Please enter your Supabase Project ID (from dashboard URL):"
    read SUPABASE_PROJECT_ID
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Please enter your Supabase Database Password:"
    read -s SUPABASE_DB_PASSWORD
fi

echo ""
echo "Step 1: Connecting to Supabase database..."
echo "Project: $SUPABASE_PROJECT_ID"
echo ""

# Run the fix SQL
echo "Step 2: Deploying RLS policy fixes..."
echo ""

supabase db push FIX_PI_AUTH_RLS_COMPLETE.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "SUCCESS! RLS policies have been fixed!"
    echo "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Try signing in with Pi Network"
    echo "2. Check browser console for success logs"
    echo "3. Verify in Supabase Dashboard"
    echo ""
    echo "Documentation: PI_AUTH_SIGNIN_FIX_GUIDE.md"
    echo ""
else
    echo ""
    echo "ERROR: Failed to deploy fix"
    echo ""
    echo "Try manual deployment:"
    echo "1. Go to Supabase Dashboard"
    echo "2. Open SQL Editor"
    echo "3. Create new query"
    echo "4. Copy contents of FIX_PI_AUTH_RLS_COMPLETE.sql"
    echo "5. Run the query"
    echo ""
fi
