# 🗄️ SUPABASE STORAGE ARCHITECTURE

## 🎯 STORAGE STRATEGY

**Goal:** Migrate all images + PDFs to Supabase Storage with proper organization and security

---

## 📁 BUCKET STRUCTURE

### **Recommended Architecture:**

```
SUPABASE STORAGE
├── product-images (PUBLIC bucket)
│   ├── featured/
│   │   ├── {product-id}-{timestamp}.{ext}
│   │   └── {product-id}-main.webp
│   └── gallery/
│       ├── {product-id}/
│       │   ├── 1.webp
│       │   ├── 2.webp
│       │   └── 3.webp
│
├── vendor-logos (PUBLIC bucket)
│   └── {vendor-id}/
│       ├── logo.png
│       ├── logo@2x.png
│       └── banner.jpg
│
├── vendor-coas (PRIVATE bucket) ← Important for compliance
│   └── {vendor-id}/
│       ├── {product-id}/
│       │   ├── {batch-number}-coa.pdf
│       │   └── {date}-lab-report.pdf
│       └── archive/
│           └── old-coas/
│
├── category-images (PUBLIC bucket)
│   └── {category-id}/
│       ├── icon.svg
│       └── banner.jpg
│
└── vendor-product-images (PUBLIC bucket)
    └── {vendor-id}/
        └── {product-id}/
            ├── main.webp
            └── gallery/
                ├── 1.webp
                └── 2.webp
```

---

## 🔐 BUCKET SETTINGS

### **1. product-images (PUBLIC)**
```sql
CREATE BUCKET product-images
  PUBLIC = true
  FILE_SIZE_LIMIT = 10MB
  ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
```

**RLS Policies:**
- ✅ Public READ (anyone can view)
- ✅ Admin WRITE (service role only)
- ❌ Vendors cannot upload to house products

### **2. vendor-product-images (PUBLIC)**
```sql
CREATE BUCKET vendor-product-images
  PUBLIC = true
  FILE_SIZE_LIMIT = 10MB
  ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
```

**RLS Policies:**
- ✅ Public READ
- ✅ Vendor WRITE (only to their own folder)
- ✅ Admin WRITE (all folders)

### **3. vendor-coas (PRIVATE)** ⚠️
```sql
CREATE BUCKET vendor-coas
  PUBLIC = false
  FILE_SIZE_LIMIT = 25MB
  ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
```

**RLS Policies:**
- ✅ Vendor READ/WRITE (only their own COAs)
- ✅ Admin READ (all COAs)
- ✅ Customers with verified purchase can view product COAs
- ❌ No public access (compliance!)

### **4. vendor-logos (PUBLIC)**
```sql
CREATE BUCKET vendor-logos
  PUBLIC = true
  FILE_SIZE_LIMIT = 5MB
  ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
```

**RLS Policies:**
- ✅ Public READ
- ✅ Vendor WRITE (only their own logo)
- ✅ Admin WRITE (all logos)

---

## 🔗 DATABASE RELATIONSHIPS

### **Products Table**
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS 
  featured_image_storage TEXT, -- Supabase Storage URL
  image_gallery_storage TEXT[], -- Array of Storage URLs
  legacy_featured_image TEXT, -- Old WordPress URL (backup)
  legacy_image_gallery TEXT[]; -- Old WordPress URLs (backup)
