#!/bin/bash

# Comprehensive Production Test Suite
# Tests all systems with real data

echo "🧪 COMPREHENSIVE PRODUCTION TEST SUITE"
echo "======================================"
echo ""
echo "Testing with REAL DATA ONLY"
echo ""

BASE_URL="http://localhost:3000"
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Got $status_code, expected $expected_status)"
        FAILED=$((FAILED + 1))
        echo "$body" | head -5
        return 1
    fi
}

echo "1️⃣  API ENDPOINT TESTS"
echo "─────────────────────"

# Products API
test_endpoint "Products API" "/api/supabase/products" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        products = data.get('products', [])
        print(f'   📦 Products: {len(products)}')
        if len(products) > 0:
            print(f'   ✅ Sample: {products[0].get(\"name\", \"N/A\")}')
            print(f'   💰 Price: \${products[0].get(\"price\", 0)}')
    else:
        print('   ❌ API returned success=false')
except:
    pass
" 2>/dev/null

echo ""

# Performance Stats
test_endpoint "Performance Stats" "/api/admin/performance-stats" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    health = data.get('health', {})
    cache = data.get('cache', {})
    print(f'   💯 Health: {health.get(\"score\")}/100 ({health.get(\"status\")})')
    print(f'   ⚡ Cache Hit Rate: {cache.get(\"hitRate\")}')
    print(f'   📊 Total Requests: {cache.get(\"total\")}')
except:
    pass
" 2>/dev/null

echo ""

# Job Queue Stats
test_endpoint "Job Queue API" "/api/admin/jobs?action=stats" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    stats = data.get('stats', {})
    print(f'   📋 Total Jobs: {stats.get(\"total\")}')
    print(f'   ✅ Completed: {stats.get(\"completed\")}')
    print(f'   ❌ Failed: {stats.get(\"failed\")}')
except:
    pass
" 2>/dev/null

echo ""
echo ""

echo "2️⃣  FRONTEND PAGE TESTS"
echo "─────────────────────"

for page in "/" "/products" "/vendor/dashboard" "/admin/monitoring"; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" = "200" ]; then
        echo -e "  ${GREEN}✅${NC} $page: $status OK"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}❌${NC} $page: $status ERROR"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo ""

echo "3️⃣  CACHE PERFORMANCE TEST"
echo "────────────────────────"

echo "Making 30 identical requests to test cache..."
for i in {1..30}; do
    curl -s "$BASE_URL/api/supabase/products" > /dev/null 2>&1
done

sleep 1

curl -s "$BASE_URL/api/admin/performance-stats" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cache = data.get('cache', {})
health = data.get('health', {})

hit_rate = float(cache.get('hitRate', '0%').replace('%', ''))

print(f'Cache Performance:')
print(f'  Hit Rate: {cache.get(\"hitRate\")}')
print(f'  Hits: {cache.get(\"hits\")}')
print(f'  Misses: {cache.get(\"misses\")}')
print(f'  Total: {cache.get(\"total\")}')
print(f'')
print(f'Cache Sizes:')
print(f'  Product: {cache[\"sizes\"][\"product\"][\"size\"]}/{cache[\"sizes\"][\"product\"][\"max\"]}')
print(f'  Vendor: {cache[\"sizes\"][\"vendor\"][\"size\"]}/{cache[\"sizes\"][\"vendor\"][\"max\"]}')
print(f'  Inventory: {cache[\"sizes\"][\"inventory\"][\"size\"]}/{cache[\"sizes\"][\"inventory\"][\"max\"]}')
print(f'')

if hit_rate >= 90:
    print('✅ Cache performance: EXCELLENT (>90%)')
elif hit_rate >= 70:
    print('⚠️  Cache performance: GOOD (70-90%)')
else:
    print('❌ Cache performance: NEEDS IMPROVEMENT (<70%)')
" 2>/dev/null

echo ""
echo ""

echo "4️⃣  SPEED BENCHMARK TEST"
echo "──────────────────────"

echo "Testing API response times (10 requests)..."

total_time=0
for i in {1..10}; do
    start=$(date +%s%N)
    curl -s "$BASE_URL/api/supabase/products" > /dev/null 2>&1
    end=$(date +%s%N)
    duration=$(( (end - start) / 1000000 ))
    total_time=$((total_time + duration))
done

avg_time=$((total_time / 10))

echo "  Average Response Time: ${avg_time}ms"

if [ $avg_time -lt 100 ]; then
    echo -e "  ${GREEN}✅ EXCELLENT${NC} (<100ms)"
elif [ $avg_time -lt 200 ]; then
    echo -e "  ${YELLOW}⚡ GOOD${NC} (100-200ms)"
else
    echo -e "  ${RED}⚠️  NEEDS OPTIMIZATION${NC} (>200ms)"
fi

echo ""
echo ""

echo "5️⃣  DATA INTEGRITY CHECK"
echo "──────────────────────"

# Check for real products
products_count=$(curl -s "$BASE_URL/api/supabase/products" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('products', [])))" 2>/dev/null)

if [ "$products_count" -gt 0 ]; then
    echo -e "  ${GREEN}✅${NC} Products in database: $products_count"
else
    echo -e "  ${YELLOW}⚠️${NC}  No products found (database might be empty)"
fi

echo ""
echo ""

echo "6️⃣  FINAL SUMMARY"
echo "───────────────"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS"
echo "  Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo -e ""
    echo -e "  ${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "  ${GREEN}✅ SYSTEM IS PRODUCTION-READY!${NC}"
else
    echo -e ""
    echo -e "  ${RED}❌ Some tests failed. Please review.${NC}"
fi

echo ""
echo "Server: $BASE_URL"
echo ""

exit $FAILED

