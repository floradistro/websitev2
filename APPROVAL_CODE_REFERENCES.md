# Admin Approval System - Code References

## File Structure & Key Code Locations

### Database Schemas

#### 1. `/supabase/migrations/20251021_products_catalog.sql`

**Product Status Definition (Line 68):**
```sql
status TEXT DEFAULT 'published' 
  CHECK (status IN ('draft', 'pending', 'published', 'archived')),
```

**Products Table Structure (Lines 55-159):**
- `id` - Primary key
- `vendor_id` - Links to vendors table
- `status` - Approval status (our focus)
- `primary_category_id` - Links to categories
- `name`, `slug`, `description`
- `regular_price`, `sale_price`, `price` (calculated)
- `created_at`, `updated_at` - Timestamps
- `blueprint_fields` - Custom fields JSONB

**RLS Policy: Public sees published (Lines 356-359):**
```sql
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
  ON public.products FOR SELECT
  USING (status = 'published');
```

**RLS Policy: Vendors see own products (Lines 361-364):**
```sql
DROP POLICY IF EXISTS "Vendors can view own products" ON public.products;
CREATE POLICY "Vendors can view own products"
  ON public.products FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE auth.uid()::text = id::text
  ));
```

**RLS Policy: Service role full access (Lines 366-369):**
```sql
DROP POLICY IF EXISTS "Service role full access to products" ON public.products;
CREATE POLICY "Service role full access to products"
  ON public.products FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

**Categories Table Structure (Lines 10-48):**
- Global admin-controlled categories
- NOT vendor-specific
- Hierarchical (parent_id)
- `is_active` - Admin visibility control
- `featured` - Admin can feature categories

**RLS Policy: Categories public access (Lines 342-350):**
```sql
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);
```

#### 2. `/supabase/migrations/20251022000001_vendor_pricing_tiers.sql`

**Pricing Tier Blueprints Table (Lines 10-60):**
```sql
CREATE TABLE IF NOT EXISTS public.pricing_tier_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier_type TEXT DEFAULT 'weight' 
    CHECK (tier_type IN ('weight', 'quantity', 'percentage', 'flat', 'custom')),
  price_breaks JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  applicable_to_categories UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);
```

**Vendor Pricing Configs (Lines 65-107):**
```sql
CREATE TABLE IF NOT EXISTS public.vendor_pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id),
  pricing_values JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, blueprint_id)
);
```

**Product Pricing Assignments (Lines 114-140):**
```sql
CREATE TABLE IF NOT EXISTS public.product_pricing_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id),
  price_overrides JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(product_id, blueprint_id)
);
```

---

### Vendor APIs

#### `/app/api/vendor/products/route.ts`

**POST - Create Product (Lines 40-280):**

Key status assignment (Line 96):
```typescript
// Line 96: Vendors submit with "pending" status
status: 'pending', // Requires admin approval (marketplace pattern)
```

Authentication check (Lines 42-48):
```typescript
const vendorId = request.headers.get('x-vendor-id');
if (!vendorId) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

Category matching logic (Lines 125-139):
```typescript
if (productData.category) {
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', productData.category)
    .limit(1);
  
  if (categories && categories.length > 0) {
    newProduct.primary_category_id = categories[0].id;
  }
}
```

Cache invalidation (Lines 233-237):
```typescript
productCache.invalidatePattern('products:.*');
vendorCache.invalidatePattern(`vendor-.*:.*vendorId:${vendorId}.*`);
inventoryCache.invalidatePattern('.*');
```

Email notification (Lines 242-252):
```typescript
await jobQueue.enqueue(
  'send-email',
  {
    to: 'admin@floradistro.com',
    subject: 'New Product Submission',
    html: `...`
  }
);
```

**GET - List Vendor Products (Lines 6-38):**
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId)
  .order('created_at', { ascending: false });
```
- Returns ALL statuses (pending, published, etc.)
- Vendor sees their own products regardless of status

#### `/app/api/vendor/products/[id]/route.ts`

**GET - Get Single Product (Lines 6-174):**

Vendor verification (Lines 42-44):
```typescript
const { data: product, error: productError } = await supabase
  .from('products')
  .select('...')
  .eq('id', productId)
  .eq('vendor_id', vendorId)  // ← Enforces vendor ownership
  .single();
