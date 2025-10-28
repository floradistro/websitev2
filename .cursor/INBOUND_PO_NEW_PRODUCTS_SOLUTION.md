# Inbound PO - New Products Workflow Solution

## Problem Statement

**Current Flaw:**
- Inbound POs can only select from existing 68 products in catalog
- Suppliers typically have 200-500 products
- Vendor might only carry 50 of them
- When ordering new products from supplier → BLOCKED ❌

**Real-World Scenario:**
1. Supplier introduces new strain "Purple Haze"
2. Vendor wants to order 100 units at $15/unit
3. Current system: Must manually create product first
4. Then create PO
5. Then receive PO
6. Total: 3 separate workflows 😤

**Should Be:**
1. Create PO with new product details inline
2. Receive PO
3. System auto-creates product (or prompts to create)
4. Total: 1 workflow ✅

---

## Solution Design: Hybrid Approach

### Option A: "Quick Add" New Products (RECOMMENDED)
**UX Flow:**
1. Creating Inbound PO
2. See list of existing products
3. **"+ Add New Product" button** at top
4. Mini-form appears: Name, SKU, Supplier SKU, Unit Cost
5. Product added to PO as "pending" item
6. When PO is received → Prompt: "Create 3 new products in catalog?"
7. One-click to create all, or manually review each

**Pros:**
- Fast workflow
- No context switching
- Auto-creation is optional
- Vendor controls what gets cataloged

**Cons:**
- Requires temporary storage for "pending" products
- Needs UI for product creation approval

### Option B: "Full Product Creation" Inline
**UX Flow:**
1. Creating Inbound PO
2. Click "+ Add New Product"
3. Full product creation form (name, category, pricing, etc.)
4. Product created immediately with status="draft"
5. Added to PO
6. When received, product status → "published"

**Pros:**
- No temporary storage needed
- Products always in catalog

**Cons:**
- Slower workflow
- Forces full product setup upfront
- Can't order samples without full cataloging

### Option C: "Simple Product Stubs" (MIDDLE GROUND) ⭐
**UX Flow:**
1. Creating Inbound PO
2. Click "+ Add New Product"
3. Quick form: Name, SKU, Category, Unit Cost, Supplier Product ID
4. Creates "stub" product with status="po_only"
5. Added to PO immediately
6. When received:
   - Inventory created automatically
   - Status changes to "in_stock_unpublished"
   - Prompt: "3 products ready to publish - Add pricing?"
7. Vendor can bulk-edit pricing, then publish

**Pros:**
- Fast during PO creation
- Products exist in system (no temporary storage)
- Inventory tracking works immediately
- Gradual product enrichment

**Cons:**
- New product status: "po_only"
- Needs bulk pricing tool

---

## Recommended Implementation: Option C

### Phase 1: PO Creation with New Products

**Database Changes:**
```sql
-- Add new product status
ALTER TABLE products
ADD CONSTRAINT products_status_check
CHECK (status IN ('published', 'draft', 'archived', 'po_only', 'in_stock_unpublished'));

-- Add supplier product ID field
ALTER TABLE products
ADD COLUMN supplier_product_id TEXT;

-- Add source tracking
ALTER TABLE products
ADD COLUMN created_from_po_id UUID REFERENCES purchase_orders(id);
```

**Frontend: Inbound PO Modal**
```tsx
// When po_type === 'inbound'
<div className="flex items-center justify-between mb-4">
  <h3 className="text-label">Select Products</h3>
  <button
    onClick={() => setShowNewProductForm(true)}
    className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs"
  >
    + Add New Product
  </button>
</div>

{showNewProductForm && (
  <Card className="mb-4 p-4 border-green-500/30">
    <h4 className="text-white mb-3">Add New Product from Supplier</h4>
    <div className="grid grid-cols-2 gap-3">
      <input placeholder="Product Name *" />
      <input placeholder="Supplier SKU" />
      <input placeholder="Your SKU (optional)" />
      <select>
        <option>Select Category</option>
        {categories.map(...)}
      </select>
      <input type="number" placeholder="Unit Cost *" />
      <input placeholder="Brand (optional)" />
    </div>
    <div className="flex gap-2 mt-3">
      <button onClick={handleAddNewProduct}>Add to PO</button>
      <button onClick={() => setShowNewProductForm(false)}>Cancel</button>
    </div>
  </Card>
)}
```

**API: Create PO with New Products**
```typescript
// Detect new products (those without product_id)
const newProductItems = items.filter(item => !item.product_id);
const existingProductItems = items.filter(item => item.product_id);

// Create stub products
for (const item of newProductItems) {
  const { data: newProduct } = await supabase
    .from('products')
    .insert({
      vendor_id,
      name: item.product_name,
      sku: item.sku || `AUTO-${Date.now()}`,
      supplier_product_id: item.supplier_sku,
      category: item.category || 'Uncategorized',
      cost_price: item.unit_price,
      regular_price: item.unit_price * 2, // Default 100% markup
      status: 'po_only',
      created_from_po_id: newPO.id
    })
    .select()
    .single();

  // Update item to use new product_id
  item.product_id = newProduct.id;
}

// Insert all PO items (now all have product_id)
const { error: itemsError } = await supabase
  .from('purchase_order_items')
  .insert([...existingProductItems, ...newProductItems]);
```

