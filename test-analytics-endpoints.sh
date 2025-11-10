#!/bin/bash

# Get vendor auth token from your browser's cookie
# You'll need to replace this with actual auth

VENDOR_ID="cd2e1122-d511-4edb-be5d-98ef274b4baf"
BASE_URL="http://localhost:3000/api/vendor/analytics/v2"

echo "=== TESTING ANALYTICS ENDPOINTS ==="
echo ""

echo "1. OVERVIEW:"
curl -s "${BASE_URL}/overview?range=30d" | jq '{success, data: {gross_sales, transaction_count, avg_transaction, items_sold, top_product}}'
echo ""

echo "2. BY DAY:"
curl -s "${BASE_URL}/sales/by-day?range=30d" | jq '{success, total_records: .metadata.total_records, sample: .data[0:3]}'
echo ""

echo "3. BY LOCATION:"
curl -s "${BASE_URL}/sales/by-location?range=30d" | jq '{success, data}'
echo ""

echo "4. BY CATEGORY:"
curl -s "${BASE_URL}/sales/by-category?range=30d" | jq '{success, data}'
echo ""

echo "5. PRODUCTS PERFORMANCE:"
curl -s "${BASE_URL}/products/performance?range=30d" | jq '{success, total_records: .metadata.total_records, top_5: .data[0:5] | map({name: .product_name, revenue, units_sold})}'
echo ""

echo "6. ITEMIZED:"
curl -s "${BASE_URL}/sales/itemized?range=30d" | jq '{success, total_records: .metadata.total_records}'
echo ""

echo "7. BY EMPLOYEE:"
curl -s "${BASE_URL}/sales/by-employee?range=30d" | jq '{success, data}'
echo ""

echo "8. SESSIONS:"
curl -s "${BASE_URL}/sessions/summary?range=30d" | jq '{success, data}'
echo ""

echo "9. BY PAYMENT METHOD:"
curl -s "${BASE_URL}/sales/by-payment-method?range=30d" | jq '{success, data}'
echo ""

echo "10. PROFIT/LOSS:"
curl -s "${BASE_URL}/financial/profit-loss?range=30d" | jq '{success, data: {revenue, cogs, gross_profit, gross_margin}}'
echo ""
