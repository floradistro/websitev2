# Admin Approval & Control System - Comprehensive Analysis

## Executive Summary

Your system implements a **marketplace approval model** where vendors submit products that require admin approval before publishing. The architecture uses Supabase with Row Level Security (RLS) policies, pricing blueprint system, and global category management.

---

## 1. PRODUCT APPROVAL SYSTEM

### Current Flow

**Status Lifecycle:**
```
Vendor Creates → "pending" → Admin Reviews → "published" OR "archived"
```

**Database Status Options** (`products.status`):
- `draft` - Work in progress (not currently used in code)
- `pending` - Awaiting admin approval (vendor submissions default here)
- `published` - Live, publicly visible
- `archived` - Rejected or inactive

**Source:** `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` (Line 68)

### Product Creation Flow

**File:** `/Users/whale/Desktop/Website/app/api/vendor/products/route.ts`

```typescript
// Line 96: Vendors submit with "pending" status
status: 'pending', // Requires admin approval (marketplace pattern)
```

**Key Steps:**
1. Vendor submits product via POST `/api/vendor/products`
2. Product created with `status: 'pending'`
3. Vendor receives email (queued job)
4. Admin sees in pending products list
5. Admin approves/rejects via `/api/admin/approve-product`

### Admin Approval Actions

**File:** `/Users/whale/Desktop/Website/app/api/admin/approve-product/route.ts`

**Approve Action (POST with action: 'approve'):**
```typescript
// Updates product to published
status: 'published',
date_on_sale_from: new Date().toISOString()
```
- Sends email to vendor: "Your Product Has Been Approved!"
- Invalidates product caches
- Job queue priority: 2

**Reject Action (POST with action: 'reject'):**
```typescript
// Updates product to archived
status: 'archived'
```
- Sends email to vendor: "Product Submission Update - doesn't meet requirements"
- Invalidates product caches
- Job queue priority: 2

**Source:** Lines 21-138 of route.ts

### Pending Products Dashboard

**File:** `/Users/whale/Desktop/Website/app/api/admin/pending-products/route.ts`

- **GET** endpoint returns all `status: 'pending'` products
- Enriches with vendor name, category, pricing mode
- Includes cannabis metadata (THC%, CBD%, strain info)
- Sorts by created_at descending

---

## 2. ROW LEVEL SECURITY (RLS) POLICIES

### Products Table RLS

**File:** `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` (Lines 336-370)

**Public Access:**
```sql
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (status = 'published');
```
- Only published products visible to public/storefront
- Pending/archived hidden from customers

**Vendor Access:**
```sql
CREATE POLICY "Vendors can view own products"
  ON public.products FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE auth.uid()::text = id::text
  ));
```
- Vendors see all their own products (all statuses)
- But can only modify via API with auth headers

**Service Role (Admin) Access:**
```sql
CREATE POLICY "Service role full access to products"
  ON public.products FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```
- Backend service role has unrestricted access
- Used for admin operations

### Categories RLS

**File:** `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` (Lines 340-350)

