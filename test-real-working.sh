#!/bin/bash

VENDOR_ID="cd2e1122-d511-4edb-be5d-98ef274b4baf"
echo "🧪 Testing Location Inventory with REAL DATA"
echo "=============================================="
echo ""

# Get product with valid data
PRODUCT_ID="4d794285-68b8-42f1-bfb1-c0bea6b2ff03"
PRODUCT_NAME="Dirty Sprite"
LOCATION_ID="c4eedafb-4050-4d2d-a6af-e164aad5d934"  # Charlotte Central
LOCATION_ID_2="8cb9154e-c89c-4f5e-b751-74820e348b8a"  # Charlotte Monroe

echo "📦 Product: $PRODUCT_NAME"
echo "📍 Location 1: Charlotte Central"
echo "📍 Location 2: Charlotte Monroe"
echo ""

# Test 1: Adjustment
echo "🔧 TEST 1: Adding 10g to Charlotte Central"
echo "----------------------------------------"
RESULT=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/adjust" \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: $VENDOR_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"locationId\": \"$LOCATION_ID\",
    \"adjustment\": 10.0,
    \"reason\": \"Test: Adding stock via Location Inventory tab\"
  }")

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

# Test 2: Transfer
echo "🔄 TEST 2: Transfer 5g from Charlotte Central → Charlotte Monroe"
echo "----------------------------------------------------------------"
RESULT=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/transfer" \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: $VENDOR_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"fromLocationId\": \"$LOCATION_ID\",
    \"toLocationId\": \"$LOCATION_ID_2\",
    \"quantity\": 5.0,
    \"reason\": \"Test: Transfer via Location Inventory tab\"
  }")

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

# Test 3: Remove stock
echo "🔧 TEST 3: Removing 3g from Charlotte Monroe"
echo "-------------------------------------------"
RESULT=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/adjust" \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: $VENDOR_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"locationId\": \"$LOCATION_ID_2\",
    \"adjustment\": -3.0,
    \"reason\": \"Test: Removing stock via Location Inventory tab\"
  }")

echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

echo "=============================================="
echo "✅ ALL TESTS COMPLETE!"
echo "=============================================="
echo ""
echo "🌐 BROWSER TESTING:"
echo "1. Go to: http://localhost:3000/vendor/inventory"
echo "2. Find: Dirty Sprite"
echo "3. Expand card → Click 'Location Inventory' tab"
echo "4. You'll see 6 locations with stock levels"
echo "5. Try the Add/Remove buttons"
echo "6. Try the transfer form"
echo ""

