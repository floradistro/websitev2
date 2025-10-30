# Admin Approval System - Quick Reference

## Status Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

  VENDOR SUBMITS          ADMIN REVIEWS           CUSTOMER SEES
        │                      │                       │
        ├──────────────────────┤                       │
        ▼                      ▼                       ▼
  [pending]  ──────→  pending_products  ──────→  [HIDDEN]
                      dashboard (admin)
        │                      │
        │                      ├─→ [published] ─────→ VISIBLE
        │                      │
        │                      └─→ [archived] ─────→ HIDDEN
        │                              (rejected)
        │
        └─→ Email to vendor:
            "Product Submitted"
```

## Key API Endpoints

### Vendor APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/vendor/products` | POST | Create product (→pending) |
| `/api/vendor/products` | GET | View own products |
| `/api/vendor/products/[id]` | PUT | Update own product |
| `/api/vendor/pricing-config` | GET | View pricing config |

### Admin APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/pending-products` | GET | List pending products for review |
| `/api/admin/approve-product` | POST | Approve (→published) or reject (→archived) |
| `/api/admin/products` | GET | View all products (all statuses) |
| `/api/admin/categories` | GET/POST/PATCH/DELETE | Manage categories |
| `/api/admin/pricing-blueprints` | GET/POST | Manage pricing blueprints |

## Database Tables (Key Relationships)

```
┌──────────────────┐
│    vendors       │
├──────────────────┤
│ id (PK)          │
│ store_name       │
│ email            │
│ vendor_type      │
└──────┬───────────┘
       │
       │ 1:M
       ▼
┌──────────────────┐         ┌─────────────────────────┐
│    products      │         │ pricing_tier_blueprints │
├──────────────────┤         ├─────────────────────────┤
│ id (PK)          │         │ id (PK)                 │
│ vendor_id (FK)   │─────┐   │ name                    │
│ name             │     │   │ slug                    │
│ status *         │     │   │ price_breaks (JSONB)    │
│ primary_cat...   │     │   │ tier_type               │
│ created_at       │     │   │ is_default              │
│ updated_at       │     │   │ applicable_to_...       │
└──────┬───────────┘     │   └──────────┬──────────────┘
       │                 │              │
       │ 1:M            │              │
       ▼                │              │
┌──────────────────────┐   │              │
│ product_categories   │   │              │
├──────────────────────┤   │              │
│ product_id (FK)  ◄──┘    │              │
│ category_id (FK)         │              │
│ is_primary               │              │
└──────────────────┘       │              │
                           │              │
                           │  1:M         │
                           ▼              ▼
                    ┌────────────────────────────────┐
                    │ product_pricing_assignments    │
                    ├────────────────────────────────┤
                    │ product_id (FK)                │
                    │ blueprint_id (FK)              │
                    │ price_overrides (JSONB)        │
                    │ is_active                      │
                    └────────────────────────────────┘
                           │
       ┌───────────────────┘
       │ M:1
       ▼
┌──────────────────┐
│  categories      │
├──────────────────┤
│ id (PK)          │
│ name             │
│ slug             │
│ parent_id (FK)   │
│ is_active        │
│ featured         │
└──────────────────┘
```

## Product Status Values

| Status | Visibility | Who Can See | Note |
|--------|------------|------------|------|
| `pending` | Private | Vendor, Admin | Waiting for admin review |
| `published` | Public | Everyone | Live on storefront |
| `archived` | Private | Vendor, Admin | Rejected or inactive |
| `draft` | Unused | - | Defined but not used |

## RLS Policies (Row Level Security)

### Products Table
```sql
-- Public sees only published
WHERE status = 'published'

-- Vendor sees own products (all statuses)
WHERE vendor_id = current_vendor

-- Admin (service role) sees all
WHERE auth.jwt()->>'role' = 'service_role'
```

### Categories Table
```sql
-- Public sees active categories
WHERE is_active = true

-- Admin (service role) manages all
WHERE auth.jwt()->>'role' = 'service_role'
```

### Pricing Blueprints Table
```sql
-- Public sees active blueprints
WHERE is_active = true

-- Admin (service role) manages all
WHERE auth.jwt()->>'role' = 'service_role'
```

## Approval Flow in Code

