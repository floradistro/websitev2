# 📋 How to Apply Supabase Migrations

## 🎯 The Issue

Migration files exist in `/supabase/migrations/` but aren't automatically applied to your Supabase database.

**You need to manually run them in Supabase SQL Editor.**

---

## ✅ Step-by-Step Guide

### 1. **Verify Current Database State**

Run this in Supabase SQL Editor:
```
Open: VERIFY_DATABASE_SETUP.sql
Copy all → Paste in SQL Editor → Run
```

This shows which tables exist vs missing.

---

### 2. **Run Missing Migrations**

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Run migrations in this **EXACT ORDER**:

#### **Phase 1: Core Tables**
```sql
-- 1. Vendors (run first)
supabase/migrations/20241020_create_vendors.sql

-- 2. Products & Categories  
supabase/migrations/20251021_products_catalog.sql

-- 3. Locations & Inventory
supabase/migrations/20251021_inventory_system.sql

-- 4. Orders
supabase/migrations/20251021_orders.sql

-- 5. Reviews & Coupons
supabase/migrations/20251021_reviews_coupons.sql

-- 6. Users & Employees (RBAC)
supabase/migrations/20251021_users_employees_rbac.sql

-- 7. Customers
supabase/migrations/20251021_customers.sql
```

#### **Phase 2: Extended Features**
```sql
-- 8. Vendor Extended (COAs, Settings, Analytics)
supabase/migrations/20251021_vendor_extended.sql

-- 9. Vendor Custom Domains
supabase/migrations/20251021_vendor_custom_domains.sql

-- 10. Storage Setup
supabase/migrations/20251021_storage_setup.sql

-- 11. Multi-location Enhancement
supabase/migrations/20251021_enhance_locations_for_multi_location.sql

-- 12. Field Groups
supabase/migrations/20251022_field_groups.sql

-- 13. Vendor Pricing Tiers
supabase/migrations/20251022_vendor_pricing_tiers.sql

-- 14. Purchase Orders (NEW)
supabase/migrations/20251023_purchase_orders.sql

-- 15. Performance Indexes
supabase/migrations/add_performance_indexes.sql
```

#### **Phase 3: Data Setup**
```sql
-- 16. Add Flora Distro locations
supabase/migrations/20251021_add_flora_distro_locations.sql

-- 17. Add vendor contact fields
supabase/migrations/20251021_add_vendor_contact_fields.sql
```

---

## 🚀 Quick Method (Copy All at Once)

For each migration file:
1. Open file in your code editor
2. Copy **ALL** contents
3. Go to Supabase SQL Editor
4. Paste and click **Run**
5. Check for ✅ success or ❌ errors
6. Move to next file

---

## ⚠️ Common Errors

### "relation already exists"
**Solution**: Skip that migration, it's already applied

### "column already exists"  
**Solution**: Normal, the `ALTER TABLE ADD COLUMN IF NOT EXISTS` will skip it

### "function does not exist"
**Solution**: Run earlier migrations first (order matters!)

### "permission denied"
**Solution**: You need to be logged in as service_role or postgres user

---

## 🔍 Verify After Migration

Run `VERIFY_DATABASE_SETUP.sql` again to confirm all tables exist.

Expected results:
```
✅ vendors
✅ products
✅ inventory
✅ locations
✅ categories
✅ stock_movements
✅ purchase_orders
✅ purchase_order_items
✅ vendor_coas
✅ field_groups
✅ orders
✅ users
✅ pos_transactions
```

---

## 📝 What Each Migration Does

| File | What It Creates |
|------|-----------------|
| `20241020_create_vendors.sql` | Vendors table, auth |
| `20251021_products_catalog.sql` | Products, variations, tags |
| `20251021_inventory_system.sql` | Inventory, stock movements, locations, POS |
| `20251021_vendor_extended.sql` | **vendor_coas**, branding, settings |
| `20251021_storage_setup.sql` | Storage buckets, policies |
| `20251023_purchase_orders.sql` | **Purchase order system** |
| `20251022_field_groups.sql` | Field groups for categories |
| `20251021_enhance_locations_for_multi_location.sql` | Multi-location billing |

---

## 🎯 Critical for Your Features

These migrations are **REQUIRED** for features to work:

**Inventory Management:**
- ✅ `20251021_inventory_system.sql` (inventory, locations, stock_movements)
- ✅ `20251021_enhance_locations_for_multi_location.sql` (multi-location)

**Purchase Orders:**
- ✅ `20251023_purchase_orders.sql` (purchase_orders, purchase_order_items, receives)

**COA Upload:**
- ✅ `20251021_vendor_extended.sql` (vendor_coas table)
- ✅ `20251021_storage_setup.sql` (vendor-coas bucket)

**Products:**
- ✅ `20251021_products_catalog.sql` (products table)

---

## 💡 Pro Tip

If you want to run ALL migrations at once:

1. Combine all migration files into one big SQL file
2. Run once in SQL Editor
3. Ignore "already exists" errors
4. Verify with `VERIFY_DATABASE_SETUP.sql`

---

## 🎉 After Running Migrations

Your database will have:
- All tables
- All RLS policies
- All storage buckets
- All triggers and functions
- All indexes

Then your app features will work perfectly!

---

**Status**: vendor_coas now exists (you ran it) ✅  
**Next**: Run remaining migrations if any tables are missing