```sql
-- Public can view all active categories
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Service role manages all
CREATE POLICY "Service role full access to categories"
  ON public.categories FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

**Key Point:** Categories are **ADMIN-CONTROLLED** (global/platform-wide), not vendor-specific

---

## 3. CATEGORY MANAGEMENT

### Architecture

**Categories are GLOBAL, not vendor-specific**

**Structure:**
- `id` - UUID primary key
- `name` - Category name (e.g., "Cannabis Flower", "Edibles")
- `slug` - URL-friendly slug
- `parent_id` - Hierarchical parent category
- `display_order` - Sort order
- `is_active` - Admin control flag
- `featured` - Admin-featured flag

**Source:** `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` (Lines 10-48)

### Category Admin API

**File:** `/Users/whale/Desktop/Website/app/api/admin/categories/route.ts`

**GET** - Fetch all categories (ordered by display_order, name)
```typescript
.order('display_order', { ascending: true })
.order('name', { ascending: true })
```

**POST** - Create category
- Auto-generates slug from name
- Allows parent_id for hierarchy
- Sets is_active (default true), featured, metadata

**PATCH** - Update category
- Can update any field
- Auto-generates slug if name changes
- Updates updated_at timestamp

**DELETE** - Delete category (with constraints)
- Rejects if products assigned
- Rejects if has child categories
- Enforces referential integrity

**Vendor View of Categories:**
- File: `/Users/whale/Desktop/Website/app/api/vendor/products/categories/route.ts`
- Returns only categories from vendor's **published** products
- Read-only for vendors
- No vendor API to create categories

---

## 4. PRICING TIER BLUEPRINTS

### Architecture

**Admin defines pricing structures, vendors implement them**

#### Pricing Tier Blueprints (Admin-Controlled)

**File:** `/Users/whale/Desktop/Website/supabase/migrations/20251022000001_vendor_pricing_tiers.sql` (Lines 10-60)

**Table:** `pricing_tier_blueprints`

**Key Fields:**
- `name` - Blueprint name (e.g., "Retail Cannabis Flower")
- `slug` - URL slug
- `tier_type` - Type: 'weight', 'quantity', 'percentage', 'flat', 'custom'
- `price_breaks` - JSONB array defining pricing tiers
- `is_active` - Admin control flag
- `is_default` - Default blueprint for new vendors
- `applicable_to_categories` - UUID array (null = all categories)

**Example Price Breaks (Weight-based):**
```json
[
  {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
  {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 2},
  {"break_id": "7g", "label": "Quarter (7g)", "qty": 7, "unit": "g", "sort_order": 3},
  {"break_id": "14g", "label": "Half (14g)", "qty": 14, "unit": "g", "sort_order": 4},
  {"break_id": "28g", "label": "Ounce (28g)", "qty": 28, "unit": "g", "sort_order": 5}
]
```

**Default Blueprints (Seeded):**
1. "Retail Cannabis Flower" (weight-based) - DEFAULT
2. "Wholesale Tiers" (quantity-based)
3. "Medical Patient Discount" (percentage)
4. "Staff Discount" (percentage)
5. "Retail Concentrates" (weight-based)

**Source:** Lines 283-326

#### Vendor Pricing Configs

**Table:** `vendor_pricing_configs`

**Key Fields:**
- `vendor_id` - Vendor UUID
- `blueprint_id` - Reference to pricing blueprint
- `pricing_values` - JSONB with vendor's actual prices
- `is_active` - Vendor can deactivate

**Example Pricing Values:**
```json
{
  "1g": {"price": "15.00", "enabled": true},
  "3_5g": {"price": "45.00", "enabled": true},
  "7g": {"price": "80.00", "enabled": true},
  "14g": {"price": "150.00", "enabled": true},
  "28g": {"price": "280.00", "enabled": true}
}
```

**Relationship:** UNIQUE(vendor_id, blueprint_id)

**Source:** Lines 65-107

#### Product Pricing Assignments

**Table:** `product_pricing_assignments`

**Key Fields:**
- `product_id` - Product UUID
- `blueprint_id` - Pricing blueprint to apply
- `price_overrides` - Optional per-product price exceptions
- `is_active` - Can deactivate

**Example Override:**
```json
{
  "1g": {"price": "17.00"}  // Override just 1g price
}
```

**Relationship:** UNIQUE(product_id, blueprint_id)

**Source:** Lines 114-140

### Pricing Control Flow

```
1. Admin creates/manages Pricing Blueprints
   ↓
2. System assigns default blueprint to vendors (or admin assigns)
   ↓
3. Vendor configures prices in vendor_pricing_configs
   ↓
4. Admin assigns blueprint to product via product_pricing_assignments
   ↓
5. Final price = vendor_config + product_override
```

### Pricing Admin API

**File:** `/Users/whale/Desktop/Website/app/api/admin/pricing-blueprints/route.ts`

**GET** - List all blueprints
```typescript
.order('display_order', { ascending: true })
.order('created_at', { ascending: false })
```

**POST** - Create blueprint
- Validates name, slug, price_breaks required
- Sets is_default: unsets other defaults first
- Can specify applicable_to_categories

**File:** `/Users/whale/Desktop/Website/app/api/admin/pricing-blueprints/[id]/route.ts`

**PUT** - Update blueprint
- Same validations as create

**DELETE** - Delete blueprint
- Rejects if any vendors using it
- Suggests deactivating instead

### Auto-Assign Pricing Blueprints

**File:** `/Users/whale/Desktop/Website/app/api/admin/assign-pricing-blueprints/route.ts`

- Gets default active blueprint
- Finds products without pricing assignments
- Creates assignments for those products
- Returns count of assigned

**RLS for Pricing Tables:**

**Blueprints:** Public can view active, service role manages all
**Vendor Configs:** Vendors view/update own, service role manages
**Product Assignments:** Public can view active, service role manages

**Source:** Lines 330-393

---

## 5. VENDOR PRODUCT CREATION CONSTRAINTS

### What Vendors Can Do

**File:** `/Users/whale/Desktop/Website/app/api/vendor/products/route.ts`

**✅ Can Create Products:**
- POST to `/api/vendor/products`
- Must provide: `name` (required)
- Optional: description, sku, price, cost_price, category, stock, etc.
- Products automatically: `status: 'pending'`

**✅ Can Update Own Products:**
- PUT to `/api/vendor/products/[id]`
- Only their own products (checked via `vendor_id`)
- Can update: name, sku, description, price, cost_price, custom_fields

**✅ Can View Own Products:**
- GET `/api/vendor/products`
- Returns all statuses (pending, published, etc.)

**✅ Can View Pricing:**
- GET `/api/vendor/pricing-config`
- See vendor's configured prices

**❌ Cannot Do:**

- **Cannot publish directly** - Status stays pending until admin approves
- **Cannot manage categories** - Categories are read-only, admin-controlled
- **Cannot create/modify blueprints** - Blueprints are admin-only
- **Cannot set product prices directly** - Prices determined by blueprint system
- **Cannot override approval flow** - No bypass mechanism

### Vendor API Authentication

**Header-based:** `x-vendor-id`
- Passed in request headers
- Verified in each endpoint
- Used to filter queries to vendor's own data

**Example:**
```typescript
const vendorId = request.headers.get('x-vendor-id');
if (!vendorId) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

---

## 6. CURRENT PRODUCT STATUS TRACKING

### Field Structure

`products.status` - Single enum field:
- `draft` - (unused, conceptual)
- `pending` - Default on creation, awaiting approval
- `published` - Admin-approved, live
- `archived` - Rejected or inactive

### No Approval Metadata

**Current System Does NOT Track:**
- ❌ `admin_approved_by` (who approved)
- ❌ `approval_date` (when approved)
- ❌ `rejection_reason` (why rejected)
- ❌ `approval_notes` (admin notes)
- ❌ `requires_approval` (boolean)
- ❌ `approval_status` (separate field)

### Audit Trail

**Implied via:**
- `created_at` - Product submission time
- `updated_at` - Last modification time
- Email logs (via job queue) - Approval notifications sent
- No explicit approval audit table

---

## 7. CATEGORY-PRODUCT RELATIONSHIP

**Two-Level Relationship:**

1. **Direct: `products.primary_category_id`** (UUID FK)
   - Each product has one primary category
   - Optional (can be NULL)

2. **Many-to-Many: `product_categories`** (Join table)
   - Products can be in multiple categories
   - `is_primary` flag indicates primary category
   - Source: `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` (Lines 188-200)

**Category Count Updates:**
- Trigger: `update_category_product_count()`
- Keeps `categories.product_count` in sync
- Updates on insert/delete of product_categories

---

## 8. ADMIN CONTROL HIERARCHY

```
Platform Admin (Service Role)
├── Manages Categories (global)
├── Manages Pricing Blueprints (global)
├── Reviews & Approves Products
├── Assigns Blueprints to Products
├── Can Override/Edit Any Product
├── Manages Vendor Accounts
└── Can Delete Products (with inventory checks)

Vendor
├── Creates Products (pending status)
├── Updates Own Products
├── Views Own Products (all statuses)
├── Configures Prices per Blueprint
├── Cannot Change Status
├── Cannot Modify Categories
├── Cannot Create Blueprints
└── Cannot Bypass Approval
```

---

## 9. KEY FILES SUMMARY

| Path | Purpose |
|------|---------|
| `/supabase/migrations/20251021_products_catalog.sql` | Product/Category schema, RLS policies |
| `/supabase/migrations/20251022000001_vendor_pricing_tiers.sql` | Pricing blueprints, vendor configs, product assignments |
| `/app/api/vendor/products/route.ts` | Vendor creates/lists products (pending status) |
| `/app/api/admin/approve-product/route.ts` | Admin approves (→published) or rejects (→archived) |
| `/app/api/admin/pending-products/route.ts` | Admin views pending products for review |
| `/app/api/admin/categories/route.ts` | Admin CRUD for categories |
| `/app/api/admin/pricing-blueprints/route.ts` | Admin manages blueprint definitions |
| `/app/api/admin/pricing-blueprints/[id]/route.ts` | Admin updates/deletes blueprints |
| `/app/api/admin/assign-pricing-blueprints/route.ts` | Admin assigns default blueprints to products |

---

## 10. IMPORTANT DESIGN PATTERNS

### Marketplace Model
- Vendor submissions require curation (admin approval)
- Public sees only approved products
- Prevents low-quality products on storefront

### Platform-Controlled Blueprints
- Admin defines pricing structure once
- Vendors implement it consistently
- Enables cross-vendor comparison

### Service Role for Admin Operations
- Backend uses `getServiceSupabase()` (service role key)
- Bypasses all RLS restrictions
- Used for admin API endpoints
- NOT used in client-side code

### Cache Invalidation
- After approval/rejection: invalidates product caches
- After deletion: invalidates all caches
- Keeps storefront fresh

### Email Notifications
- Uses job queue (asynchronous)
- Vendor notified of approval/rejection
- Non-blocking (failure doesn't fail product operation)

---

## CURRENT GAPS FOR MAJOR CHANGES

If implementing vendor approval tiers or bypasses, would need:

1. **New Status Values**
   - Add `auto_approved` or `conditional_approved` status
   - Or add `approval_required` boolean field

2. **Approval Metadata**
   - Track `approved_by` UUID
   - Track `approval_date`
   - Store `approval_notes`

3. **Approval Audit Table**
   - Log each approval/rejection action
   - Store decision rationale
   - Track timing

4. **Conditional Logic**
   - Create table for approval rules
   - e.g., "Products under $50 auto-approve"
   - Implement rule evaluation

5. **Vendor Tiers**
   - Add `vendor_approval_tier` to vendors table
   - Check tier before requiring approval
   - Implement tier-based logic

