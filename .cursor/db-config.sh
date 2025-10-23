#!/bin/bash

# ============================================================================
# SUPABASE DATABASE CONFIGURATION
# This file provides permanent database access for all Cursor AI sessions
# ============================================================================

export DB_HOST="db.uaednwpxursknmwdeejn.supabase.co"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_NAME="postgres"
export DB_PASS="SelahEsco123!!"

# Connection string for easy access
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Helper function to run SQL
function run_sql() {
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Helper function to run SQL from file
function run_sql_file() {
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$1"
}

# Helper function to run SQL command directly
function query() {
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1"
}

# Export functions
export -f run_sql
export -f run_sql_file
export -f query

echo "✅ Database config loaded"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""
echo "📋 Available commands:"
echo "   run_sql -c 'SELECT NOW();'"
echo "   run_sql_file migration.sql"
echo "   query 'SELECT COUNT(*) FROM products;'"