```

### **Vendor COAs Table** (Already created!)
```sql
-- vendor_coas table links files to products
{
  id: UUID,
  vendor_id: UUID,
  product_id: UUID,
  file_url: TEXT, -- Supabase Storage URL
  file_name: TEXT,
  file_size: INTEGER,
  ...
}
```

### **Vendors Table**
```sql
-- Already has these fields from vendor_extended migration
{
  logo_url: TEXT, -- Supabase Storage URL
  banner_url: TEXT, -- Supabase Storage URL
  ...
}
```

**Answer: YES, they should be related via database tables!**

---

## 🎯 ARCHITECTURE DECISION

### **Related Storage (RECOMMENDED) ✅**

**Why relate files to database records:**

1. **Audit Trail** - Know who uploaded what and when
2. **Access Control** - RLS policies enforce security
3. **Orphan Prevention** - Cascade deletes clean up files
4. **Versioning** - Track file history
5. **Compliance** - Required for COAs (legal docs)

**Example:**
```typescript
// When vendor uploads COA
1. Upload file to vendor-coas/{vendor-id}/{product-id}/
2. Insert record to vendor_coas table
3. Link to product via product_id
4. RLS ensures vendor can only access their COAs
```

### **Unrelated Storage (NOT RECOMMENDED) ❌**

**Why not:**
- No way to track ownership
- No audit trail
- Files can become orphaned
- Security harder to enforce
- Compliance issues for COAs

---

## 📊 STORAGE RLS POLICIES

### **Product Images (Public, Admin-only upload)**

```sql
-- Allow public to view
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Only service role can upload
CREATE POLICY "Only admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.jwt()->>'role' = 'service_role'
);
```

### **Vendor Product Images (Public, Vendor upload)**

```sql
-- Public can view
CREATE POLICY "Public can view vendor product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-product-images');

-- Vendors can upload to their own folder
CREATE POLICY "Vendors can upload own product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can delete their own images
CREATE POLICY "Vendors can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM vendors WHERE auth.uid()::text = id::text
  )
);
```

### **Vendor COAs (Private, Restricted access)** ⚠️

```sql
-- Vendors can view their own COAs
CREATE POLICY "Vendors can view own COAs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can upload their own COAs
CREATE POLICY "Vendors can upload own COAs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM vendors WHERE auth.uid()::text = id::text
  )
);

-- Admins can view all COAs
CREATE POLICY "Admins can view all COAs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-coas'
  AND auth.jwt()->>'role' = 'service_role'
);

-- Customers can view COAs for products they purchased (optional)
CREATE POLICY "Customers can view COAs for purchased products"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[2] IN (
    SELECT DISTINCT oi.product_id::text 
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE c.auth_user_id = auth.uid()
  )
);
```

---

## 🔄 MIGRATION PLAN

### **Phase 1: Create Buckets (5 minutes)**

```typescript
// Create all buckets via Supabase Dashboard or API
const buckets = [
  { name: 'product-images', public: true },
  { name: 'vendor-product-images', public: true },
  { name: 'vendor-logos', public: true },
  { name: 'vendor-coas', public: false },
  { name: 'category-images', public: true }
];

