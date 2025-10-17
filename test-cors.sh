#!/bin/bash

echo "🔍 Testing Flora CORS Configuration"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
API_URL="https://api.floradistro.com/wp-json/flora/v1/shipping/calculate"
ORIGIN1="https://websitev2-ashen.vercel.app"
ORIGIN2="https://web2-seven-bice.vercel.app"
ORIGIN3="http://localhost:3000"

echo "📡 Testing Shipping API CORS..."
echo ""

# Test 1: OPTIONS Preflight for Production Domain 1
echo "Test 1: OPTIONS preflight (websitev2-ashen.vercel.app)"
echo "----------------------------------------"
RESPONSE1=$(curl -s -I -X OPTIONS "$API_URL" \
  -H "Origin: $ORIGIN1" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$RESPONSE1" | grep -qi "Access-Control-Allow-Origin: $ORIGIN1"; then
  echo -e "${GREEN}✅ PASS${NC} - CORS headers present for $ORIGIN1"
else
  echo -e "${RED}❌ FAIL${NC} - No CORS headers for $ORIGIN1"
  echo "Response headers:"
  echo "$RESPONSE1" | grep -i "access-control"
fi
echo ""

# Test 2: OPTIONS Preflight for Production Domain 2
echo "Test 2: OPTIONS preflight (web2-seven-bice.vercel.app)"
echo "----------------------------------------"
RESPONSE2=$(curl -s -I -X OPTIONS "$API_URL" \
  -H "Origin: $ORIGIN2" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$RESPONSE2" | grep -qi "Access-Control-Allow-Origin: $ORIGIN2"; then
  echo -e "${GREEN}✅ PASS${NC} - CORS headers present for $ORIGIN2"
else
  echo -e "${RED}❌ FAIL${NC} - No CORS headers for $ORIGIN2"
  echo "Response headers:"
  echo "$RESPONSE2" | grep -i "access-control"
fi
echo ""

# Test 3: OPTIONS Preflight for Localhost
echo "Test 3: OPTIONS preflight (localhost:3000)"
echo "----------------------------------------"
RESPONSE3=$(curl -s -I -X OPTIONS "$API_URL" \
  -H "Origin: $ORIGIN3" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$RESPONSE3" | grep -qi "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ PASS${NC} - CORS headers present for localhost"
else
  echo -e "${RED}❌ FAIL${NC} - No CORS headers for localhost"
fi
echo ""

# Test 4: Actual POST Request
echo "Test 4: POST Request with Real Data"
echo "----------------------------------------"
RESPONSE4=$(curl -s -X POST "$API_URL" \
  -H "Origin: $ORIGIN1" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":646,"quantity":1}],"destination":{"postcode":"28605","country":"US"}}')

if echo "$RESPONSE4" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASS${NC} - API returns success"
  echo "Rates returned:" $(echo "$RESPONSE4" | grep -o '"method_title":"[^"]*"' | head -3)
else
  echo -e "${RED}❌ FAIL${NC} - API error or no response"
  echo "Response:"
  echo "$RESPONSE4" | head -200
fi
echo ""

# Test 5: Check Response Headers on POST
echo "Test 5: CORS Headers on POST Response"
echo "----------------------------------------"
HEADERS=$(curl -s -I -X POST "$API_URL" \
  -H "Origin: $ORIGIN1" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":646,"quantity":1}],"destination":{"postcode":"28605","country":"US"}}')

if echo "$HEADERS" | grep -qi "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ PASS${NC} - CORS headers in POST response"
  echo "$HEADERS" | grep -i "access-control"
else
  echo -e "${RED}❌ FAIL${NC} - No CORS headers in POST response"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Summary"
echo "========================================"
echo ""

PASS_COUNT=$(echo "$RESPONSE1 $RESPONSE2 $RESPONSE3 $RESPONSE4 $HEADERS" | grep -c "Access-Control")

if [ "$PASS_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  CORS partially configured${NC}"
  echo ""
  echo "Action Required:"
  echo "1. Upload flora-cors-fix.php to WordPress"
  echo "2. Activate the plugin"
  echo "3. Run this test again"
else
  echo -e "${RED}❌ CORS NOT configured${NC}"
  echo ""
  echo "URGENT: Install flora-cors-fix.php on WordPress NOW"
fi

echo ""
echo "🔗 WordPress Admin: https://api.floradistro.com/wp-admin/plugins.php"
echo "📄 Plugin File: /Users/f/Desktop/web2/flora-cors-fix.php"
echo ""