```

**PUT - Update Product (Lines 176-257):**

Vendor verification (Line 203):
```typescript
if (existing.vendor_id !== vendorId) {
  return NextResponse.json(
    { success: false, error: 'Product not found or unauthorized' },
    { status: 404 }
  );
}
```

Cannot update status - only these fields:
```typescript
if (body.name) updateData.name = body.name;
if (body.sku !== undefined) updateData.sku = body.sku;
if (body.description !== undefined) updateData.description = body.description;
if (body.price !== undefined) updateData.price = body.price;
if (body.cost_price !== undefined) updateData.cost_price = body.cost_price;
if (body.custom_fields) updateData.blueprint_fields = fieldsArray;
// NO STATUS UPDATE
```

#### `/app/api/vendor/products/categories/route.ts`

**GET - List Categories (Lines 4-60):**
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select(`product_categories(category:categories(name))`)
  .eq('vendor_id', vendorId)
  .eq('status', 'published');  // ← Only published products!
```

**Important:** Categories are read-only for vendors

---

### Admin APIs

#### `/app/api/admin/approve-product/route.ts`

**POST - Approve or Reject Product (Lines 6-146):**

Extract action (Line 9):
```typescript
const { productId, submission_id, action } = body; // action: 'approve' or 'reject'
```

**APPROVE Path (Lines 21-79):**
```typescript
if (action === 'approve') {
  console.log('🔵 Approving product:', id);
  
  // Update product status to published
  const { data: product, error: updateError } = await supabase
    .from('products')
    .update({ 
      status: 'published',                          // ← Changes status
      date_on_sale_from: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  // Cache invalidation
  productCache.invalidatePattern('products:.*');
  vendorCache.invalidatePattern(`.*vendorId:${product.vendor_id}.*`);
  inventoryCache.clear();
  
  // Send vendor email
  await jobQueue.enqueue('send-email', {
    to: vendor.email,
    subject: 'Product Approved!',
    html: `<h2>Your Product Has Been Approved!</h2>...`
  });
  
  return NextResponse.json({
    success: true,
    message: 'Product approved and published',
    product
  });
}
```

**REJECT Path (Lines 81-138):**
```typescript
else if (action === 'reject') {
  const { data: product, error: updateError } = await supabase
    .from('products')
    .update({ 
      status: 'archived'                            // ← Changes status
    })
    .eq('id', id)
    .select()
    .single();
  
  // Send vendor email
  await jobQueue.enqueue('send-email', {
    to: vendor.email,
    subject: 'Product Submission Update',
    html: `<h2>Product Submission Update</h2>
      <p>Your product does not meet our current requirements...</p>`
  });
  
  return NextResponse.json({
    success: true,
    message: 'Product rejected',
    product
  });
}
```

#### `/app/api/admin/pending-products/route.ts`

**GET - List Pending Products (Lines 4-116):**

Query pending products (Lines 11-15):
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'pending')  // ← Filter only pending
  .order('created_at', { ascending: false });
```

Enrich with vendor info (Lines 29-38):
```typescript
const vendorIds = [...new Set(products?.map(p => p.vendor_id).filter(Boolean) || [])];
const { data: vendors } = await supabase
  .from('vendors')
  .select('id, store_name')
  .in('id', vendorIds);

const vendorMap = (vendors || []).reduce((acc: any, v: any) => {
  acc[v.id] = v.store_name;
  return acc;
}, {});
```

Map to admin UI format (Lines 53-98):
```typescript
const pendingProducts = (products || []).map((p: any) => {
  return {
    id: p.id,
    vendor_id: p.vendor_id,
    product_name: p.name,
    store_name: vendorMap[p.vendor_id] || 'Yacht Club',
    status: p.status,
    submitted_date: p.created_at,
    updated_date: p.updated_at,
    is_update: isUpdate,
    
    // Pricing
    price: p.regular_price?.toString() || '',
    sale_price: p.sale_price?.toString() || '',
    
    // Cannabis info
    thc_percentage: p.meta_data?.thc_percentage || '',
    cbd_percentage: p.meta_data?.cbd_percentage || '',
    strain_type: p.meta_data?.strain_type || '',
    // ... more fields
  };
});
```

#### `/app/api/admin/products/route.ts`

**GET - List ALL Products (Lines 12-259):**

No status filter for admin (Lines 28-48):
```typescript
let query = supabase
  .from('products')
  .select(`
    *,
    blueprint_fields,
    vendor:vendors(id, store_name, slug, email, vendor_type),
    category:categories!primary_category_id(id, name, slug)
  `, { count: 'exact' });

