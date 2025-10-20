# Vendor Product Creation - Testing Guide

## 🧪 Complete Test Flow

### Test Credentials
**Vendor**: Moonwater Beverages
**Email**: eli@moonwaterbeverages.com
**Password**: (Use vendor password)

---

## Test 1: Simple Product with Single Price ✅

### Steps:
1. Navigate to http://localhost:3000/vendor/login
2. Login as Moonwater vendor
3. Click "Products" → "Add New Product"
4. Fill in:
   - **Name**: Test Simple Product
   - **Description**: This is a test simple product
   - **Category**: Flower
   - **Product Type**: **Simple Product** ✅
   - **Pricing Mode**: **Single Price** ✅
   - **Price**: $25.00
   - **Initial Quantity**: 100

5. Upload 2-3 product images
6. Upload COA (PDF)
7. Click "Submit for Review"

### Expected Result:
- ✅ Form validation passes
- ✅ Product submitted successfully
- ✅ Redirects to products page
- ✅ Product appears in pending status

### Database Check:
```sql
SELECT id, vendor_id, status, vendor_notes 
FROM avu_flora_vendor_products 
WHERE vendor_id = 5 
ORDER BY id DESC LIMIT 1;
```

Should show:
```json
{
  "pricing_mode": "single",
  "price": "25.00"
}
```

---

## Test 2: Simple Product with Pricing Tiers ✅

### Steps:
1. Go to /vendor/products/new
2. Fill basic info:
   - **Name**: Blue Dream Flower
   - **Description**: Premium Blue Dream strain
   - **Category**: Flower
   - **Product Type**: **Simple Product** ✅
   - **Pricing Mode**: **Tier Pricing** ✅

3. Add Pricing Tiers:
   - Tier 1: Weight "1g", Qty 1, Price $15.00
   - Tier 2: Weight "3.5g", Qty 3.5, Price $45.00
   - Tier 3: Weight "7g", Qty 7, Price $80.00
   - Tier 4: Weight "14g", Qty 14, Price $150.00
   - Tier 5: Weight "28g", Qty 28, Price $280.00

4. Upload images and COA
5. Submit

### Expected Result:
- ✅ All 5 tiers displayed in list
- ✅ Can edit tier prices inline
- ✅ Can remove individual tiers
- ✅ Shows pricing summary
- ✅ Submits successfully

### Database Check:
```json
{
  "pricing_mode": "tiered",
  "pricing_tiers": [
    {"weight": "1g", "qty": 1, "price": "15.00"},
    {"weight": "3.5g", "qty": 3.5, "price": "45.00"},
    {"weight": "7g", "qty": 7, "price": "80.00"},
    {"weight": "14g", "qty": 14, "price": "150.00"},
    {"weight": "28g", "qty": 28, "price": "280.00"}
  ]
}
```

---

## Test 3: Variable Product (Moonwater Style) ✅

### Steps:
1. Go to /vendor/products/new
2. Fill basic info:
   - **Name**: Golden Hour THC Soda
   - **Description**: Premium nano-emulsified THC beverage
   - **Category**: **Beverages** ✅
   - **Product Type**: **Variable Product** ✅

3. Add Attribute "Flavor":
   - Click "Add Attribute"
   - Enter "Flavor"
   - Add values:
     - Fizzy Lemonade
     - Clementine Orange
     - Cherry Lime
     - Raspberry
     - Grapefruit

4. Click "Generate Variants (5 combinations)"

5. Fill variant details:
   | Variant | Price | SKU | Stock |
   |---------|-------|-----|-------|
   | Fizzy Lemonade | $4.99 | GH-FIZ | 100 |
   | Clementine Orange | $4.99 | GH-CLM | 100 |
   | Cherry Lime | $4.99 | GH-CHL | 100 |
   | Raspberry | $5.49 | GH-RAS | 75 |
   | Grapefruit | $5.49 | GH-GRP | 75 |

6. Upload product images and COA
7. Submit

### Expected Result:
- ✅ Attribute section appears
- ✅ Can add multiple values to Flavor attribute
- ✅ Generate button shows "5 combinations"
- ✅ 5 variants auto-generated
- ✅ Each variant editable inline
- ✅ Table responsive and clean
- ✅ Submits successfully

### Database Check:
```json
{
  "product_type": "variable",
  "attributes": [
    {
      "name": "Flavor",
      "values": ["Fizzy Lemonade", "Clementine Orange", "Cherry Lime", "Raspberry", "Grapefruit"]
    }
  ],
  "variants": [
    {
      "name": "Fizzy Lemonade",
      "attributes": {"Flavor": "Fizzy Lemonade"},
      "price": "4.99",
      "sku": "GH-FIZ",
      "stock": "100"
    },
    ...
  ]
}
```

---

