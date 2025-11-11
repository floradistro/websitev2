#!/bin/bash

# Kill existing dev server
echo "🛑 Killing existing dev server..."
pkill -f "next dev" || echo "No dev server running"

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -f tsconfig.tsbuildinfo

# Wait a moment
sleep 2

echo ""
echo "🚀 Starting FAST dev server with all optimizations..."
echo ""
echo "Optimizations active:"
echo "  ✅ React Strict Mode disabled"
echo "  ✅ Sentry disabled"
echo "  ✅ Source maps disabled"
echo "  ✅ 8GB Node memory"
echo "  ✅ Turbopack enabled (experimental)"
echo ""

# Start with Turbopack (fastest)
NEXT_DISABLE_SWC_SOURCEMAPS=1 \
NODE_OPTIONS="--max-old-space-size=8192" \
NEXT_PUBLIC_SENTRY_DISABLED=true \
npm run dev -- --turbo

# If turbopack fails, fallback to regular
if [ $? -ne 0 ]; then
    echo "⚠️  Turbopack failed, falling back to webpack..."
    NEXT_DISABLE_SWC_SOURCEMAPS=1 \
    NODE_OPTIONS="--max-old-space-size=8192" \
    NEXT_PUBLIC_SENTRY_DISABLED=true \
    npm run dev
fi
