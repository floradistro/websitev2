#!/bin/bash

# Verify CORS headers are correctly set
echo "🧪 Testing CORS headers on WordPress API..."
echo ""

DOMAINS=(
    "https://websitev2-ashen.vercel.app"
    "https://web2-6dg9ueyq1-floradistros-projects.vercel.app"
    "http://localhost:3000"
)

for DOMAIN in "${DOMAINS[@]}"; do
    echo "Testing: $DOMAIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    CORS_HEADER=$(curl -s -I \
        -H "Origin: $DOMAIN" \
        -H "Access-Control-Request-Method: POST" \
        https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
        | grep -i "access-control-allow-origin")
    
    if [ -z "$CORS_HEADER" ]; then
        echo "❌ NO CORS header returned"
    else
        ALLOWED_ORIGIN=$(echo $CORS_HEADER | cut -d: -f2- | xargs)
        if [ "$ALLOWED_ORIGIN" == "$DOMAIN" ]; then
            echo "✅ CORS header correct: $ALLOWED_ORIGIN"
        else
            echo "⚠️  CORS header mismatch!"
            echo "   Expected: $DOMAIN"
            echo "   Got:      $ALLOWED_ORIGIN"
        fi
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Full CORS headers:"
curl -s -I \
    -H "Origin: https://websitev2-ashen.vercel.app" \
    https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
    | grep -i "access-control"