## Test 4: Variable Product with Multiple Attributes ✅

### Steps:
1. Create new product: "THC Gummies"
2. **Product Type**: Variable
3. Add Attribute "Flavor":
   - Strawberry
   - Grape
   - Mixed Berry

4. Add Attribute "Strength":
   - 10MG
   - 25MG
   - 50MG

5. Click "Generate Variants (9 combinations)"

6. Should see 9 variants:
   - Strawberry - 10MG
   - Strawberry - 25MG
   - Strawberry - 50MG
   - Grape - 10MG
   - Grape - 25MG
   - Grape - 50MG
   - Mixed Berry - 10MG
   - Mixed Berry - 25MG
   - Mixed Berry - 50MG

7. Set different prices for different strengths
8. Submit

### Expected Result:
- ✅ Multiple attributes work
- ✅ Cartesian product generates correctly
- ✅ All 9 variants editable
- ✅ Complex combinations handled

---

## Test 5: UI/UX Testing ✅

### Visual Design Checks:
- ✅ Dark theme consistent (#1a1a1a)
- ✅ White text with proper opacity
- ✅ Smooth transitions on buttons
- ✅ Hover states work
- ✅ Border colors match design system
- ✅ Typography clean and readable

### Responsive Design:
- ✅ Desktop (1920px) - Full layout
- ✅ Tablet (768px) - Adapted layout
- ✅ Mobile (375px) - Stacked layout
- ✅ Variant table scrolls horizontally on mobile
- ✅ Touch-friendly buttons

### Interactions:
- ✅ Product type toggle works
- ✅ Pricing mode toggle works
- ✅ Add/remove attributes smooth
- ✅ Add/remove attribute values smooth
- ✅ Generate variants instant
- ✅ Inline editing in tables works
- ✅ Delete buttons have confirmation feel
- ✅ Form validation clear

---

## Test 6: Error Handling ✅

### Test Scenarios:
1. Submit variable product with no variants
   - **Expected**: Error "Please add at least one variant"

2. Submit tiered product with no tiers
   - **Expected**: Error "Please add at least one pricing tier"

3. Submit without required fields
   - **Expected**: Browser validation errors

4. Try to add duplicate attribute
   - **Expected**: Error "Attribute already exists"

5. Upload invalid file type
   - **Expected**: File rejected

---

## Test 7: Data Flow Testing ✅

### Frontend → Backend:
1. Fill complete variable product
2. Check browser console for API call
3. Should POST to: `/api/vendor-proxy?endpoint=flora-vendors/v1/vendors/me/products`

### Payload Structure:
```json
{
  "name": "Golden Hour",
  "description": "...",
  "category": "beverages",
  "product_type": "variable",
  "attributes": [...],
  "variants": [...],
  "image_urls": [...],
  "coa_url": "..."
}
```

### Backend → Database:
1. Check `avu_flora_vendor_products` table
2. New record with `vendor_id = 5`
3. `vendor_notes` contains JSON with all data
4. `status = 'pending'`

---

## 🎯 What to Test Now

### Open in Browser:
```
http://localhost:3000/vendor/login
```

### Login with Moonwater credentials

### Test All 3 Product Types:

1. **Simple + Single Price**
   - Name: Test Simple
   - Price: $25
   - Submit ✅

2. **Simple + Tiered Pricing**
   - Name: Test Tiers
   - Add 3-5 tiers
   - Submit ✅

3. **Variable Product**
   - Name: Test Beverage
   - Add Flavor attribute
   - Add 3-5 flavors
   - Generate variants
   - Fill prices
   - Submit ✅

### Verify Each:
- UI renders correctly
- Forms work smoothly
- Validation works
- Submission successful
- Database stores correctly

---

## 📊 Success Criteria

### UI/UX:
- ✅ Beautiful dark design
- ✅ Smooth interactions
- ✅ Clear visual hierarchy
- ✅ Mobile responsive
- ✅ No layout shifts
- ✅ Fast rendering

### Functionality:
- ✅ All 3 modes work (simple, tiered, variable)
- ✅ Attributes management clean
- ✅ Variant generation accurate
- ✅ Pricing tiers editable
- ✅ Form validation solid
- ✅ API calls successful

### Data Integrity:
- ✅ JSON stored correctly
- ✅ vendor_id set properly
- ✅ Status = pending
- ✅ All fields captured
- ✅ Images uploaded
- ✅ COAs linked

---

## 🔍 Debug Checklist

If issues occur:

1. **Check Browser Console** - Any JS errors?
2. **Check Network Tab** - API calls successful?
3. **Check Server Logs** - Backend errors?
4. **Check Database** - Data stored correctly?
5. **Check Styling** - CSS loading properly?

---

**Current Status**: Server running on http://localhost:3000
**Action Required**: Manual testing of all 3 product creation flows

