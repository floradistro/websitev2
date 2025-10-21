# 🗄️ STORAGE SYSTEM - READY TO DEPLOY

## 📊 WHAT'S READY

### **1. Storage Architecture Plan**
File: `SUPABASE_STORAGE_ARCHITECTURE.md`
- Complete bucket structure
- RLS policies for security
- Related vs unrelated comparison
- Best practices

### **2. SQL Policies**
File: `supabase/migrations/20251021_storage_setup.sql`
- Creates 5 buckets
- Sets all RLS policies
- Adds storage URL columns to products table

### **3. Image Migration Script**
File: `scripts/migrate-images-to-storage.mjs`
- Downloads all images from WordPress
- Uploads to Supabase Storage
- Updates product records with new URLs
- Keeps old URLs as backup

---

## 🏗️ ARCHITECTURE SUMMARY

### **Buckets:**
1. **product-images** (PUBLIC) - House product images
2. **vendor-product-images** (PUBLIC) - Vendor product images
3. **vendor-logos** (PUBLIC) - Vendor logos & banners
4. **vendor-coas** (PRIVATE) - COAs & lab reports ⚠️
5. **category-images** (PUBLIC) - Category icons

### **Database Relationships:** ✅ YES!
- Products → featured_image_storage, image_gallery_storage[]
- Vendors → logo_url, banner_url
- vendor_coas → file_url (with product_id, vendor_id, expiry_date)

**Why related:** Security, audit trail, orphan prevention, compliance!

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Create Buckets & Apply RLS**

```bash
# Copy SQL to clipboard
cat supabase/migrations/20251021_storage_setup.sql | pbcopy

# Paste in Supabase SQL Editor:
# https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new

# Click RUN
```

### **Step 2: Migrate Images (Optional)**

```bash
# Run migration script
node scripts/migrate-images-to-storage.mjs

# This will:
# - Download all 144 product images from WordPress
# - Upload to Supabase Storage
# - Update product records with new URLs
# - Keep old URLs as backup
```

**Time:** 30-60 minutes (depending on image count)

### **Step 3: Test Upload API**

```bash
# Upload API already built: /api/supabase/vendor/upload

# Test vendor logo upload:
curl -X POST http://localhost:3000/api/supabase/vendor/upload \
  -H "x-vendor-id: YOUR_VENDOR_ID" \
  -F "file=@logo.png" \
  -F "type=logo"
```

---

## 💡 RECOMMENDATIONS

### **Do Now (15 minutes):**
1. ✅ Create buckets (SQL above)
2. ✅ Apply RLS policies
3. ✅ Test vendor upload API

### **Do Later (Optional):**
4. ⏸️ Migrate existing images (30-60 min)
5. ⏸️ Update frontend to use storage URLs

### **Keep as-is (Works fine):**
- Current WordPress image URLs work perfectly
- Can migrate images anytime
- No rush, no blocking issues

---

## 🎯 READY?

Files ready to deploy:
- ✅ supabase/migrations/20251021_storage_setup.sql
- ✅ scripts/migrate-images-to-storage.mjs
- ✅ /api/supabase/vendor/upload (already built!)

**Want to deploy storage now?** 🚀
