#!/bin/bash

# Supabase Database Configuration
# Permanent credentials for Yacht Club project

export SUPABASE_HOST="db.uaednwpxursknmwdeejn.supabase.co"
export SUPABASE_PORT="5432"
export SUPABASE_USER="postgres"
export SUPABASE_PASSWORD="SelahEsco123!!"
export SUPABASE_DB="postgres"

export DATABASE_URL="postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres"

# Helper function for quick queries
db_query() {
    psql "$DATABASE_URL" -c "$1"
}

# Helper function for SQL files
db_file() {
    psql "$DATABASE_URL" -f "$1"
}

# Flora Distro Vendor ID
export FLORA_DISTRO_ID="cd2e1122-d511-4edb-be5d-98ef274b4baf"

echo "✅ Database config loaded"
echo "   Host: $SUPABASE_HOST"
echo "   Database: $SUPABASE_DB"
echo "   Flora Distro ID: $FLORA_DISTRO_ID"
