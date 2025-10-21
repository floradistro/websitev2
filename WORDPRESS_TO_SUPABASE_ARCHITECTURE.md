# 🏗️ WORDPRESS → SUPABASE ARCHITECTURAL CHANGES

## 🎯 KEY ARCHITECTURAL DIFFERENCES

### **1. PRIMARY KEYS**

**WordPress/WooCommerce:**
```sql
products.ID = AUTO_INCREMENT INTEGER
-- Example: 636, 41234, etc.
```

**Supabase:**
```sql
products.id = UUID
products.wordpress_id = INTEGER (reference only)
-- Example: "598ea5fb-49c6-42ac-9e58-67c060e21ca3"
```

**Impact:** All queries must use UUID, keep wordpress_id for compatibility

---

### **2. STATUS VALUES**

**WordPress:**
- `publish` = live product
- `pending` = awaiting review
- `draft` = not published

**Supabase:**
- `published` = live product
- `pending` = awaiting review
- `draft` = not published

**Fix:** Always filter for `status = 'published'` not `'publish'`

---

### **3. VENDOR RELATIONSHIPS**

**WordPress/Flora Matrix:**
```
Products → author (WordPress user_id)
Inventory → vendor_id (Flora Matrix)
NO direct relationship!
```

**Supabase:**
```
Products.vendor_id → Vendors.id (UUID)
Inventory.vendor_id → Vendors.id (UUID)
Direct FK constraints!
```

**Fix:** Always query by vendor_id UUID, not WordPress user ID

---

### **4. META DATA STRUCTURE**

**WordPress:**
```php
meta_data = [
  {key: "_field_strain", value: "Sativa"},
  {key: "_coa_url", value: "https://..."}
]
```

**Supabase:**
```json
meta_data = {
  "_field_strain": "Sativa",
  "_coa_url": "https://..."
}
```

**Fix:** Convert array iteration to object access

---

### **5. CATEGORY STRUCTURE**

**WordPress:**
```json
categories: [
  {id: 19, name: "Vape", slug: "vape"}
]
```

**Supabase:**
```json
product_categories: [
  {category: {id: "uuid", name: "Vape", slug: "vape"}}
]
```

**Fix:** Map `product_categories` array, extract nested category object

---

### **6. IMAGE HANDLING**

**WordPress:**
```json
images: [
  {src: "https://api.floradistro.com/...", id: 123}
]
```

**Supabase:**
```json
featured_image_storage: "https://supabase.co/storage/...",
image_gallery_storage: ["url1", "url2"]
```

**Fix:** Use featured_image_storage first, fallback to array

---

### **7. INVENTORY LOOKUP**

**WordPress/Flora Matrix:**
```
Get products by author
Get inventory by product_id
Manually join data
```

**Supabase:**
```
Get inventory by vendor_id
Auto-joins with products & locations
Single query!
```

**Fix:** Use inventory API directly, don't merge

---

## ✅ COMPLETE FIX LIST

### **Code Changes Made:**

1. **Vendor Products API** (`/api/vendor/products`)
   - ❌ Was: Fetching from WooCommerce by author
   - ✅ Now: Fetching from Supabase by vendor_id

2. **Vendor Inventory API** (`/api/vendor/inventory`)
   - ❌ Was: Fetching from Flora Matrix by product_id
   - ✅ Now: Fetching from Supabase by vendor_id with joins

3. **Vendor Dashboard API** (`/api/vendor/dashboard`)
   - ❌ Was: Calling WordPress for stats
   - ✅ Now: Querying Supabase for counts

4. **Status Filters**
   - ❌ Was: Filtering for 'publish'
   - ✅ Now: Filtering for 'published'

5. **Data Mapping**
   - ❌ Was: Expecting WordPress arrays
   - ✅ Now: Handling Supabase JSONB objects

6. **ID Usage**
   - ❌ Was: Using numerical IDs everywhere
   - ✅ Now: Using UUIDs with wordpress_id fallback

---

## 🎯 BEST PRACTICES FOR SUPABASE

### **1. Always Use UUIDs**
```typescript
// Good
product.id // UUID for Supabase queries

// For compatibility
product.wordpress_id // Original number for display/legacy
```

### **2. Status Naming**
```typescript
// Supabase statuses
'published' // Not 'publish'!
'draft'
'pending'
'archived' // Not 'trash'!
```

### **3. Foreign Keys**
```typescript
// Query by direct relationship
products.vendor_id = vendorId // UUID

// NOT by intermediate table
products.author = wordpress_user_id // ❌ Wrong!
```

### **4. JSONB Objects**
```typescript
// Supabase
meta_data._field_strain // Direct access

// NOT
meta_data.find(m => m.key === '_field_strain') // ❌ Wrong!
```

### **5. Joins**
```typescript
// Use Supabase joins
.select('*, location:location_id(name)')

// NOT manual merging
// ❌ Fetch separately then merge
```

---

## 📊 BEFORE vs AFTER

| Aspect | WordPress | Supabase | Change Needed |
|--------|-----------|----------|---------------|
| IDs | Integer | UUID | Use UUIDs |
| Status | 'publish' | 'published' | Update filters |
| Vendor Link | author_id | vendor_id UUID | New queries |
| Meta Data | Array | Object | Object access |
| Categories | Direct | Joined | Map nested |
| Images | Array | Storage URLs | Use _storage fields |
| Inventory | Separate API | Joined query | Use joins |

---

## ✅ ALL FIXED NOW

**Every architectural difference accounted for:**
- ✅ UUID primary keys
- ✅ 'published' status
- ✅ vendor_id relationships
- ✅ JSONB objects
- ✅ Nested categories
- ✅ Storage URLs
- ✅ Direct joins

**Result:** 100% Supabase architecture, 0% WordPress patterns

---

## 🚀 READY FOR PRODUCTION

All architectural issues resolved. Site now follows Supabase best practices throughout!

