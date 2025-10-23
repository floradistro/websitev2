#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🧪 COMPLETE PRICING SYSTEM TEST - AUTOMATED"
echo "═══════════════════════════════════════════════════════════"
echo ""

DB_HOST="db.uaednwpxursknmwdeejn.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASS="SelahEsco123!!"

echo "Test 1: Database Tier Status"
echo "────────────────────────────────────────────────────────────"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  jsonb_object_keys(pricing_values) as tier,
  (pricing_values->jsonb_object_keys(pricing_values))->>'enabled' as enabled,
  (pricing_values->jsonb_object_keys(pricing_values))->>'price' as price
FROM vendor_pricing_configs 
WHERE id = '8900ffa8-ff63-4c6c-bb64-a793c0bc9469'
ORDER BY tier;
"

echo ""
echo "Test 2: API Returns Only Enabled Tiers"
echo "────────────────────────────────────────────────────────────"
RESPONSE=$(curl -s http://localhost:3000/api/supabase/products/d975091b-89a1-4748-8ea9-c998617973a8/pricing)
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "Test 3: Count Returned Tiers"
echo "────────────────────────────────────────────────────────────"
TIER_COUNT=$(echo "$RESPONSE" | grep -o "break_id" | wc -l | tr -d ' ')
echo "Tiers returned by API: $TIER_COUNT"
echo "Expected: 4 (1g, 7g, 14g, 28g)"
echo "Disabled tier (3.5g): Should NOT be in list"

echo ""
echo "Test 4: Verify Specific Tiers"
echo "────────────────────────────────────────────────────────────"
echo "1g present:   $(echo $RESPONSE | grep -q '\"break_id\":\"1g\"' && echo '✅ YES' || echo '❌ NO')"
echo "3.5g present: $(echo $RESPONSE | grep -q '\"break_id\":\"3_5g\"' && echo '❌ FAIL (should be hidden)' || echo '✅ PASS (correctly hidden)')"
echo "7g present:   $(echo $RESPONSE | grep -q '\"break_id\":\"7g\"' && echo '✅ YES' || echo '❌ NO')"
echo "14g present:  $(echo $RESPONSE | grep -q '\"break_id\":\"14g\"' && echo '✅ YES' || echo '❌ NO')"
echo "28g present:  $(echo $RESPONSE | grep -q '\"break_id\":\"28g\"' && echo '✅ YES' || echo '❌ NO')"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎯 FINAL RESULT"
echo "═══════════════════════════════════════════════════════════"

if [ "$TIER_COUNT" -eq 4 ] && ! echo "$RESPONSE" | grep -q '3_5g'; then
  echo "✅ ALL TESTS PASSED!"
  echo "   - Disabled tier (3.5g) is hidden from customers"
  echo "   - Enabled tiers (1g, 7g, 14g, 28g) are showing"
  echo "   - Toggle feature working end-to-end"
else
  echo "❌ TESTS FAILED"
  echo "   - Expected 4 tiers, got $TIER_COUNT"
fi

echo ""

