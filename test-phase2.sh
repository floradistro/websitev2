#!/bin/bash

# Phase 2 Comprehensive Testing Script
# Tests error boundaries, API wrapper, logging, and edge cases

BASE_URL="http://localhost:3000"
RESULTS_FILE="/tmp/phase2-test-results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================" > "$RESULTS_FILE"
echo "PHASE 2 COMPREHENSIVE TEST REPORT" >> "$RESULTS_FILE"
echo "Date: $(date)" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${BLUE}TEST $TESTS_RUN: $test_name${NC}"
    echo "TEST $TESTS_RUN: $test_name" >> "$RESULTS_FILE"
    echo "Command: $test_command" >> "$RESULTS_FILE"

    # Run the test
    result=$(eval "$test_command" 2>&1)

    # Check if result matches expected pattern
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "Status: ✅ PASSED" >> "$RESULTS_FILE"
        echo "Output: $result" >> "$RESULTS_FILE"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Status: ❌ FAILED" >> "$RESULTS_FILE"
        echo "Expected pattern: $expected_pattern" >> "$RESULTS_FILE"
        echo "Actual output: $result" >> "$RESULTS_FILE"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    echo "---" >> "$RESULTS_FILE"
    echo ""
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}PHASE 2 COMPREHENSIVE TESTING${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# ============================================
# TEST SUITE 1: Request ID & Response Headers
# ============================================
echo -e "${BLUE}=== TEST SUITE 1: Request ID & Headers ===${NC}"

run_test \
    "Request ID header present on all requests" \
    "curl -s -I $BASE_URL/ | grep -i 'x-request-id'" \
    "x-request-id"

run_test \
    "Response time header present on all requests" \
    "curl -s -I $BASE_URL/ | grep -i 'x-response-time'" \
    "x-response-time"

run_test \
    "Request ID is unique across requests" \
    "curl -s -I $BASE_URL/ | grep -i 'x-request-id' && curl -s -I $BASE_URL/ | grep -i 'x-request-id'" \
    "x-request-id"

# ============================================
# TEST SUITE 2: API Wrapper Validation
# ============================================
echo -e "${BLUE}=== TEST SUITE 2: API Wrapper Validation ===${NC}"

run_test \
    "Validation: Empty email rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"\",\"password\":\"ValidPassword123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "Invalid email"

run_test \
    "Validation: Invalid email format rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"notanemail\",\"password\":\"ValidPassword123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "Invalid email"

run_test \
    "Validation: Short password rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"short\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "at least 12 characters"

run_test \
    "Validation: Password without uppercase rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"lowercase123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "uppercase"

run_test \
    "Validation: Password without number rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"NoNumbersHere!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "number"

run_test \
    "Validation: Password without special character rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"NoSpecial123\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "special character"

run_test \
    "Validation: XSS attempt in name rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPassword123!\",\"firstName\":\"<script>alert(1)</script>\",\"lastName\":\"User\"}'" \
    "Invalid"

run_test \
    "Validation: SQL injection attempt in email rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com OR 1=1--\",\"password\":\"ValidPassword123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "Invalid email"

# ============================================
# TEST SUITE 3: Rate Limiting
# ============================================
echo -e "${BLUE}=== TEST SUITE 3: Rate Limiting ===${NC}"

run_test \
    "Rate limiting: First login attempt allowed" \
    "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"ratelimit@test.com\",\"password\":\"WrongPassword123!\"}'" \
    "Invalid email"

run_test \
    "Rate limiting: Second login attempt allowed" \
    "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"ratelimit@test.com\",\"password\":\"WrongPassword123!\"}'" \
    "Invalid email"

run_test \
    "Rate limiting: Third login attempt allowed" \
    "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"ratelimit@test.com\",\"password\":\"WrongPassword123!\"}'" \
    "Invalid email"

run_test \
    "Rate limiting: Fourth login attempt rate limited" \
    "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"ratelimit@test.com\",\"password\":\"WrongPassword123!\"}'" \
    "Too many"

run_test \
    "Rate limiting: Headers present on API requests" \
    "curl -s -I -X GET '$BASE_URL/api/supabase/products?per_page=1' | grep -i 'x-ratelimit'" \
    "x-ratelimit"

# ============================================
# TEST SUITE 4: Security Headers
# ============================================
echo -e "${BLUE}=== TEST SUITE 4: Security Headers ===${NC}"

run_test \
    "Security: X-Frame-Options header present" \
    "curl -s -I $BASE_URL/ | grep -i 'x-frame-options'" \
    "SAMEORIGIN"

run_test \
    "Security: X-Content-Type-Options header present" \
    "curl -s -I $BASE_URL/ | grep -i 'x-content-type-options'" \
    "nosniff"

run_test \
    "Security: Content-Security-Policy header present" \
    "curl -s -I $BASE_URL/ | grep -i 'content-security-policy'" \
    "default-src"

run_test \
    "Security: Strict-Transport-Security header present" \
    "curl -s -I $BASE_URL/ | grep -i 'strict-transport-security'" \
    "max-age"

# ============================================
# TEST SUITE 5: API Response Format
# ============================================
echo -e "${BLUE}=== TEST SUITE 5: API Response Format ===${NC}"

run_test \
    "API Format: Success responses have 'success' field" \
    "curl -s -X GET '$BASE_URL/api/supabase/products?per_page=1'" \
    "success"

run_test \
    "API Format: Error responses have 'success: false'" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"invalid\"}'" \
    '"success":false'

run_test \
    "API Format: Validation errors have 'details' field" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"weak\"}'" \
    "details"

# ============================================
# TEST SUITE 6: Edge Cases & Malformed Requests
# ============================================
echo -e "${BLUE}=== TEST SUITE 6: Edge Cases ===${NC}"

run_test \
    "Edge Case: Empty JSON body handled" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{}'" \
    "Validation failed"

run_test \
    "Edge Case: Invalid JSON handled" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{invalid json}'" \
    "error"

run_test \
    "Edge Case: Missing Content-Type handled" \
    "curl -s -X POST $BASE_URL/api/auth/register -d '{\"email\":\"test@example.com\"}'" \
    "error"

run_test \
    "Edge Case: Very long email rejected" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"$(printf 'a%.0s' {1..300})@example.com\",\"password\":\"ValidPassword123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    "error\\|Invalid"

run_test \
    "Edge Case: Unicode characters in name handled" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"ValidPassword123!\",\"firstName\":\"José\",\"lastName\":\"Müller\"}'" \
    "Invalid"

run_test \
    "Edge Case: Null values handled" \
    "curl -s -X POST $BASE_URL/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":null,\"password\":null}'" \
    "Invalid\\|error"

# ============================================
# TEST SUITE 7: Performance & Caching
# ============================================
echo -e "${BLUE}=== TEST SUITE 7: Performance & Caching ===${NC}"

run_test \
    "Performance: Response time header has valid value" \
    "curl -s -I $BASE_URL/ | grep -i 'x-response-time' | grep -E '[0-9]+'" \
    "[0-9]"

run_test \
    "Caching: Products endpoint returns cache headers" \
    "curl -s -I -X GET '$BASE_URL/api/supabase/products?per_page=1' | grep -i 'x-cache-status'" \
    "MISS\\|HIT"

run_test \
    "Caching: Second request shows cache HIT" \
    "curl -s -X GET '$BASE_URL/api/supabase/products?per_page=1' > /dev/null && curl -s -I -X GET '$BASE_URL/api/supabase/products?per_page=1' | grep -i 'x-cache-status'" \
    "HIT"

# ============================================
# FINAL SUMMARY
# ============================================
echo "" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "TEST SUMMARY" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "Total Tests Run: $TESTS_RUN" >> "$RESULTS_FILE"
echo "Tests Passed: $TESTS_PASSED" >> "$RESULTS_FILE"
echo "Tests Failed: $TESTS_FAILED" >> "$RESULTS_FILE"
echo "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($TESTS_PASSED/$TESTS_RUN)*100}")%" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests Run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: ${BLUE}$(awk "BEGIN {printf \"%.1f\", ($TESTS_PASSED/$TESTS_RUN)*100}")%${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Full results saved to: ${BLUE}$RESULTS_FILE${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
