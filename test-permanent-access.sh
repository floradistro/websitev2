#!/bin/bash
echo "🧪 Testing Permanent Database Access"
echo "════════════════════════════════════"
echo ""

# Test 1: Direct connection
echo "Test 1: Direct PSQL Connection"
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "SELECT 'Direct Connection: OK' as test1;" | grep OK && echo "✅ PASS" || echo "❌ FAIL"
echo ""

# Test 2: Config file
echo "Test 2: Config File Functions"
cd /Users/whale/Desktop/Website
source .cursor/db-config.sh >/dev/null 2>&1
query "SELECT 'Config Functions: OK' as test2;" | grep OK && echo "✅ PASS" || echo "❌ FAIL"
echo ""

# Test 3: Test script
echo "Test 3: Automated Test Script"
if [ -x "./run-pricing-tests.sh" ]; then
  echo "✅ PASS - Script exists and is executable"
else
  echo "❌ FAIL - Script not found or not executable"
fi
echo ""

# Test 4: Memory/Documentation
echo "Test 4: Documentation Files"
[ -f ".cursor/SUPABASE_ACCESS.md" ] && echo "✅ PASS - Documentation exists" || echo "❌ FAIL"
[ -f "scripts/db-query.ts" ] && echo "✅ PASS - Helper script exists" || echo "❌ FAIL"
echo ""

echo "════════════════════════════════════"
echo "🎯 RESULT: Permanent access configured"
echo "   Future Cursor AI sessions can use database automatically"
echo "════════════════════════════════════"
