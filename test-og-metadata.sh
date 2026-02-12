#!/bin/bash

# Dynamic OG Metadata Testing Script
# This script helps test the dynamic metadata implementation

echo "=========================================="
echo "Droplink Dynamic OG Metadata Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://droplink.space}"
TEST_USERNAME="${2:-testuser}"

echo "Base URL: $BASE_URL"
echo "Test Username: $TEST_USERNAME"
echo ""

# Test 1: Direct HTML endpoint
echo -e "${YELLOW}Test 1: Fetching profile HTML...${NC}"
echo "URL: $BASE_URL/@$TEST_USERNAME"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/@$TEST_USERNAME")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
HTML=$(echo "$RESPONSE" | sed '$d')

echo -e "HTTP Status: ${GREEN}$HTTP_STATUS${NC}"

if echo "$HTML" | grep -q "og:title"; then
    echo -e "${GREEN}✓ Found og:title tag${NC}"
else
    echo -e "${RED}✗ Missing og:title tag${NC}"
fi

if echo "$HTML" | grep -q "twitter:card"; then
    echo -e "${GREEN}✓ Found twitter:card tag${NC}"
else
    echo -e "${RED}✗ Missing twitter:card tag${NC}"
fi

if echo "$HTML" | grep -q "og:image"; then
    echo -e "${GREEN}✓ Found og:image tag${NC}"
else
    echo -e "${RED}✗ Missing og:image tag${NC}"
fi

echo ""

# Test 2: API endpoint
echo -e "${YELLOW}Test 2: Fetching metadata via API...${NC}"
echo "URL: $BASE_URL/api/metadata/$TEST_USERNAME"
METADATA=$(curl -s "$BASE_URL/api/metadata/$TEST_USERNAME")

if echo "$METADATA" | grep -q "\"title\""; then
    echo -e "${GREEN}✓ API returned title${NC}"
else
    echo -e "${RED}✗ API missing title${NC}"
fi

if echo "$METADATA" | grep -q "\"description\""; then
    echo -e "${GREEN}✓ API returned description${NC}"
else
    echo -e "${RED}✗ API missing description${NC}"
fi

if echo "$METADATA" | grep -q "\"ogImage\""; then
    echo -e "${GREEN}✓ API returned ogImage${NC}"
else
    echo -e "${RED}✗ API missing ogImage${NC}"
fi

# Pretty print JSON
echo ""
echo -e "${YELLOW}Full API Response:${NC}"
echo "$METADATA" | jq . 2>/dev/null || echo "$METADATA"

echo ""

# Test 3: Invalid username
echo -e "${YELLOW}Test 3: Testing invalid username format...${NC}"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/@!!!invalid")
INVALID_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
echo -e "HTTP Status for invalid username: ${GREEN}$INVALID_STATUS${NC}"

echo ""

# Test 4: Non-existent user
echo -e "${YELLOW}Test 4: Testing non-existent user...${NC}"
NOTFOUND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/@nonexistentuser123456789")
NOTFOUND_STATUS=$(echo "$NOTFOUND_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
NOTFOUND_HTML=$(echo "$NOTFOUND_RESPONSE" | sed '$d')

echo -e "HTTP Status: ${GREEN}$NOTFOUND_STATUS${NC}"

if echo "$NOTFOUND_HTML" | grep -q "Profile Not Found"; then
    echo -e "${GREEN}✓ Returns proper not found message${NC}"
else
    echo -e "${RED}✗ Missing not found message${NC}"
fi

echo ""

# Test 5: Check meta tags in HTML
echo -e "${YELLOW}Test 5: Extracting key meta tags...${NC}"
echo ""
echo "Open Graph Tags:"
echo "$HTML" | grep -o 'property="og:[^"]*" content="[^"]*"' | head -5
echo ""
echo "Twitter Tags:"
echo "$HTML" | grep -o 'name="twitter:[^"]*" content="[^"]*"' | head -5

echo ""
echo -e "${GREEN}=========================================="
echo "Test Summary Complete"
echo "==========================================${NC}"
echo ""
echo "Testing with real social platforms:"
echo "1. Facebook: https://developers.facebook.com/tools/debug/"
echo "2. Twitter:  https://cards-dev.twitter.com/validator"
echo "3. Telegram: Paste URL in chat preview"
echo "4. LinkedIn: Post URL and check preview"
