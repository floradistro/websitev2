# VENDOR PRODUCT FLOW - COMPLETE TEST GUIDE

## ✅ FIXED FLOW (100% Supabase)

### Step 1: Vendor Creates Product
1. Login: http://localhost:3000/vendor/login
   - Email: eli@moonwaterbeverages.com  
   - Password: password123

2. Navigate to: http://localhost:3000/vendor/products/new

3. Create product:
   - Name: "Test Product"
   - Description: "Test description"
   - Category: Select any
   - Price: $25
   - Initial Quantity: 0 (stock managed later)
   - Submit

**Expected Result:**
- ✅ Product created with UUID + wordpress_id (50000+)
- ✅ Status = 'pending'
- ✅ Success notification shows
- ✅ Redirects to /vendor/products

**Console Logs:**
```
🔵 Vendor product submission - Vendor ID: [UUID]
🔵 Product data received: {...}
🔵 Assigning wordpress_id: 50001
🔵 Inserting product: {...}
✅ Product created successfully: [UUID] wordpress_id: 50001
```

---

### Step 2: Admin Approves Product
1. Navigate to: http://localhost:3000/admin/approvals

2. Find pending product

3. Click "Approve"

**Expected Result:**
- ✅ Product status → 'published'
- ✅ Success notification
- ✅ Product removed from pending list

**Console Logs:**
```
🔵 Approval request: { id: [UUID], action: 'approve' }
🔵 Approving product: [UUID]
✅ Product approved: [UUID] Test Product wordpress_id: 50001
```

---

### Step 3: Vendor Manages Inventory
1. Navigate to: http://localhost:3000/vendor/inventory

2. Find approved product (shows "Not Stocked")

3. Click product to expand

4. Enter quantity: 10

5. Click "+ ADD"

**Expected Result:**
- ✅ Inventory record auto-created (if missing)
- ✅ Quantity updated to 10
- ✅ Product stock_quantity synced
- ✅ Success notification
- ✅ Page reloads showing updated qty

**Console Logs:**
```
🔵 Approved products: 1
🔵 Inventory records: 0 (or 1 after creation)
🔵 Adjusting inventory: {...}
🔵 No inventory ID - looking up product: [UUID]
🔵 Using product wordpress_id: 50001
✅ Created new inventory record: [inv-uuid]
✅ Updated inventory: 0 → 10
🔵 Updating product Test Product stock_quantity: 10
✅ Product stock_quantity synced: 10
```

---

### Step 4: Product Appears Public
1. Navigate to: http://localhost:3000/products

2. Search or browse - product should appear

3. Navigate to: http://localhost:3000/vendors/moonwater

4. Product should appear on vendor storefront

**Expected Result:**
- ✅ Product visible on /products (stock_quantity = 10)
- ✅ Product visible on /vendors/moonwater
- ✅ Can add to cart
- ✅ Checkout works

---

## KEY FIXES APPLIED

1. ✅ Products get wordpress_id immediately on creation
2. ✅ Inventory uses product_id (integer wordpress_id)
3. ✅ Inventory adjust auto-creates records
4. ✅ Stock syncs to product.stock_quantity
5. ✅ Products filter by stock_quantity > 0
6. ✅ All notifications use Yacht Club branding
7. ✅ Full logging throughout

---

## TROUBLESHOOTING

If product doesn't appear after stock update:
1. Check terminal logs for stock sync confirmation
2. Verify `products.stock_quantity` in Supabase dashboard
3. Check `products.status = 'published'`
4. Clear cache: Click "Clear Cache" in header
5. Hard refresh: Cmd+Shift+R

---

## Database State Check

Run in Supabase SQL Editor:
```sql
-- Check product
SELECT id, name, wordpress_id, status, stock_quantity, stock_status 
FROM products 
WHERE name LIKE '%Test%';

-- Check inventory  
SELECT i.id, i.product_id, i.quantity, i.vendor_id, l.name as location
FROM inventory i
LEFT JOIN locations l ON l.id = i.location_id
WHERE i.vendor_id = '8a53da13-6d91-4105-aa51-6ed68f6b2a77';

-- Check stock movements
SELECT * FROM stock_movements 
ORDER BY created_at DESC 
LIMIT 5;
```

