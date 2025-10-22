#!/bin/bash

echo "🔍 Finding vendor with inventory..."
echo ""

# The terminal logs showed a vendor with 97 items and 6 locations
# Let's get all vendors and their inventory counts
curl -s 'http://localhost:3000/api/admin/vendors' | jq -r '.vendors[] | "\(.id) | \(.company_name)"' 2>/dev/null | while read line; do
  VID=$(echo "$line" | cut -d'|' -f1 | xargs)
  VNAME=$(echo "$line" | cut -d'|' -f2 | xargs)
  
  # Check inventory count
  INV_COUNT=$(curl -s "http://localhost:3000/api/vendor/inventory" -H "x-vendor-id: $VID" | jq -r '.inventory | length' 2>/dev/null || echo "0")
  
  if [ "$INV_COUNT" -gt "0" ]; then
    echo "✅ $VNAME: $INV_COUNT items"
    echo "   Vendor ID: $VID"
    
    # Test with this vendor
    echo ""
    echo "🧪 Testing with this vendor..."
    echo "================================"
    
    # Get locations
    LOCATIONS=$(curl -s "http://localhost:3000/api/vendor/locations" -H "x-vendor-id: $VID")
    LOC_COUNT=$(echo "$LOCATIONS" | jq -r '.locations | length' 2>/dev/null || echo "0")
    echo "📍 Locations: $LOC_COUNT"
    echo "$LOCATIONS" | jq -r '.locations[] | "  - \(.name) [\(.id)]"' 2>/dev/null
    
    # Get first product
    INVENTORY=$(curl -s "http://localhost:3000/api/vendor/inventory" -H "x-vendor-id: $VID")
    PRODUCT_ID=$(echo "$INVENTORY" | jq -r '.inventory[0].product_id' 2>/dev/null)
    PRODUCT_NAME=$(echo "$INVENTORY" | jq -r '.inventory[0].product_name' 2>/dev/null)
    CURRENT_QTY=$(echo "$INVENTORY" | jq -r '.inventory[0].quantity' 2>/dev/null)
    
    echo ""
    echo "📦 Test Product: $PRODUCT_NAME"
    echo "   ID: $PRODUCT_ID"
    echo "   Current Qty: ${CURRENT_QTY}g"
    echo ""
    
    # Get location IDs
    LOC1=$(echo "$LOCATIONS" | jq -r '.locations[0].id' 2>/dev/null)
    LOC2=$(echo "$LOCATIONS" | jq -r '.locations[1].id' 2>/dev/null)
    
    # Test adjustment
    echo "🔧 Testing Adjustment (+3.5g)..."
    ADJUST=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/adjust" \
      -H "Content-Type: application/json" \
      -H "x-vendor-id: $VID" \
      -d "{\"productId\":\"$PRODUCT_ID\",\"locationId\":\"$LOC1\",\"adjustment\":3.5,\"reason\":\"Test adjustment\"}")
    
    SUCCESS=$(echo "$ADJUST" | jq -r '.success' 2>/dev/null)
    if [ "$SUCCESS" = "true" ]; then
      echo "✅ Adjustment successful!"
      echo "$ADJUST" | jq '{previous_quantity, new_quantity, was_created}' 2>/dev/null
    else
      echo "❌ Adjustment failed:"
      echo "$ADJUST" | jq '.error' 2>/dev/null || echo "$ADJUST"
    fi
    
    # Test transfer if 2+ locations
    if [ ! -z "$LOC2" ] && [ "$LOC2" != "null" ]; then
      echo ""
      echo "🔄 Testing Transfer (1.0g)..."
      TRANSFER=$(curl -s -X POST "http://localhost:3000/api/vendor/inventory/transfer" \
        -H "Content-Type: application/json" \
        -H "x-vendor-id: $VID" \
        -d "{\"productId\":\"$PRODUCT_ID\",\"fromLocationId\":\"$LOC1\",\"toLocationId\":\"$LOC2\",\"quantity\":1.0,\"reason\":\"Test transfer\"}")
      
      SUCCESS=$(echo "$TRANSFER" | jq -r '.success' 2>/dev/null)
      if [ "$SUCCESS" = "true" ]; then
        echo "✅ Transfer successful!"
        echo "$TRANSFER" | jq '.message' 2>/dev/null
        echo "$TRANSFER" | jq '.transfer' 2>/dev/null
      else
        echo "❌ Transfer failed:"
        echo "$TRANSFER" | jq '.error' 2>/dev/null || echo "$TRANSFER"
      fi
    fi
    
    echo ""
    echo "=================================================="
    echo "🌐 BROWSER TEST"
    echo "=================================================="
    echo ""
    echo "Visit: http://localhost:3000/vendor/inventory"
    echo ""
    echo "Find: $PRODUCT_NAME"
    echo ""
    echo "Actions to test:"
    echo "  1. Expand the product card"
    echo "  2. Click 'Location Inventory' tab"
    echo "  3. See all $LOC_COUNT locations with stock"
    echo "  4. Use Add/Remove buttons"
    echo "  5. Try the transfer form"
    echo ""
    
    # Only test first vendor with inventory
    break
  fi
done

