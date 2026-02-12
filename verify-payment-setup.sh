#!/bin/bash
# =====================================================================
# PAYMENT SYSTEM VERIFICATION SCRIPT
# =====================================================================
# Use this script to verify your payment system configuration
# Run: bash verify-payment-setup.sh
# =====================================================================

echo "🔍 DropLink Payment System Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅${NC} Found .env.local file"
else
    echo -e "${YELLOW}⚠️${NC} No .env.local file found"
    echo "   Copy from .env.payment-example and fill in your values"
fi

echo ""
echo "Checking Environment Variables..."
echo "================================="

# Function to check env var
check_env() {
    local var_name=$1
    local var_value=${!var_name}
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌${NC} $var_name - NOT SET"
        return 1
    else
        # Show only first and last 10 chars for security
        local display="${var_value:0:10}...${var_value: -10}"
        echo -e "${GREEN}✅${NC} $var_name - SET ($display)"
        return 0
    fi
}

# Check DropPay vars
echo ""
echo "DropPay Configuration:"
check_env "DROPPAY_API_KEY"
check_env "DROPPAY_BASE_URL"
check_env "DROPPAY_AUTH_SCHEME"
check_env "DROPPAY_WEBHOOK_SECRET"

# Check Pi Network vars
echo ""
echo "Pi Network Configuration:"
check_env "VITE_PI_API_KEY"
check_env "VITE_PI_VALIDATION_KEY"
check_env "VITE_PI_NETWORK"
check_env "VITE_API_URL"

# Check Supabase vars
echo ""
echo "Supabase Configuration:"
check_env "VITE_SUPABASE_URL"
check_env "VITE_SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "Testing Endpoints..."
echo "==================="

# Test if DropPay endpoint is accessible
echo -n "DropPay API endpoint... "
if curl -s -o /dev/null -w "%{http_code}" "$DROPPAY_BASE_URL" | grep -q "404\|401\|200\|403"; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Unreachable${NC} (Check DROPPAY_BASE_URL)"
fi

# Test if Pi API endpoint is accessible
echo -n "Pi API endpoint... "
if curl -s -o /dev/null -w "%{http_code}" "$VITE_API_URL/v2/me" | grep -q "401\|200\|403"; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Unreachable${NC} (Check VITE_API_URL)"
fi

echo ""
echo "Browser Configuration..."
echo "======================="

# Check pi-config.ts
if grep -q "SANDBOX_MODE: false" "src/config/pi-config.ts" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Pi Config - MAINNET MODE"
else
    echo -e "${RED}❌${NC} Pi Config - Not in MAINNET mode"
fi

# Check if SDK version is 2.0
if grep -q '"version": "2.0"' "src/config/pi-config.ts" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Pi SDK - Version 2.0"
else
    echo -e "${RED}❌${NC} Pi SDK - Wrong version"
fi

# Check manifest.json
if [ -f "manifest.json" ]; then
    echo -e "${GREEN}✅${NC} manifest.json exists"
else
    echo -e "${RED}❌${NC} manifest.json not found"
fi

echo ""
echo "Recommended Next Steps..."
echo "========================"
echo ""
echo "1. Set environment variables in your .env.local:"
echo "   cp .env.payment-example .env.local"
echo "   # Edit .env.local with your actual keys"
echo ""
echo "2. Deploy to Vercel:"
echo "   Add all env vars to Vercel Project Settings → Environment Variables"
echo ""
echo "3. Test DropPay locally:"
echo "   curl -X POST http://localhost:5173/api/droppay-create \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"amount\": 10, \"currency\": \"PI\"}'"
echo ""
echo "4. Test Pi Auth in Pi Browser:"
echo "   - Download Pi Browser from https://minepi.com/download"
echo "   - Navigate to your droplink.space URL"
echo "   - Click 'Sign in with Pi Network'"
echo "   - Check browser console for [PI DEBUG] logs"
echo ""
echo "5. Monitor Payment Tests:"
echo "   - Open browser DevTools (F12)"
echo "   - Go to Console tab"
echo "   - Look for [DROPPAY_CREATE] and [PI DEBUG] logs"
echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
