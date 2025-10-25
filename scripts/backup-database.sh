#!/bin/bash
# Automated Database Backup Script
# Creates SQL dumps of critical Flora Distro data

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/Users/whale/Desktop/Website/backups"
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "DATABASE BACKUP - Flora Distro"
echo "=========================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# Backup products
echo "📦 Backing up products..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
COPY (
  SELECT * FROM products 
  WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
) TO STDOUT WITH (FORMAT CSV, HEADER TRUE);
" > "$BACKUP_DIR/products-$TIMESTAMP.csv"
echo "✅ Products: $(wc -l < "$BACKUP_DIR/products-$TIMESTAMP.csv") rows"

# Backup inventory
echo "📊 Backing up inventory..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
COPY (
  SELECT * FROM inventory 
  WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
) TO STDOUT WITH (FORMAT CSV, HEADER TRUE);
" > "$BACKUP_DIR/inventory-$TIMESTAMP.csv"
echo "✅ Inventory: $(wc -l < "$BACKUP_DIR/inventory-$TIMESTAMP.csv") rows"

# Backup product_categories links
echo "🔗 Backing up product categories..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "
COPY (
  SELECT pc.* FROM product_categories pc
  JOIN products p ON pc.product_id = p.id
  WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
) TO STDOUT WITH (FORMAT CSV, HEADER TRUE);
" > "$BACKUP_DIR/product-categories-$TIMESTAMP.csv"
echo "✅ Product Categories: $(wc -l < "$BACKUP_DIR/product-categories-$TIMESTAMP.csv") rows"

# Create JSON backup for easier restore
echo "📄 Creating JSON backup..."
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -t -c "
SELECT json_agg(p.*) 
FROM products p
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
" > "$BACKUP_DIR/products-$TIMESTAMP.json"
echo "✅ JSON backup created"

# Summary
echo ""
echo "=========================================="
echo "✅ BACKUP COMPLETE"
echo "=========================================="
echo "Location: $BACKUP_DIR"
echo "Files:"
ls -lh "$BACKUP_DIR/"*$TIMESTAMP* | awk '{print "  " $9, "-", $5}'
echo ""
echo "To restore: ./scripts/restore-backup.sh $TIMESTAMP"

