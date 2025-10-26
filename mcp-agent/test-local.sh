#!/bin/bash

echo "🧪 Testing Yacht Club AI Agent"
echo "================================"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Agent server is healthy"
else
  echo "❌ Agent server not responding"
  exit 1
fi
echo ""

# Test 2: Generate storefront (needs real API key)
echo "Test 2: Generate Test Storefront"
echo "Calling agent..."
RESULT=$(curl -s -X POST http://localhost:3001/api/generate-storefront \
  -H "Authorization: Bearer yacht-club-secret-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "test-vendor-id",
    "vendorData": {
      "store_name": "Test Store",
      "slug": "test-store",
      "vendor_type": "cannabis",
      "store_tagline": "Premium cannabis delivered"
    }
  }')

echo "$RESULT" | jq '.'
echo ""

if echo "$RESULT" | grep -q '"success":true'; then
  echo "✅ Storefront generated successfully!"
else
  echo "⚠️  Generation failed (check if you have real API keys)"
fi

echo ""
echo "================================"
echo "Tests complete!"
