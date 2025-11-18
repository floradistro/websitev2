#!/bin/bash

# Quick migration runner
# Usage: ./run-migration.sh

echo "🔧 Applying loyalty fix migration..."
echo ""

# Load password from .env
source ~/.zshrc

# Apply migration via psql
export PGPASSWORD="${SUPABASE_DB_PASSWORD}"

psql "postgresql://postgres@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres" \
  -f supabase/migrations/20251117000002_set_vendor_context_function.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "Now reload your React Native app - loyalty should work!"
else
  echo ""
  echo "❌ Migration failed. Please run manually via Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new"
  echo ""
  echo "SQL to run:"
  cat supabase/migrations/20251117000002_set_vendor_context_function.sql
fi
