#!/bin/bash

# Test Endpoints Script
# Tests validation, rate limiting, and Redis caching

BASE_URL="http://localhost:3000"

echo "==================================="
echo "ENDPOINT TESTING SUITE"
echo "==================================="
echo ""

# Test 1: Registration with weak password (should fail validation)
echo "TEST 1: Registration with weak password"
echo "Expected: Validation error with password requirements"
RESPONSE=$(curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  --max-time 10 \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User"
  }' 2>/dev/null)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Registration with valid data
echo "TEST 2: Registration with strong password"
echo "Expected: Success or user already exists"
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  --max-time 10 \
  -d "{
    \"email\": \"testuser${TIMESTAMP}@example.com\",
    \"password\": \"ValidPass123!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\"
  }" 2>/dev/null)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Products API (test rate limiting headers)
echo "TEST 3: Products API - Check cache and rate limit headers"
echo "Expected: Success with X-Cache-Status and X-RateLimit headers"
RESPONSE=$(curl -X GET "${BASE_URL}/api/supabase/products?per_page=5" \
  -H "Content-Type: application/json" \
  --max-time 10 \
  -i 2>/dev/null | head -30)
echo "$RESPONSE"
echo ""

# Test 4: Test rate limiting (5 rapid requests)
echo "TEST 4: Rate limiting test - 5 rapid requests to auth endpoint"
echo "Expected: Should get rate limited after 5 attempts"
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    --max-time 5 \
    -d '{
      "email": "nonexistent@example.com",
      "password": "wrong"
    }' 2>/dev/null | jq -r '.error // .retryAfter // "Success"' | head -1
done
echo ""

# Test 5: Products API cache test (second request should hit cache)
echo "TEST 5: Cache test - Second products request should be cache HIT"
echo "First request (cache MISS):"
curl -X GET "${BASE_URL}/api/supabase/products?per_page=2" \
  -H "Content-Type: application/json" \
  --max-time 10 \
  -i 2>/dev/null | grep "X-Cache-Status"

echo "Second request (cache HIT expected):"
curl -X GET "${BASE_URL}/api/supabase/products?per_page=2" \
  -H "Content-Type: application/json" \
  --max-time 10 \
  -i 2>/dev/null | grep "X-Cache-Status"
echo ""

echo "==================================="
echo "TESTING COMPLETE"
echo "==================================="
