#!/bin/bash

# ============================================================================
# DOCUMENTATION CLEANUP SCRIPT
# ============================================================================
# Organizes 34+ markdown files into a clean structure:
# - Current docs stay in root (README, GETTING_STARTED)
# - Completed fixes archived
# - Analysis docs archived
# - Deployment guides archived
# ============================================================================

set -e

BASE_DIR="/Users/whale/Desktop/whaletools"
ARCHIVE_DIR="$BASE_DIR/docs/archive"
CURRENT_DIR="$BASE_DIR/docs/current"

echo "📚 Organizing Documentation..."
echo "================================"

# ============================================================================
# KEEP IN ROOT (Current/Active Docs)
# ============================================================================
KEEP_IN_ROOT=(
  "README.md"
  "GETTING_STARTED.md"
  "FINAL_TEST_REPORT.md"
  "ATOMIC_OPERATIONS_STATUS_REPORT.md"
)

# ============================================================================
# ARCHIVE: Completed Fixes
# ============================================================================
COMPLETED_FIXES=(
  "CRITICAL_FIXES.md"
  "MISSION_CRITICAL_FIXES_COMPLETE.md"
  "P0_CRITICAL_FIXES_REPORT.md"
  "P1_FIXES_SUMMARY.md"
  "FINAL_VERIFICATION_REPORT.md"
  "PRICING_DISPLAY_FIX.md"
  "PRICING_TIER_FIX.md"
  "CATEGORY_CASE_SENSITIVITY_FIX.md"
  "SLOW_DEV_SERVER_FIX.md"
  "PRODUCTS_FIX_SUMMARY.md"
  "TESTING_POS_CRITICAL_FIXES.md"
  "TODAYS_WORK_NOV13.md"
)

# ============================================================================
# ARCHIVE: Deployment Guides (Completed)
# ============================================================================
DEPLOYMENT_GUIDES=(
  "DEPLOY_ATOMIC_SESSIONS.md"
  "DEPLOY_VOID_FIX.md"
  "DEPLOY_PRODUCT_CREATION_FIX.md"
  "DEPLOY_MIGRATIONS.md"
  "DEPLOY_INSTRUCTIONS_ATOMIC_PRODUCT.md"
  "REDEPLOY_EDGE_CASE_FIXES.md"
  "REDEPLOY_PRODUCT_CREATION.md"
  "DATABASE_CLI_SETUP.md"
)

# ============================================================================
# ARCHIVE: Analysis Documents
# ============================================================================
ANALYSIS_DOCS=(
  "ANALYSIS_INDEX.md"
  "ARCHITECTURE_ANALYSIS.md"
  "POS_SESSION_CRITICAL_ANALYSIS.md"
  "PRODUCTS_SYSTEM_ANALYSIS.md"
  "INVENTORY_SYSTEM_COMPLETE.md"
  "MEDIA_LIBRARY_FEATURE_AUDIT.md"
  "PWA_UPDATE_IMPLEMENTATION_SUMMARY.md"
  "FOCUSED_LOCATION_MODE.md"
  "RESTORE_SUMMARY.md"
  "QUICK_REFERENCE.md"
)

# ============================================================================
# Archive Completed Fixes
# ============================================================================
echo ""
echo "📦 Archiving completed fixes..."
for file in "${COMPLETED_FIXES[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    mv "$BASE_DIR/$file" "$ARCHIVE_DIR/fixes/"
    echo "   ✅ Archived: $file"
  fi
done

# ============================================================================
# Archive Deployment Guides
# ============================================================================
echo ""
echo "📦 Archiving deployment guides..."
for file in "${DEPLOYMENT_GUIDES[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    mv "$BASE_DIR/$file" "$ARCHIVE_DIR/deployment/"
    echo "   ✅ Archived: $file"
  fi
done

# ============================================================================
# Archive Analysis Documents
# ============================================================================
echo ""
echo "📦 Archiving analysis documents..."
for file in "${ANALYSIS_DOCS[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    mv "$BASE_DIR/$file" "$ARCHIVE_DIR/analysis/"
    echo "   ✅ Archived: $file"
  fi
done

# ============================================================================
# Move Current Docs to docs/current
# ============================================================================
echo ""
echo "📋 Moving current docs to docs/current..."
mv "$BASE_DIR/FINAL_TEST_REPORT.md" "$CURRENT_DIR/" 2>/dev/null || true
mv "$BASE_DIR/ATOMIC_OPERATIONS_STATUS_REPORT.md" "$CURRENT_DIR/" 2>/dev/null || true

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "================================"
echo "✅ Documentation Cleanup Complete!"
echo ""
echo "📂 Structure:"
echo "   Root:                   $(ls -1 $BASE_DIR/*.md 2>/dev/null | wc -l | tr -d ' ') files (README, GETTING_STARTED)"
echo "   docs/current:           $(ls -1 $CURRENT_DIR/*.md 2>/dev/null | wc -l | tr -d ' ') files (active reports)"
echo "   docs/archive/fixes:     $(ls -1 $ARCHIVE_DIR/fixes/*.md 2>/dev/null | wc -l | tr -d ' ') files"
echo "   docs/archive/deployment: $(ls -1 $ARCHIVE_DIR/deployment/*.md 2>/dev/null | wc -l | tr -d ' ') files"
echo "   docs/archive/analysis:  $(ls -1 $ARCHIVE_DIR/analysis/*.md 2>/dev/null | wc -l | tr -d ' ') files"
echo ""
echo "📖 Active Docs:"
ls -1 $BASE_DIR/*.md 2>/dev/null || echo "   (none in root)"
echo ""
