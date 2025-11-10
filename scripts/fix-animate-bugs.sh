#!/bin/bash

# Automated script to remove problematic animate-fadeIn and animate-scaleIn classes
echo "🔧 Fixing problematic animation classes..."

# List of files to fix
FILES=(
  "components/DeliveryAvailability.tsx"
  "components/VendorDevTools.tsx"
  "components/ImageLightbox.tsx"
  "components/LocationDropdown.tsx"
  "components/VendorSupportChat.tsx"
  "components/SearchModal.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing $file..."

    # Remove animate-fadeIn (keep other classes)
    sed -i '' 's/ animate-fadeIn//g' "$file"
    sed -i '' 's/animate-fadeIn //g' "$file"

    # Remove animate-scaleIn (keep other classes)
    sed -i '' 's/ animate-scaleIn//g' "$file"
    sed -i '' 's/animate-scaleIn //g' "$file"

    echo "  ✅ Fixed $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ All files fixed!"
echo "📝 Note: You may need to add CSS transitions manually where animations were removed"