for (const bucket of buckets) {
  await supabase.storage.createBucket(bucket.name, {
    public: bucket.public,
    fileSizeLimit: bucket.name === 'vendor-coas' ? 26214400 : 10485760 // 25MB for PDFs, 10MB for images
  });
}
```

### **Phase 2: Set RLS Policies (10 minutes)**

Apply all the RLS policies above via Supabase SQL Editor.

### **Phase 3: Migrate Images (30-60 minutes)**

**Script to migrate all product images:**

```typescript
// For each product:
1. Download image from WordPress URL
2. Upload to Supabase Storage
3. Update product.featured_image_storage with new URL
4. Keep legacy URL as backup
```

**Advantages:**
- ✅ Faster CDN delivery
- ✅ No WordPress dependency
- ✅ Better caching
- ✅ Lower WordPress hosting costs

### **Phase 4: Update Image References (10 minutes)**

Update product records to use Storage URLs:
```sql
UPDATE products 
SET featured_image_storage = 'https://{project}.supabase.co/storage/v1/object/public/product-images/...'
WHERE id = ?;
```

---

## 🏗️ RECOMMENDED APPROACH

### **Option A: Full Migration (BEST for long-term)**

**Migrate everything:**
1. All product images → Supabase Storage
2. All vendor logos → Supabase Storage  
3. All COAs → Supabase Storage (private)
4. Update all database URLs

**Benefits:**
- ✅ Complete Supabase ecosystem
- ✅ No WordPress dependency
- ✅ Better performance (CDN)
- ✅ Better security (RLS)
- ✅ Lower costs

**Time:** 2-3 hours (one-time migration)

---

### **Option B: Hybrid (CURRENT - works fine)**

**Keep WordPress images, use Supabase for new:**
- ✅ Old images: WordPress URLs (already working)
- ✅ New uploads: Supabase Storage
- ✅ COAs: Supabase Storage (private)

**Benefits:**
- ✅ Zero migration time
- ✅ Works immediately
- ✅ Gradual transition

**When to use:** If you want to deploy NOW without image migration

---

### **Option C: Progressive Migration**

**Migrate incrementally:**
1. Week 1: Vendor COAs only (compliance priority)
2. Week 2: Vendor logos & branding
3. Week 3: New product images
4. Week 4: Migrate old product images (background job)

**Benefits:**
- ✅ Low risk
- ✅ Gradual testing
- ✅ Can rollback easily

---

## 💡 MY RECOMMENDATION

### **Do This Now (15 minutes):**

1. **Create Buckets** (5 min)
   - vendor-coas (PRIVATE)
   - vendor-logos (PUBLIC)
   - vendor-product-images (PUBLIC)

2. **Set RLS Policies** (5 min)
   - Vendor-only access to COAs
   - Public access to images

3. **Deploy Upload API** (5 min)
   - Already built: `/api/supabase/vendor/upload`
   - Test with vendor COA upload

### **Do Later (Optional):**

4. **Migrate Product Images** (2-3 hours)
   - Background job
   - Update URLs in database
   - Remove WordPress dependency

---

## 🔧 QUICK START

### **Step 1: Create Buckets in Supabase**

Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/storage

Click **New Bucket** for each:

1. **vendor-coas**
   - Public: ❌ NO
   - File size limit: 25MB

2. **vendor-logos**
   - Public: ✅ YES
   - File size limit: 5MB

3. **vendor-product-images**
   - Public: ✅ YES
   - File size limit: 10MB

4. **product-images** (house products)
   - Public: ✅ YES
   - File size limit: 10MB

### **Step 2: Apply RLS Policies**

I'll create the SQL file for you...

---

## 🎯 SHOULD THEY BE RELATED?

**YES! Absolutely.**

### **For Images:**
- Link via `products.featured_image_storage`
- Link via `products.image_gallery_storage[]`
- Link via `vendors.logo_url`
- Link via `vendors.banner_url`

### **For PDFs (COAs):**
- Link via `vendor_coas` table (already built!)
- Tracks: vendor_id, product_id, file_url, expiry_date, lab_name
- **MUST be in database** for:
  - Compliance (who uploaded what)
  - Expiration tracking
  - Access control
  - Audit trail

**Example COA relationship:**
```sql
INSERT INTO vendor_coas (
  vendor_id,
  product_id,
  file_url, -- Supabase Storage URL
  file_name,
  lab_name,
  test_date,
  expiry_date
) VALUES (...);
```

---

## 📊 COMPARISON

| Approach | Images | PDFs | Database | Security |
|----------|--------|------|----------|----------|
| **WordPress** | URLs | URLs | ❌ | ⚠️ Basic |
| **Supabase Unrelated** | Bucket | Bucket | ❌ | ⚠️ Basic |
| **Supabase Related** | Bucket | Bucket | ✅ | ✅ RLS |

**Winner:** Supabase Related (what we're building!)

---

## 🚀 READY TO BUILD?

I can create:
1. ✅ Storage RLS policies SQL
2. ✅ Image migration script
3. ✅ Upload API (already done!)
4. ✅ Database schema updates

**Want me to build the complete storage system now?** 🎯

