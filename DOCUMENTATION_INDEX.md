# Admin Approval & Control System - Documentation Index

## Overview

Three comprehensive documentation files have been created to help you understand your vendor product approval and control system:

1. **ADMIN_APPROVAL_SYSTEM.md** (15 KB, 526 lines)
   - Complete architectural analysis
   - All 10 major sections covering approval flow, RLS, categories, pricing, constraints, gaps

2. **ADMIN_APPROVAL_QUICK_REFERENCE.md** (10 KB, 296 lines)
   - Visual workflow diagrams
   - API endpoints table
   - Database relationship diagrams
   - Key files reference
   - Quick lookup for common tasks

3. **APPROVAL_CODE_REFERENCES.md** (19 KB, 729 lines)
   - Detailed code locations and line numbers
   - Code snippets from all relevant files
   - Data flow diagrams
   - Testing checklist

---

## What Gets Approved?

### Product Approval Workflow

```
VENDOR CREATES PRODUCT
        ↓
     pending (status)
        ↓
ADMIN REVIEWS
        ├→ APPROVE: published (visible to customers)
        └→ REJECT: archived (hidden)
```

### Key Points

- **Vendors CANNOT publish directly** - all products default to `pending` status
- **Only admin can approve** - changes status to `published`
- **Public only sees published** - RLS policy restricts visibility
- **No approval metadata tracked** - just updated_at and created_at timestamps
- **Email notifications sent** - to admin on submission, to vendor on decision

---

## What's Admin-Controlled?

### Categories
- Global platform-wide categories (NOT vendor-specific)
- Admin creates/edits/deletes via `/api/admin/categories`
- Vendors can only view categories from their published products
- Hierarchical support (parent categories)

### Pricing Blueprints
- Admin defines pricing structure (e.g., "Retail Flower", "Wholesale")
- Admin creates price_breaks (tier definitions)
- Vendors implement prices per blueprint
- Admin can assign blueprints to products and override individual prices

### Products
- Vendors create (with pending status)
- Vendors can update (name, sku, description, price, custom fields)
- **Vendors CANNOT change status** - only admin can
- **Vendors CANNOT change category** - only via product creation
- Admin can edit/delete any product

---

## Quick File Locations

### Database Migrations
- `20251021_products_catalog.sql` - Product/Category schema + RLS
- `20251022000001_vendor_pricing_tiers.sql` - Pricing system
- `20251027_rbac_system.sql` - User roles & permissions

### Vendor APIs
- `/app/api/vendor/products/route.ts` - Create/list products (pending)
- `/app/api/vendor/products/[id]/route.ts` - Update own product
- `/app/api/vendor/products/categories/route.ts` - View categories

### Admin APIs
- `/app/api/admin/approve-product/route.ts` - Approve/reject
- `/app/api/admin/pending-products/route.ts` - Review queue
- `/app/api/admin/products/route.ts` - View/delete all products
- `/app/api/admin/categories/route.ts` - Manage categories
- `/app/api/admin/pricing-blueprints/route.ts` - Manage blueprints

---

## Key Findings

### Current Status System
- Uses single `status` field with 4 values: draft, pending, published, archived
- RLS controls visibility based on status + vendor + user role
- No approval metadata (who approved, when, why not)
- Implicit audit trail via created_at/updated_at timestamps

### Pricing Architecture (3-Level)
1. **Blueprints** (Admin) - Define structure
2. **Vendor Config** (Vendor) - Set prices
3. **Product Assignment** (Admin) - Apply + optionally override

### No Current Support For
- Auto-approval rules
- Vendor approval tiers
- Conditional approval
- Approval delegation
- Bulk approval actions
- Rejection reasons storage
- Resubmission workflow

---

## Using These Docs

### For Understanding the System
1. Start with **QUICK_REFERENCE.md** (5-10 min read)
2. Read full **ADMIN_APPROVAL_SYSTEM.md** (20-30 min)
3. Keep **CODE_REFERENCES.md** handy for implementation details

### For Code Changes
1. Check **CODE_REFERENCES.md** for exact file locations
2. Use **ADMIN_APPROVAL_SYSTEM.md** for context on what affects what
3. Reference **QUICK_REFERENCE.md** for data flow diagrams

### For Architecture Decisions
1. Review Section 10 of **ADMIN_APPROVAL_SYSTEM.md** (gaps)
2. Check Section 5 (vendor constraints)
3. Review current RLS policies (Section 2)

---

## Document Versions

- **Version:** 2024-10-30
- **System:** Flora Distro - Vendor Product Management
- **Database:** Supabase with Row Level Security
- **Framework:** Next.js with TypeScript

---

## Quick FAQ

**Q: Can vendors auto-approve their products?**
A: No. All vendor products default to pending status. Only admins can change to published.

**Q: Can vendors create categories?**
A: No. Categories are platform-wide and admin-controlled.

**Q: Can vendors set any price they want?**
A: Not directly. Prices are controlled via pricing blueprints that admins define.

**Q: What happens when a product is rejected?**
A: Status changes to archived. Vendor receives email. Can resubmit by editing.

**Q: How are categories managed?**
A: Admin-only via `/api/admin/categories`. Global across all vendors.

**Q: How does pricing work for multi-tier products?**
A: Blueprint defines tiers (e.g., 1g, 3.5g, 7g), vendor sets prices, admin can override per product.

---

## Next Steps

If you're planning major changes:

1. **For approval metadata:**
   - Add `approved_by UUID`, `approval_date`, `rejection_reason TEXT` to products table
   - Create approval_audit table for history

2. **For auto-approval:**
   - Add `approval_rules` table with conditions
   - Implement rule evaluation in vendor product creation

3. **For vendor tiers:**
   - Add `approval_tier` column to vendors table
   - Implement tier-based approval logic

4. **For delegation:**
   - Create `approval_delegation` table
   - Enforce delegation hierarchy

See Section 10 of **ADMIN_APPROVAL_SYSTEM.md** for more details.