// Optional filters
if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
if (status) query = query.eq('status', status);  // Can filter if requested
if (vendorId) query = query.eq('vendor_id', vendorId);
```

Includes pricing tiers (Lines 90-104):
```typescript
const { data: allPricingAssignments } = await supabase
  .from('product_pricing_assignments')
  .select(`
    product_id,
    blueprint:pricing_tier_blueprints(id, name, slug, tier_type, price_breaks),
    price_overrides
  `)
  .in('product_id', productIds)
  .eq('is_active', true);
```

**DELETE - Delete Product (Lines 264-389):**

Check inventory (Lines 301-325):
```typescript
const { data: inventory } = await supabase
  .from('inventory')
  .select('id, quantity, location:location_id(name)')
  .eq('product_id', product.id);

if (inventory && inventory.length > 0 && !forceDelete) {
  const totalQty = inventory.reduce((sum, inv) => sum + parseFloat(inv.quantity || '0'), 0);
  
  if (totalQty > 0) {
    return NextResponse.json({ 
      error: `Cannot delete product with existing inventory...`,
      has_inventory: true,
      inventory_count: inventory.length,
      total_quantity: totalQty
    }, { status: 400 });
  }
}
```

Delete with force option (Lines 327-356):
```typescript
if (forceDelete && inventory && inventory.length > 0) {
  // Create audit trail
  for (const inv of inventory) {
    await supabase.from('stock_movements').insert({
      inventory_id: inv.id,
      product_id: product.id,
      movement_type: 'adjustment',
      quantity: -parseFloat(inv.quantity || '0'),
      reason: 'Product deleted by admin (force)',
      notes: `Product "${product.name}" force deleted with inventory`
    });
  }
  
  // Delete inventory
  await supabase
    .from('inventory')
    .delete()
    .eq('product_id', product.id);
}
```

#### `/app/api/admin/categories/route.ts`

**GET - List Categories (Lines 25-50):**
```typescript
const { data: categories, error } = await supabase
  .from('categories')
  .select(`
    *,
    parent:categories!parent_id(id, name, slug)
  `)
  .order('display_order', { ascending: true })
  .order('name', { ascending: true });
```

**POST - Create Category (Lines 53-102):**
```typescript
const categoryData: any = {
  name: body.name,
  slug: slug,  // Auto-generated from name
  description: body.description || null,
  parent_id: body.parent_id || null,
  image_url: body.image_url || null,
  banner_url: body.banner_url || null,
  display_order: body.display_order ?? 0,
  is_active: body.is_active ?? true,
  featured: body.featured ?? false,
  meta_title: body.meta_title || null,
  meta_description: body.meta_description || null,
  metadata: body.metadata || {}
};

const { data, error } = await supabase
  .from('categories')
  .insert(categoryData)
  .select()
  .single();
