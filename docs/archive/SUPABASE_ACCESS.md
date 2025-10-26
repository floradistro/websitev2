# 🔐 SUPABASE DATABASE - PERMANENT ACCESS CONFIGURATION

## Database Credentials (Always Available)

```
Host: db.uaednwpxursknmwdeejn.supabase.co
Port: 5432
User: postgres
Password: SelahEsco123!!
Database: postgres
Project: uaednwpxursknmwdeejn
```

## Connection String:
```
postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres
```

---

## 🛠️ Usage Methods:

### Method 1: Direct psql Command
```bash
PGPASSWORD='SelahEsco123!!' psql -h db.uaednwpxursknmwdeejn.supabase.co -p 5432 -U postgres -d postgres -c "SELECT NOW();"
```

### Method 2: Source the Config
```bash
source .cursor/db-config.sh
query "SELECT COUNT(*) FROM products;"
```

### Method 3: TypeScript Script
```bash
ts-node scripts/db-query.ts "SELECT * FROM products LIMIT 5;"
ts-node scripts/db-query.ts --file migrations/my-migration.sql
```

### Method 4: Automated Test Script
```bash
./run-pricing-tests.sh
```

---

## 📋 Common Queries:

### Check Pricing Configs:
```sql
SELECT 
  jsonb_pretty(pricing_values) 
FROM vendor_pricing_configs 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```

### Check Products:
```sql
SELECT id, name, price, cost_price, stock_quantity 
FROM products 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' 
LIMIT 10;
```

### Check Inventory:
```sql
SELECT p.name, i.quantity, l.name as location
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN locations l ON i.location_id = l.id
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
LIMIT 10;
```

---

## 🤖 For Cursor AI:

When I need to:
- Run SQL queries
- Check database state
- Verify changes
- Test features

I can use any of the methods above with the credentials from this file.

**No need to ask the user for credentials - they're permanently stored here.**

---

## ⚡ Quick Reference:

**Vendor ID (Flora Distro):** `cd2e1122-d511-4edb-be5d-98ef274b4baf`

**Common Tables:**
- `products` - All products
- `vendors` - Vendor accounts
- `vendor_pricing_configs` - Pricing configurations
- `pricing_tier_blueprints` - Pricing templates
- `inventory` - Stock levels
- `locations` - Warehouse/store locations
- `orders` - Customer orders
- `order_items` - Order line items

---

This configuration persists across all Cursor sessions! 🎉

