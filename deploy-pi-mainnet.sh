#!/bin/bash

# =====================================================
# Pi Network Mainnet Database Deployment Script
# Quick deployment for Supabase
# =====================================================

echo "🚀 Pi Network Mainnet Database Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251208000000_pi_mainnet_complete_integration.sql" ]; then
    echo -e "${RED}❌ Migration file not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✅ Migration file found${NC}"
echo ""

# Show configuration
echo "📋 Configuration:"
echo "  Network: Pi Network Mainnet"
echo "  API Key: 96tnxytg82pev...m5"
echo "  Environment: Production"
echo ""

# Confirm deployment
read -p "Do you want to proceed with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply the migration
npx supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo ""
    
    # Ask if user wants to run verification
    read -p "Do you want to run the verification script? (yes/no): " verify
    
    if [ "$verify" == "yes" ]; then
        echo ""
        echo "🔍 Running verification..."
        echo ""
        
        # Note: Verification script needs to be run manually in SQL Editor
        echo -e "${YELLOW}ℹ️  Please run the verification script manually:${NC}"
        echo "   1. Open Supabase Dashboard → SQL Editor"
        echo "   2. Copy contents of: supabase/migrations/20251208000001_verify_pi_mainnet.sql"
        echo "   3. Paste and execute"
        echo "   4. Review the results"
    fi
    
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Run verification script (if not done)"
    echo "  2. Test Pi authentication"
    echo "  3. Record a test transaction"
    echo "  4. Monitor Supabase logs"
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo "📖 Documentation:"
    echo "  - Deployment Guide: PI_MAINNET_DATABASE_DEPLOYMENT.md"
    echo "  - SQL Reference: PI_MAINNET_SQL_REFERENCE.md"
    echo "  - Complete Summary: PI_MAINNET_COMPLETE_SUMMARY.md"
    
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Please check the error messages above and try again"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check database connection"
    echo "  2. Verify Supabase CLI is configured"
    echo "  3. Ensure you have database permissions"
    echo "  4. Review migration file syntax"
    exit 1
fi

echo ""
