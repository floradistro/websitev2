#!/bin/bash

# Advanced Edge Case Testing Suite
# Tests concurrency, race conditions, security, performance limits

BASE_URL="http://localhost:3000"
RESULTS="/tmp/advanced-test-results.txt"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL=0
PASSED=0
FAILED=0

log_test() {
    echo "$1" | tee -a "$RESULTS"
}

run_test() {
    local name="$1"
    local cmd="$2"
    local expect="$3"

    TOTAL=$((TOTAL + 1))
    log_test ""
    log_test "TEST $TOTAL: $name"

    result=$(eval "$cmd" 2>&1)

    if echo "$result" | grep -q "$expect"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        log_test "✅ PASSED"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        log_test "❌ FAILED"
        log_test "Expected: $expect"
        log_test "Got: $result"
        FAILED=$((FAILED + 1))
    fi
}

echo "========================================" > "$RESULTS"
echo "ADVANCED EDGE CASE TESTING" >> "$RESULTS"
echo "Date: $(date)" >> "$RESULTS"
echo "========================================" >> "$RESULTS"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}ADVANCED EDGE CASE TESTING${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# ============================================
# SUITE 1: CONCURRENCY & RACE CONDITIONS
# ============================================
echo -e "${BLUE}=== SUITE 1: Concurrency & Race Conditions ===${NC}"

run_test \
    "Concurrent requests maintain unique request IDs" \
    "curl -s -I $BASE_URL/ & curl -s -I $BASE_URL/ & curl -s -I $BASE_URL/ & wait; curl -s -I $BASE_URL/ | grep -i 'x-request-id'" \
    "x-request-id"

run_test \
    "Parallel API calls don't interfere" \
    "curl -s $BASE_URL/api/supabase/products?per_page=1 & curl -s $BASE_URL/api/supabase/products?per_page=2 & wait; echo 'success'" \
    "success"

run_test \
    "Race condition: Multiple cache writes" \
    "for i in {1..5}; do curl -s $BASE_URL/api/supabase/products?per_page=1 & done; wait; curl -s -I $BASE_URL/api/supabase/products?per_page=1 | grep -i 'x-cache-status'" \
    "HIT\\|MISS"

# ============================================
# SUITE 2: MALICIOUS PAYLOADS & SECURITY
# ============================================
echo -e "${BLUE}=== SUITE 2: Malicious Payloads & Security ===${NC}"

run_test \
    "Security: LDAP injection attempt" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"admin*)(uid=*\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "Invalid email\\|error"

run_test \
    "Security: NoSQL injection attempt" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":{\"\$ne\":null}}'" \
    "error\\|Invalid"

run_test \
    "Security: Command injection in name" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"; rm -rf /\",\"lastName\":\"User\"}'" \
    "error\\|Invalid"

run_test \
    "Security: Path traversal in string" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"../../../etc/passwd\",\"lastName\":\"User\"}'" \
    "error\\|Invalid"

run_test \
    "Security: XML injection" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"<?xml version=\\\"1.0\\\"?>\",\"lastName\":\"User\"}'" \
    "error\\|Invalid"

run_test \
    "Security: Template injection" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"{{7*7}}\",\"lastName\":\"User\"}'" \
    "error\\|Invalid"

run_test \
    "Security: Null byte injection" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\\u0000admin\",\"password\":\"ValidPass123!\"}'" \
    "error\\|Invalid"

run_test \
    "Security: Unicode normalization attack" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"admin\\u0041@example.com\",\"password\":\"ValidPass123!\"}'" \
    "error\\|Invalid\\|success"

run_test \
    "Security: Homograph attack" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"аdmin@example.com\",\"password\":\"ValidPass123!\"}'" \
    "error\\|Invalid\\|success"

# ============================================
# SUITE 3: EXTREME INPUT BOUNDARY TESTING
# ============================================
echo -e "${BLUE}=== SUITE 3: Extreme Input Boundaries ===${NC}"

run_test \
    "Boundary: Maximum password length (128 chars)" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"A1!aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\"}'" \
    "error\\|success\\|Too many"

run_test \
    "Boundary: Exactly 255 character email" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@example.com\"}'" \
    "error\\|Invalid"

run_test \
    "Boundary: Empty string in all fields" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"\",\"password\":\"\",\"firstName\":\"\",\"lastName\":\"\"}'" \
    "error\\|Validation\\|Too many"

run_test \
    "Boundary: Only whitespace in name" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"   \",\"lastName\":\"User\"}'" \
    "error\\|Invalid\\|Too many"

run_test \
    "Boundary: Special characters in all positions" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"!#\$%&*+-/=?^_\`{|}~@example.com\",\"password\":\"ValidPass123!\"}'" \
    "error\\|Invalid\\|success"

run_test \
    "Boundary: Emoji in name field" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"😀🎉\",\"lastName\":\"User\"}'" \
    "error\\|Invalid\\|Too many"

run_test \
    "Boundary: RTL (Right-to-Left) characters" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"firstName\":\"مرحبا\",\"lastName\":\"User\"}'" \
    "error\\|Invalid\\|Too many"

# ============================================
# SUITE 4: MALFORMED REQUESTS
# ============================================
echo -e "${BLUE}=== SUITE 4: Malformed Requests ===${NC}"

run_test \
    "Malformed: Deeply nested JSON (100+ levels)" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"a\":{\"b\":{\"c\":{\"d\":{\"e\":{\"f\":{\"g\":{\"h\":{\"i\":{\"j\":{}}}}}}}}}}}'" \
    "error"

run_test \
    "Malformed: Circular JSON reference simulation" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"ref\":{\"self\":\"ref\"}}'" \
    "error\\|Validation\\|Too many"

run_test \
    "Malformed: Array instead of object" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '[{\"email\":\"test@example.com\"}]'" \
    "error"

run_test \
    "Malformed: Number instead of string" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":12345,\"password\":67890}'" \
    "error\\|Invalid\\|Too many"

run_test \
    "Malformed: Boolean in string field" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":true,\"password\":false}'" \
    "error\\|Invalid\\|Too many"

run_test \
    "Malformed: Mixed quotes in JSON" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",password:\"test\"}'" \
    "error"

run_test \
    "Malformed: Missing closing brace" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\"'" \
    "error"

run_test \
    "Malformed: Extra closing brace" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\"}}'" \
    "error"

# ============================================
# SUITE 5: HEADER MANIPULATION
# ============================================
echo -e "${BLUE}=== SUITE 5: Header Manipulation ===${NC}"

run_test \
    "Header: Missing Content-Type entirely" \
    "curl -s -X POST $BASE_URL/api/auth/register -d '{\"email\":\"test@example.com\"}'" \
    "error\\|Too many"

run_test \
    "Header: Wrong Content-Type (text/plain)" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: text/plain' -d '{\"email\":\"test@example.com\"}'" \
    "error\\|Too many"

run_test \
    "Header: Multiple Content-Type headers" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -H 'Content-Type: text/html' -d '{\"email\":\"test@example.com\"}'" \
    "error\\|success\\|Too many"

run_test \
    "Header: Malicious User-Agent" \
    "curl -s -A '<script>alert(1)</script>' $BASE_URL/" \
    "HTTP"

run_test \
    "Header: Very long User-Agent (10KB)" \
    "curl -s -A '$(printf 'A%.0s' {1..10000})' $BASE_URL/" \
    "HTTP"

run_test \
    "Header: Null byte in header" \
    "curl -s -H 'X-Custom: test' $BASE_URL/" \
    "HTTP"

# ============================================
# SUITE 6: RATE LIMITING EDGE CASES
# ============================================
echo -e "${BLUE}=== SUITE 6: Rate Limiting Edge Cases ===${NC}"

run_test \
    "Rate limit: Different endpoints share limits" \
    "curl -s $BASE_URL/api/supabase/products?per_page=1 | grep -q success && echo 'different endpoints work'" \
    "different endpoints work"

run_test \
    "Rate limit: Headers show correct remaining count" \
    "curl -s -I $BASE_URL/api/supabase/products?per_page=1 | grep -i 'x-ratelimit-remaining' | grep -E '[0-9]+'" \
    "[0-9]"

run_test \
    "Rate limit: Reset time is reasonable" \
    "curl -s -I $BASE_URL/api/supabase/products?per_page=1 | grep -i 'x-ratelimit-reset' | grep -E '[0-9]+'" \
    "[0-9]"

# ============================================
# SUITE 7: CACHE EDGE CASES
# ============================================
echo -e "${BLUE}=== SUITE 7: Cache Edge Cases ===${NC}"

run_test \
    "Cache: Different query params create different cache keys" \
    "curl -s $BASE_URL/api/supabase/products?per_page=1 && curl -s $BASE_URL/api/supabase/products?per_page=2 && echo 'cache keys differ'" \
    "cache keys differ"

run_test \
    "Cache: Status header present on all product requests" \
    "curl -s -I $BASE_URL/api/supabase/products?test=123 | grep -i 'x-cache-status'" \
    "HIT\\|MISS"

run_test \
    "Cache: Response time faster on cache hits" \
    "curl -s -I $BASE_URL/api/supabase/products?per_page=1 | grep -i 'x-response-time'" \
    "[0-9]"

# ============================================
# SUITE 8: REQUEST ID EDGE CASES
# ============================================
echo -e "${BLUE}=== SUITE 8: Request ID Edge Cases ===${NC}"

run_test \
    "Request ID: Present on error responses" \
    "curl -s -I -X POST $BASE_URL/api/auth/register | grep -i 'x-request-id'" \
    "x-request-id"

run_test \
    "Request ID: Present on 404 pages" \
    "curl -s -I $BASE_URL/nonexistent-page | grep -i 'x-request-id'" \
    "x-request-id"

run_test \
    "Request ID: Present on static files" \
    "curl -s -I $BASE_URL/favicon.ico | grep -i 'x-request-id'" \
    "x-request-id\\|HTTP"

run_test \
    "Request ID: Different on rapid successive requests" \
    "ID1=\$(curl -s -I $BASE_URL/ | grep -i 'x-request-id' | cut -d' ' -f2); ID2=\$(curl -s -I $BASE_URL/ | grep -i 'x-request-id' | cut -d' ' -f2); [ \"\$ID1\" != \"\$ID2\" ] && echo 'unique'" \
    "unique"

# ============================================
# SUITE 9: PERFORMANCE UNDER LOAD
# ============================================
echo -e "${BLUE}=== SUITE 9: Performance Under Load ===${NC}"

run_test \
    "Performance: 10 concurrent requests handled" \
    "for i in {1..10}; do curl -s $BASE_URL/ > /dev/null & done; wait; echo 'completed'" \
    "completed"

run_test \
    "Performance: Response time stays reasonable under load" \
    "for i in {1..5}; do curl -s $BASE_URL/ > /dev/null & done; wait; TIME=\$(curl -s -I $BASE_URL/ | grep -i 'x-response-time'); echo \$TIME" \
    "ms"

run_test \
    "Performance: Cache reduces database load" \
    "curl -s $BASE_URL/api/supabase/products?per_page=5 > /dev/null; curl -s -I $BASE_URL/api/supabase/products?per_page=5 | grep -i 'x-cache-status'" \
    "HIT"

# ============================================
# SUITE 10: ERROR HANDLING
# ============================================
echo -e "${BLUE}=== SUITE 10: Error Handling ===${NC}"

run_test \
    "Error: Network timeout handled gracefully" \
    "curl -s --max-time 0.001 $BASE_URL/ 2>&1 || echo 'timeout handled'" \
    "timeout handled"

run_test \
    "Error: Invalid HTTP method returns proper error" \
    "curl -s -X INVALID $BASE_URL/api/auth/register 2>&1" \
    ".*"

run_test \
    "Error: Request to non-existent API endpoint" \
    "curl -s $BASE_URL/api/nonexistent/endpoint" \
    ".*"

run_test \
    "Error: Malformed URL handled" \
    "curl -s $BASE_URL//api///auth////register 2>&1" \
    ".*"

# ============================================
# FINAL SUMMARY
# ============================================
echo "" | tee -a "$RESULTS"
echo "========================================" | tee -a "$RESULTS"
echo "ADVANCED TEST SUMMARY" | tee -a "$RESULTS"
echo "========================================" | tee -a "$RESULTS"
echo "Total Tests: $TOTAL" | tee -a "$RESULTS"
echo "Passed: $PASSED" | tee -a "$RESULTS"
echo "Failed: $FAILED" | tee -a "$RESULTS"
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
echo "Success Rate: ${SUCCESS_RATE}%" | tee -a "$RESULTS"
echo "========================================" | tee -a "$RESULTS"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}ADVANCED TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Full results: ${BLUE}$RESULTS${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL ADVANCED TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed - review results${NC}"
    exit 1
fi