```typescript
// 1. VENDOR SUBMITS (app/api/vendor/products/route.ts:96)
newProduct.status = 'pending'  // ← Automatic

// 2. ADMIN REVIEWS (app/api/admin/pending-products/route.ts)
.eq('status', 'pending')  // ← Filter pending

// 3. ADMIN APPROVES (app/api/admin/approve-product/route.ts:28)
.update({ 
  status: 'published',    // ← Changed by admin
  date_on_sale_from: now
})

// OR ADMIN REJECTS (app/api/admin/approve-product/route.ts:88)
.update({ 
  status: 'archived'      // ← Changed by admin
})

// 4. CACHE INVALIDATION
productCache.invalidatePattern('products:.*')
vendorCache.invalidatePattern(`vendor-*`)
```

## Pricing Control

### 3-Level Hierarchy

```
1. BLUEPRINTS (Admin Controls)
   └── pricing_tier_blueprints table
       └── Defines structure: "Retail Flower", "Wholesale", etc.

2. VENDOR CONFIG (Vendor Implements)
   └── vendor_pricing_configs table
       └── Vendor sets prices for each tier in blueprint

3. PRODUCT ASSIGNMENT (Admin Applies)
   └── product_pricing_assignments table
       └── Links product to blueprint
       └── Optional: Product-specific overrides
```

### Example Pricing Flow

```json
BLUEPRINT (Admin):
{
  "name": "Retail Cannabis Flower",
  "price_breaks": [
    {"break_id": "1g", "qty": 1},
    {"break_id": "3_5g", "qty": 3.5},
    {"break_id": "7g", "qty": 7}
  ]
}

VENDOR CONFIG (Vendor):
{
  "vendor_id": "xyz",
  "blueprint_id": "abc",
  "pricing_values": {
    "1g": {"price": "15.00"},
    "3_5g": {"price": "45.00"},
    "7g": {"price": "80.00"}
  }
}

PRODUCT ASSIGNMENT (Admin):
{
  "product_id": "def",
  "blueprint_id": "abc",
  "price_overrides": {
    "1g": {"price": "17.00"}  // Higher price for premium product
  }
}

FINAL PRICE FOR CUSTOMER:
- 1g: $17.00 (vendor $15 + override $2)
- 3.5g: $45.00 (vendor config)
- 7g: $80.00 (vendor config)
```

## What's NOT in the Current System

- ❌ Approval metadata (`approved_by`, `approval_date`, `rejection_reason`)
- ❌ Approval audit table
- ❌ Auto-approval rules
- ❌ Vendor approval tiers
- ❌ Conditional approval logic
- ❌ Approval delegation
- ❌ Bulk approval actions

## Migration/Schema Locations

| File | Purpose |
|------|---------|
| `20251021_products_catalog.sql` | Products & Categories schema + RLS |
| `20251022000001_vendor_pricing_tiers.sql` | Pricing blueprints + configs |
| `20251027_rbac_system.sql` | User roles & permissions |

## Common Queries (from codebase)

```sql
-- Get pending products (for admin review)
SELECT * FROM products WHERE status = 'pending' ORDER BY created_at DESC

-- Get published products (for storefront)
SELECT * FROM products WHERE status = 'published'

-- Get vendor's all products
SELECT * FROM products WHERE vendor_id = $1

-- Get pricing for product
SELECT * FROM product_pricing_assignments 
JOIN pricing_tier_blueprints ON ...
WHERE product_id = $1 AND is_active = true

-- Get vendor's pricing config
SELECT * FROM vendor_pricing_configs 
WHERE vendor_id = $1 AND is_active = true
```

## Important Files Reference

```
/Users/whale/Desktop/Website/
├── supabase/migrations/
│   ├── 20251021_products_catalog.sql          ← Product/Category schema
│   ├── 20251022000001_vendor_pricing_tiers.sql ← Pricing system
│   └── 20251027_rbac_system.sql               ← User roles
├── app/api/
│   ├── vendor/products/
│   │   ├── route.ts                           ← Create/list products
│   │   ├── [id]/route.ts                      ← Update product
│   │   └── categories/route.ts                ← Get categories
│   └── admin/
│       ├── approve-product/route.ts           ← Approve/reject
│       ├── pending-products/route.ts          ← Review queue
│       ├── categories/route.ts                ← Manage categories
│       ├── pricing-blueprints/route.ts        ← Manage blueprints
│       └── assign-pricing-blueprints/route.ts ← Assign to products
└── ADMIN_APPROVAL_SYSTEM.md                   ← Full documentation
```

---

**Document Version:** 2024-10-30
**System:** Flora Distro - Vendor Product Management with Admin Approval
