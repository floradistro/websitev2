# 🔍 ARCHITECTURAL ISSUES - WORDPRESS vs SUPABASE

## ⚠️ PROBLEMS IDENTIFIED

### **1. Product ID Mismatch**

**WordPress:**
- Uses numerical IDs (1, 2, 3, etc.)
- products.id = number
- Filtered by author/wordpress_user_id

**Supabase:**
- Uses UUIDs for primary keys
- products.id = UUID
- products.wordpress_id = original number (for reference)
- Filtered by vendor_id = UUID

**Issue:** Code filtering by wrong ID type!

---

### **2. Status Naming Mismatch**

**WordPress:**
- 'publish' = live
- 'pending' = awaiting review
- 'draft' = draft

**Supabase:**
- 'published' = live
- 'pending' = awaiting review
- 'draft' = draft

**Issue:** Filter for p.status === 'publish' fails in Supabase!

---

### **3. Relationship Structure**

**WordPress:**
- Products linked by author_id (WordPress user)
- Inventory by vendor_id (Flora Matrix)
- No direct relationship

**Supabase:**
- Products.vendor_id → Vendors.id (UUID)
- Inventory.vendor_id → Vendors.id (UUID)
- Direct FK relationships

**Issue:** Need to use vendor_id consistently!

---

### **4. Data Structure**

**WordPress:**
- Meta data = Array of {key, value}
- Categories = Array of objects
- Images = Array of objects

**Supabase:**
- meta_data = JSONB object {key: value}
- categories = JOIN via product_categories
- images = featured_image_storage + image_gallery_storage[]

**Issue:** Code expecting arrays, getting objects!

---

## ✅ FIXES NEEDED

1. **Vendor Products Filter**
   - Change: p.status === 'publish'
   - To: p.status === 'published'

2. **Inventory Display**
   - Use inventory API data directly
   - Don't merge with products (already joined)
   - Map fields correctly

3. **Dashboard Stats**
   - Use Supabase counts (already fixed)
   - Remove WordPress user ID logic
   - Direct vendor_id filtering

---

## 🔧 FIXING NOW...
