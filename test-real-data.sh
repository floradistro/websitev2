#!/bin/bash

# Get real vendor from localStorage (first vendor in database)
echo "📊 Fetching Real Test Data..."
echo ""

# Test with the vendor that has 6 locations (from terminal logs)
VENDOR_ID=$(curl -s 'http://localhost:3000/api/admin/vendors' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$VENDOR_ID" ]; then
  echo "❌ Could not find vendor ID"
  exit 1
fi

echo "✅ Using Vendor ID: $VENDOR_ID"
echo ""

# Get vendor locations
echo "📍 Fetching Vendor Locations..."
LOCATIONS=$(curl -s "http://localhost:3000/api/vendor/locations" -H "x-vendor-id: $VENDOR_ID")
echo "$LOCATIONS" | jq -r '.locations[] | "  - \(.name) (\(.city), \(.state)) [\(.id)]"' 2>/dev/null || echo "$LOCATIONS"
echo ""

# Get first two location IDs for transfer test
LOC1=$(echo "$LOCATIONS" | jq -r '.locations[0].id' 2>/dev/null)
LOC2=$(echo "$LOCATIONS" | jq -r '.locations[1].id' 2>/dev/null)

# Get vendor inventory
echo "📦 Fetching Vendor Inventory..."
INVENTORY=$(curl -s "http://localhost:3000/api/vendor/inventory" -H "x-vendor-id: $VENDOR_ID")
PRODUCT_COUNT=$(echo "$INVENTORY" | jq -r '.inventory | length' 2>/dev/null || echo "0")
echo "  Found $PRODUCT_COUNT products"

# Get first product with inventory at first location
PRODUCT_ID=$(echo "$INVENTORY" | jq -r '.inventory[0].product_id' 2>/dev/null)
PRODUCT_NAME=$(echo "$INVENTORY" | jq -r '.inventory[0].product_name' 2>/dev/null)
CURRENT_QTY=$(echo "$INVENTORY" | jq -r '.inventory[0].quantity' 2>/dev/null)

echo "  Test Product: $PRODUCT_NAME"
echo "  Product ID: $PRODUCT_ID"
echo "  Current Qty: ${CURRENT_QTY}g"
echo ""

# Test 1: Location-Specific Adjustment
echo "🔧 TEST 1: Location-Specific Adjustment (+5g)"
echo "=============================================="
ADJUST_RESULT=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/adjust" \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: $VENDOR_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"locationId\": \"$LOC1\",
    \"adjustment\": 5.0,
    \"reason\": \"Test adjustment from automated test\"
  }")

echo "$ADJUST_RESULT" | jq '.' 2>/dev/null || echo "$ADJUST_RESULT"
echo ""

# Test 2: Stock Transfer Between Locations
if [ ! -z "$LOC2" ]; then
  echo "🔄 TEST 2: Stock Transfer Between Locations (2.5g)"
  echo "=================================================="
  echo "  From: Location 1"
  echo "  To: Location 2"
  
  TRANSFER_RESULT=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/transfer" \
    -H "Content-Type: application/json" \
    -H "x-vendor-id: $VENDOR_ID" \
    -d "{
      \"productId\": \"$PRODUCT_ID\",
      \"fromLocationId\": \"$LOC1\",
      \"toLocationId\": \"$LOC2\",
      \"quantity\": 2.5,
      \"reason\": \"Test transfer from automated test\"
    }")
  
  echo "$TRANSFER_RESULT" | jq '.' 2>/dev/null || echo "$TRANSFER_RESULT"
else
  echo "⚠️  Skipping transfer test - need at least 2 locations"
fi
echo ""

# Test 3: Verify changes
echo "✅ TEST 3: Verifying Changes"
echo "============================="
UPDATED_INVENTORY=$(curl -s "http://localhost:3000/api/vendor/inventory" -H "x-vendor-id: $VENDOR_ID")
UPDATED_QTY=$(echo "$UPDATED_INVENTORY" | jq -r ".inventory[] | select(.product_id==\"$PRODUCT_ID\") | .quantity" 2>/dev/null | head -1)
echo "  Updated total quantity: ${UPDATED_QTY}g"
echo ""

echo "=================================================="
echo "📋 BROWSER TESTING INSTRUCTIONS"
echo "=================================================="
echo ""
echo "1. Open: http://localhost:3000/vendor/inventory"
echo ""
echo "2. Look for product: $PRODUCT_NAME"
echo ""
echo "3. Click to expand the product card"
echo ""
echo "4. Click the 'Location Inventory' tab (new!)"
echo ""
echo "5. You should see:"
echo "   - All vendor locations with stock levels"
echo "   - Adjustment controls (Add/Remove buttons)"
echo "   - Transfer form (if 2+ locations)"
echo ""
echo "6. Try these actions:"
echo "   - Enter '10' and click 'Add' at any location"
echo "   - Enter '5' and click 'Remove' at any location"
echo "   - Use the transfer form to move stock between locations"
echo ""
echo "=================================================="

