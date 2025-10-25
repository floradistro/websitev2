#!/bin/bash
# Restore Database Backup

if [ -z "$1" ]; then
  echo "Usage: ./restore-backup.sh TIMESTAMP"
  echo "Example: ./restore-backup.sh 20251025-010417"
  echo ""
  echo "Available backups:"
  ls -1 backups/*.csv 2>/dev/null | sed 's/.*-\([0-9-]*\)\.csv/  \1/' | sort -u
  exit 1
fi

TIMESTAMP=$1
BACKUP_DIR="/Users/whale/Desktop/Website/backups"

echo "=========================================="
echo "DATABASE RESTORE"
echo "=========================================="
echo "Restoring from: $TIMESTAMP"
echo ""

if [ ! -f "$BACKUP_DIR/products-$TIMESTAMP.csv" ]; then
  echo "❌ Backup not found: $BACKUP_DIR/products-$TIMESTAMP.csv"
  exit 1
fi

read -p "⚠️  This will REPLACE current Flora Distro data. Continue? (yes/no) " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "🗑️  Clearing current data..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
DELETE FROM inventory WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
DELETE FROM products WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
"

echo "📦 Restoring products..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
\copy products FROM '$BACKUP_DIR/products-$TIMESTAMP.csv' WITH (FORMAT CSV, HEADER TRUE);
"

echo "📊 Restoring inventory..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
\copy inventory FROM '$BACKUP_DIR/inventory-$TIMESTAMP.csv' WITH (FORMAT CSV, HEADER TRUE);
"

echo "🔗 Restoring product categories..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
\copy product_categories FROM '$BACKUP_DIR/product-categories-$TIMESTAMP.csv' WITH (FORMAT CSV, HEADER TRUE);
"

echo ""
echo "=========================================="
echo "✅ RESTORE COMPLETE"
echo "=========================================="