```

**PATCH - Update Category (Lines 105-152):**
```typescript
if (updates.name && !updates.slug) {
  updates.slug = updates.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

updates.updated_at = new Date().toISOString();

const { data, error } = await supabase
  .from('categories')
  .update(updates)
  .eq('id', id)
  .select()
  .single();
```

**DELETE - Delete Category (Lines 155-219):**
```typescript
// Check if category has products
const { data: products, error: productsError } = await supabase
  .from('products')
  .select('id')
  .eq('primary_category_id', id)
  .limit(1);

if (products && products.length > 0) {
  return NextResponse.json({
    success: false,
    error: 'Cannot delete category with products. Please reassign products first.'
  }, { status: 400 });
}

// Check if category has children
const { data: children, error: childrenError } = await supabase
  .from('categories')
  .select('id')
  .eq('parent_id', id)
  .limit(1);

if (children && children.length > 0) {
  return NextResponse.json({
    success: false,
    error: 'Cannot delete category with subcategories.'
  }, { status: 400 });
}
```

#### `/app/api/admin/pricing-blueprints/route.ts`

**GET - List Blueprints (Lines 7-31):**
```typescript
const { data: blueprints, error } = await supabase
  .from('pricing_tier_blueprints')
  .select('*')
  .order('display_order', { ascending: true })
  .order('created_at', { ascending: false });
```

**POST - Create Blueprint (Lines 34-92):**
```typescript
// Validate required fields
if (!body.name || !body.slug) {
  return NextResponse.json({
    success: false,
    error: 'Name and slug are required'
  }, { status: 400 });
}

if (!body.price_breaks || !Array.isArray(body.price_breaks) || body.price_breaks.length === 0) {
  return NextResponse.json({
    success: false,
    error: 'At least one price break is required'
  }, { status: 400 });
}

// If setting as default, unset others
if (body.is_default) {
  await supabase
    .from('pricing_tier_blueprints')
    .update({ is_default: false })
    .eq('is_default', true);
}

const { data, error } = await supabase
  .from('pricing_tier_blueprints')
  .insert({
    name: body.name,
    slug: body.slug,
    description: body.description || null,
    tier_type: body.tier_type || 'weight',
    price_breaks: body.price_breaks,
    is_active: body.is_active !== false,
    is_default: body.is_default || false,
    display_order: body.display_order || 0,
    applicable_to_categories: body.applicable_to_categories || null
  })
  .select()
  .single();
```

#### `/app/api/admin/assign-pricing-blueprints/route.ts`

**POST - Auto-Assign Default Blueprint (Lines 6-114):**

Get default blueprint (Lines 13-25):
```typescript
const { data: blueprint, error: blueprintError } = await supabase
  .from('pricing_tier_blueprints')
  .select('id, name, slug')
  .eq('is_default', true)
  .eq('is_active', true)
  .single();
```

Get products needing assignments (Lines 52-61):
```typescript
const { data: existingAssignments } = await supabase
  .from('product_pricing_assignments')
  .select('product_id')
  .in('product_id', products.map(p => p.id));

const assignedProductIds = new Set((existingAssignments || []).map((a: any) => a.product_id));
const productsWithoutAssignments = products.filter(p => !assignedProductIds.has(p.id));
```

Create assignments (Lines 73-83):
```typescript
const assignments = productsWithoutAssignments.map(product => ({
  product_id: product.id,
  blueprint_id: blueprint.id,
  price_overrides: {},
  is_active: true
}));

const { data: inserted, error: insertError } = await supabase
  .from('product_pricing_assignments')
  .insert(assignments)
  .select();
```

---

### Client Components

#### `/app/vendor/products/ProductsClient.tsx`

Product interface (Lines 13-27):
```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  description?: string;
  status: 'approved' | 'pending' | 'rejected';  // ← Status field
  total_stock: number;
  custom_fields: any[];
  pricing_tiers: any[];
  images: string[];
}
```

Status filter (Lines 36-37):
```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
```

#### `/app/admin/products/page.tsx`

Status in interface (Line 36):
```typescript
status: string;  // Can be any status
```

Filter by status (Lines 61, 87):
```typescript
const [statusFilter, setStatusFilter] = useState('all');
const active = productsData.filter((p: Product) => p.status === 'active').length;
```

---

## Key Data Flows

### Product Submission Flow
```
1. Vendor POSTs /api/vendor/products
   ├── Validates required fields
   ├── Creates slug
   ├── Sets status: 'pending'  ← KEY LINE
   ├── Creates inventory if needed
   ├── Queues admin notification email
   └── Returns product with pending status

2. Admin GETs /api/admin/pending-products
   ├── Queries WHERE status = 'pending'
   ├── Enriches with vendor/category info
   └── Presents for review

3. Admin POSTs /api/admin/approve-product
   ├── action: 'approve'
   │  └── UPDATE status = 'published'
   ├── OR action: 'reject'
   │  └── UPDATE status = 'archived'
   ├── Invalidates caches
   └── Sends vendor email
```

### Pricing Flow
```
1. Admin creates pricing_tier_blueprints
   └── Defines price_breaks structure

2. Admin assigns blueprint to product
   └── INSERT INTO product_pricing_assignments

3. Vendor configures prices
   └── INSERT/UPDATE vendor_pricing_configs

4. Customer sees final price
   ├── Gets product_pricing_assignments
   ├── Gets vendor_pricing_configs
   ├── Merges with price_overrides
   └── Displays to customer
```

---

## Testing Checklist

- [ ] Vendor can create product (sets pending status)
- [ ] Vendor sees pending product in their list
- [ ] Public cannot see pending products
- [ ] Admin sees pending in pending-products endpoint
- [ ] Admin can approve (→ published)
- [ ] Admin can reject (→ archived)
- [ ] Published products visible to public
- [ ] Vendor gets email on approve
- [ ] Vendor gets email on reject
- [ ] Categories are admin-controlled
- [ ] Pricing blueprints are admin-controlled
- [ ] Vendor can configure prices per blueprint
- [ ] Cache invalidation works

