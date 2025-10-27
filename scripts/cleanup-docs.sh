#!/bin/bash

# Clean up documentation clutter
# Consolidates scattered docs into organized structure

echo "📚 Cleaning up documentation..."

# Move root-level doc files to docs/ or docs/archive/
ROOT_DOCS=(
  "AI_SUPERPOWERS_GUIDE.md"
  "AI_THOROUGHNESS_UPGRADE.md"
  "CODE_ANALYSIS_REPORT.md"
  "CURRENT_STATE.md"
  "EXA_INTEGRATION_GUIDE.md"
  "FINAL_FIXES_SUMMARY.md"
  "FULL_PAGE_AI_GUIDE.md"
  "INSTALLATION_COMPLETE.md"
  "MASTER_UPGRADE_COMPLETE.md"
  "OPTIMIZATION_SUMMARY.md"
  "PARSER_MIGRATION_GUIDE.md"
  "PARSER_V2_INSTALLED.md"
  "POS_BUILD_SUMMARY.md"
  "POS_COMPONENT_AUDIT.md"
  "POS_FEATURES_COMPLETE.md"
  "POS_FINAL_STATUS.md"
  "POS_LEGACY_FEATURES_ANALYSIS.md"
  "POS_LOAD_TEST_REPORT.md"
  "POS_REMAINING_WORK.md"
  "POS_ROADMAP.md"
  "POS_TESTING_COMPLETE.md"
  "SMART_EDITING_GUIDE.md"
  "STREAMING_TOOLCHAIN_GUIDE.md"
  "WCL_ANALYSIS_SUMMARY.md"
  "WCL_ARCHITECTURE_DIAGRAM.md"
  "WCL_DEEP_ANALYSIS.md"
  "WCL_EDITOR_README.md"
  "WCL_QUICK_REFERENCE.md"
  "WCL_TEMPLATE_GUIDE.md"
  "WCL_UPGRADE_SUMMARY.md"
  "WHERE_IS_STREAMING.md"
)

# Archive old summary/status docs
for doc in "${ROOT_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "Archiving $doc"
    mv "$doc" "docs/archive/" 2>/dev/null || true
  fi
done

# Keep only essential root docs
KEEP_IN_ROOT=(
  "README.md"
  "QUICK_START.md"
)

echo "✅ Documentation cleanup complete!"
echo "📁 Archived files moved to docs/archive/"
echo "📄 Essential docs remain in root:"
for doc in "${KEEP_IN_ROOT[@]}"; do
  echo "   - $doc"
done

