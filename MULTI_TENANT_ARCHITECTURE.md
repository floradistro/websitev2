# Multi-Tenant Storefront Architecture

## Overview
Yacht Club uses a **unified data architecture** for both the main marketplace and individual vendor storefronts. This ensures consistency and prevents duplication.

## Architecture Pattern

### ✅ Correct Pattern: Unified Data Layer

```typescript
// lib/storefront/get-vendor.ts
export async function getVendorProducts(vendorId: string, limit?: number) {
  // 1. Fetch products with inventory and categories
  // 2. Fetch vendor pricing configs (from vendor_pricing_configs)
  // 3. Build pricing tiers from blueprint
  // 4. Format blueprint_fields properly
  // 5. Calculate stock from inventory
  // 6. Return unified product structure
}

export async function getVendorLocations() {
  // Fetch all locations with active flag
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  products    │  │  vendor_pricing  │  │    inventory    │  │
│  │              │  │    _configs      │  │                 │  │
│  │ - id         │  │ - vendor_id      │  │ - product_id    │  │
│  │ - name       │  │ - blueprint_id   │  │ - location_id   │  │
│  │ - vendor_id  │  │ - pricing_values │  │ - quantity      │  │
│  │ - blueprint  │  │ - is_active      │  │                 │  │
│  │   _fields    │  │                  │  │                 │  │
│  └──────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│          lib/storefront/get-vendor.ts (Data Layer)               │
│                                                                  │
│  getVendorProducts()  →  Returns unified structure:              │
│    - fields: { strain_type, effects, terpenes, ... }            │
│    - pricingTiers: [{ label, qty, price, ... }]                 │
│    - inventory: [{ location_id, quantity, ... }]                │
│    - stock_status: calculated from inventory                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Storefront Pages (View Layer)                   │
│                                                                  │
│  ┌─────────────────────┐       ┌─────────────────────┐         │
│  │  /storefront        │       │  /test-storefront   │         │
│  │  (Multi-tenant)     │       │  (Flora Distro)     │         │
│  │                     │       │                     │         │
│  │  Uses:              │       │  Uses:              │         │
│  │  - getVendorProducts│       │  - getVendorProducts│         │
│  │  - getVendorLocations       │  - getVendorLocations         │
│  └─────────────────────┘       └─────────────────────┘         │
│             ↓                              ↓                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │         components/storefront/ProductGrid.tsx         │      │
│  │         Uses: components/ProductCard.tsx              │      │
│  │         (Main ProductCard - single source of truth)   │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Data Fetching Layer (`lib/storefront/get-vendor.ts`)

**Responsibilities:**
- Fetch vendor information
- Fetch products with full relations (inventory, categories)
- Fetch vendor pricing configuration
- Build pricing tiers from blueprint
- Parse and format blueprint_fields
- Calculate stock status from inventory

**Key Functions:**
```typescript
getVendorProducts(vendorId, limit?)  // Returns products with all data
getVendorLocations()                 // Returns locations marked as active
getVendorStorefront(vendorId)        // Returns vendor info
```

### 2. Presentation Layer (`components/storefront/`)

**ProductGrid** - Wraps ProductCard for grid layout
- Takes products array and locations
- Maps data to ProductCard format
- Uses main ProductCard component

**ProductCard** (components/ProductCard.tsx)
- Single source of truth for product display
- Shows pricing tier selector
- Shows blueprint fields (Type, Effects, Terpenes, etc.)
- Shows stock status from inventory
- Handles add to cart with tier selection

## Routes

### Multi-Tenant Routes (`/storefront/*`)
- Uses middleware to detect vendor from domain/subdomain
- Headers contain `x-vendor-id`
- Fetches data via `getVendorFromHeaders()`

### Test Route (`/test-storefront/*`)
- Hardcoded to Flora Distro vendor
- Uses same unified data layer
- For development/testing

## Data Structure

### Product Object (Unified Format)
```typescript
{
  id: string,
  name: string,
  slug: string,
  price: number,
  
  // Blueprint fields (parsed from blueprint_fields)
  fields: {
    strain_type: string,
    effects: string[],
    terpenes: string[],
    thc_percentage: string,
    // ... category-specific fields
  },
  
  // Pricing tiers (from vendor_pricing_configs)
  pricingTiers: [{
    label: "1 gram",
    qty: 1,
    price: 14.99,
    weight: "1g",
    sort_order: 0
  }],
  
  // Inventory (from inventory table)
  inventory: [{
    location_id: string,
    quantity: number,
    location: { name, city, state }
  }],
  
  // Calculated stock
  stock_status: 'instock' | 'outofstock',
  stock_quantity: number,
  total_stock: number
}
```

## Benefits of This Architecture

✅ **Single Source of Truth** - One ProductCard component used everywhere
✅ **DRY Principle** - Data fetching logic in one place
✅ **Consistency** - Same display/behavior across all storefronts
✅ **Maintainability** - Fix once, works everywhere
✅ **Scalability** - Add new vendors without code changes
✅ **Type Safety** - Unified data structure

## Anti-Patterns (What NOT to Do)

❌ **Don't create separate ProductCard components per route**
❌ **Don't duplicate data fetching logic**
❌ **Don't bypass the unified data layer**
❌ **Don't use different data formats for different views**

## Adding a New Vendor Storefront

1. Vendor creates account
2. Configure `vendor_pricing_configs` (links to pricing blueprint)
3. Add products with `blueprint_fields`
4. Add inventory records
5. Storefront automatically works with unified architecture

No code changes needed!

## Troubleshooting

### "Tiers not showing"
- Check `vendor_pricing_configs` table has active config for vendor
- Verify `pricing_values` JSON has enabled tiers with prices
- Check `getVendorProducts()` is being called

### "Fields not showing"
- Check product has `blueprint_fields` JSON object
- Verify fields match labels in `ProductCard` fieldConfig
- Use database: `SELECT blueprint_fields FROM products WHERE id = '...'`

### "Stock not showing"
- Check `inventory` table has records for product
- Verify `quantity > 0` for at least one location
- Stock is calculated from inventory, not `stock_status` field

## Database Queries

```sql
-- Check vendor pricing config
SELECT v.store_name, vpc.vendor_id, ptb.name as blueprint_name, 
       (SELECT COUNT(*) FROM jsonb_object_keys(vpc.pricing_values)) as tier_count
FROM vendors v
JOIN vendor_pricing_configs vpc ON v.id = vpc.vendor_id
JOIN pricing_tier_blueprints ptb ON vpc.blueprint_id = ptb.id
WHERE v.slug = 'flora-distro' AND vpc.is_active = true;

-- Check product fields
SELECT name, blueprint_fields, 
       (SELECT COUNT(*) FROM inventory WHERE product_id = p.id) as inventory_count
FROM products p
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
AND status = 'published'
LIMIT 5;
```

## Summary

The Yacht Club multi-tenant architecture uses a **unified data layer** (`lib/storefront/get-vendor.ts`) that fetches and formats all product data consistently. All storefronts (main marketplace, vendor storefronts, test routes) use the same `ProductCard` component and data structure, ensuring consistency and maintainability.

**Key principle:** One data layer, one presentation component, infinite vendors.