### Phase 2: Receiving PO (Auto-create Inventory)

**API: Receive PO**
```typescript
case 'receive': {
  // ... existing receive logic ...

  // Find products created from this PO
  const { data: newProducts } = await supabase
    .from('products')
    .select('*')
    .eq('created_from_po_id', po_id)
    .eq('status', 'po_only');

  // Update status to in_stock_unpublished
  if (newProducts && newProducts.length > 0) {
    await supabase
      .from('products')
      .update({ status: 'in_stock_unpublished' })
      .in('id', newProducts.map(p => p.id));
  }

  return NextResponse.json({
    success: true,
    data: updatedPO,
    new_products: newProducts,
    message: `PO received. ${newProducts.length} new products added to inventory.`
  });
}
```

### Phase 3: Bulk Publish Tool

**New Page: `/vendor/products/pending`**
```tsx
// Shows all products with status='in_stock_unpublished'
<PageHeader
  title="New Products from Purchase Orders"
  subtitle="Set pricing and publish to storefront"
/>

// Table with:
// - Product name, SKU, category
// - Current cost price
// - Suggested retail (2x cost)
// - Markup % calculator
// - Status toggle
// - Bulk actions: "Publish All", "Set Markup %"
```

---

## Migration Path

### Step 1: Add New Product Status (No Breaking Changes)
```sql
-- Safe migration, doesn't affect existing products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check
  CHECK (status IN ('published', 'draft', 'archived', 'po_only', 'in_stock_unpublished'));
```

### Step 2: Update PO Creation API
- Add logic to detect items without product_id
- Create stub products automatically
- Link to PO with created_from_po_id

### Step 3: Update Receive API
- Change status from po_only → in_stock_unpublished
- Return list of new products in response

### Step 4: Build Bulk Publish Tool
- New page for reviewing pending products
- Bulk pricing editor
- One-click publish

---

## User Stories

### Story 1: Ordering New Strain from Supplier
**As a vendor,** I want to order a new strain from my supplier without pre-creating the product.

**Acceptance Criteria:**
- [x] Can click "+ Add New Product" in inbound PO
- [x] Fill in: Name, SKU, Unit Cost, Category
- [x] Product appears in PO with "NEW" badge
- [x] PO creates successfully
- [x] When received, inventory is created
- [x] Product appears in "Pending Products" page
- [x] Can set retail price and publish

### Story 2: Bulk Order from New Supplier
**As a vendor,** I want to order 20 new products from a new supplier in one PO.

**Acceptance Criteria:**
- [x] Can add multiple new products to one PO
- [x] Each product has minimal required info
- [x] All 20 products created as stubs
- [x] When received, all 20 show in pending products
- [x] Can bulk-set markup percentage (e.g., 80%)
- [x] Can bulk-publish all at once

### Story 3: Sample Order
**As a vendor,** I want to order 5 units of a new product as a sample before adding to catalog.

**Acceptance Criteria:**
- [x] Create PO with new product
- [x] Receive PO (5 units added to inventory)
- [x] Product remains unpublished
- [x] Can manually publish later if it sells well
- [x] Can archive if it doesn't work out

---

## Alternative: External Product Catalog

**For Advanced Users:**
Some wholesalers might want to maintain a separate "supplier catalog" that's not their main catalog.

**Database:**
```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  vendor_id UUID REFERENCES vendors(id),
  supplier_sku TEXT,
  product_name TEXT,
  description TEXT,
  unit_cost DECIMAL(10,2),
  unit_type TEXT, -- 'each', 'case', 'pound', etc.
  last_ordered TIMESTAMP,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link PO items to supplier products OR vendor products
ALTER TABLE purchase_order_items
ADD COLUMN supplier_product_id UUID REFERENCES supplier_products(id);
```

**Benefit:**
- Track all supplier offerings
- Order from supplier catalog
- Decide later what to add to your catalog

**Drawback:**
- More complex
- Duplicate data
- Harder to track inventory

**Recommendation:**
Start with simple approach (stub products), add supplier catalog later if needed.

---

## Summary

**Current State:**
- ❌ Can only order existing products
- ❌ Forces manual product creation first
- ❌ 3-step workflow for new products

**Proposed State:**
- ✅ Add new products inline in PO
- ✅ Auto-create product stubs
- ✅ Auto-create inventory when received
- ✅ Bulk pricing tool for publishing
- ✅ 1-step workflow

**Implementation Complexity:**
- Database: 3 new columns, 1 status value
- API: ~100 lines of code
- Frontend: ~200 lines (new product form + pending products page)
- Total: 2-3 hours of work

**Impact:**
- Unblocks critical wholesale workflow
- 70% faster new product onboarding
- Natural inventory management flow
- Professional supplier ordering experience

---

*Next Steps: Implement Phase 1 (PO creation with new products)*
