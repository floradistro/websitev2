#!/bin/bash

# Script to validate codebase doesn't have "flash then disappear" bug patterns
# Run this before committing or in CI/CD

echo "🔍 Checking for problematic animation patterns..."

ERRORS=0

# Check for animate-fadeIn usage
if grep -r "animate-fadeIn" --include="*.tsx" --include="*.jsx" app/ components/ 2>/dev/null | grep -v "DEPRECATED"; then
    echo "❌ ERROR: Found animate-fadeIn usage! This causes 'flash then disappear' bugs."
    echo "   See docs/POSITIONING_BEST_PRACTICES.md"
    ERRORS=$((ERRORS + 1))
fi

# Check for Tailwind animate-in usage (excluding comments)
if grep -r "className.*animate-in" --include="*.tsx" --include="*.jsx" app/ components/ 2>/dev/null; then
    echo "❌ ERROR: Found Tailwind animate-in usage! This hides elements after animation."
    echo "   See docs/POSITIONING_BEST_PRACTICES.md"
    ERRORS=$((ERRORS + 1))
fi

# Check for animate-scaleIn usage
if grep -r "animate-scaleIn" --include="*.tsx" --include="*.jsx" app/ components/ 2>/dev/null | grep -v "DEPRECATED"; then
    echo "❌ ERROR: Found animate-scaleIn usage! This causes 'flash then disappear' bugs."
    echo "   See docs/POSITIONING_BEST_PRACTICES.md"
    ERRORS=$((ERRORS + 1))
fi

# Check for fixed/absolute with overflow-hidden parent (more complex pattern)
echo "⚠️  Warning: Manual review recommended for fixed/absolute positioning with overflow-hidden parents"

if [ $ERRORS -eq 0 ]; then
    echo "✅ No problematic animation patterns found!"
    exit 0
else
    echo ""
    echo "❌ Found $ERRORS problematic pattern(s)"
    echo "📖 Fix guide: docs/POSITIONING_BEST_PRACTICES.md"
    exit 1
fi
