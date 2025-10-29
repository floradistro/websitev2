#!/bin/bash

echo "🔍 Finding your Alpine IQ User ID..."
echo ""

# Try to get user info from Alpine IQ API
RESPONSE=$(curl -s -H 'X-APIKEY: U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw' \
  'https://lab.alpineiq.com/api/v2/user/info' 2>&1)

echo "Response: $RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"userID"'; then
  USER_ID=$(echo "$RESPONSE" | jq -r '.data.userID')
  echo "✅ Found User ID: $USER_ID"
  echo ""
  echo "Update your .env.local with:"
  echo "ALPINEIQ_USER_ID=$USER_ID"
else
  echo "❌ Couldn't automatically get User ID"
  echo ""
  echo "📋 To get your User ID manually:"
  echo "1. Log in to https://lab.alpineiq.com/"
  echo "2. Go to Settings → API"
  echo "3. Copy your 4-digit User ID"
  echo "4. Add it to .env.local: ALPINEIQ_USER_ID=YOUR_ID"
fi

echo ""
echo "📚 After adding User ID, test the connection:"
echo "   curl -H 'X-APIKEY: U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw' \\"
echo "        'https://lab.alpineiq.com/api/v1.1/stores/YOUR_USER_ID'"
