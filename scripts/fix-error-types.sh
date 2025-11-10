#!/bin/bash
# Fix error: any to proper typed error handling

echo "Fixing error types in API routes..."

fixed=0

# Find all API route files with 'error: any'
find app/api -name "*.ts" -type f | while read -r file; do
  if grep -q "error: any" "$file"; then
    echo "Processing: $file"

    # Replace 'catch (error: any)' with 'catch (error)'
    sed -i '' 's/catch (error: any)/catch (error)/g' "$file"

    # Add import if file has catch blocks but no toError import
    if ! grep -q 'from "@/lib/errors"' "$file" && grep -q 'catch (error)' "$file"; then
      # Find the last import line and add our import after it
      last_import=$(grep -n "^import .* from" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i '' "${last_import}a\\
import { toError } from \"@/lib/errors\";
" "$file"
      fi
    fi

    ((fixed++))
  fi
done

echo ""
echo "✅ Processed $fixed files"
echo "Note: Manual addition of 'const err = toError(error);' lines still needed"
