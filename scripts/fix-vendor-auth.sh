#!/bin/bash

# Script to fix all vendor endpoints to use requireVendor middleware
# instead of insecure x-vendor-id header

echo "🔧 Fixing vendor endpoint authentication..."

VENDOR_API_DIR="app/api/vendor"

# Find all route.ts files that use x-vendor-id header
grep -rl "headers.get('x-vendor-id')" "$VENDOR_API_DIR" | while read -r file; do
  echo "Fixing: $file"
  
  # Check if file already imports requireVendor
  if ! grep -q "import.*requireVendor" "$file"; then
    # Add import after getServiceSupabase import
    sed -i '' "/import.*getServiceSupabase/a\\
import { requireVendor } from '@/lib/auth/middleware';
" "$file"
  fi
  
  # Replace the vendor auth pattern
  # Old: const vendorId = request.headers.get('x-vendor-id'); if (!vendorId) return 401
  # New: const authResult = await requireVendor(request); if (authResult instanceof NextResponse) return authResult; const { vendorId } = authResult;
  
  perl -i -pe 's/const vendorId = request\.headers\.get\('"'"'x-vendor-id'"'"'\);?\s*if \(!vendorId\) \{\s*return NextResponse\.json\(\s*\{ error: '"'"'.*?'"'"' \},\s*\{ status: 401 \}\s*\);\s*\}/const authResult = await requireVendor(request);\n    if (authResult instanceof NextResponse) return authResult;\n    const { vendorId } = authResult;/gs' "$file"
  
done

echo "✅ All vendor endpoints fixed!"
echo "Files updated: $(grep -rl "requireVendor" "$VENDOR_API_DIR" | wc -l)"

