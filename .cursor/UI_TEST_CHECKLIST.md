# UI Testing Checklist - New Product Workflow
## Purchase Orders Page - Inbound PO with New Products

Browser opened at: `http://localhost:3000/vendor/purchase-orders`

---

## ✅ Pre-Test Verification
- [ ] Page loads without errors
- [ ] Can see existing purchase orders list
- [ ] "Create New PO" button visible

---

## Test 1: Button Visibility & Modal Flow
### Steps:
1. Click "Create New PO" button
2. Select "Inbound" tab
3. Select any supplier from the list
4. Click "Next: Select Products"

### Expected Results:
- [ ] Modal opens correctly
- [ ] Inbound/Outbound tabs visible
- [ ] Supplier selection works
- [ ] **"Add New Product" button appears (GREEN with + icon)**
- [ ] Button only shows on "Inbound" tab (not on Outbound)
- [ ] Grid/List view buttons visible

---

## Test 2: New Product Form Display
### Steps:
1. Click the green "Add New Product" button

### Expected Results:
- [ ] Form expands smoothly
- [ ] Green-themed card appears
- [ ] Header shows: "Add New Product from Supplier" with package icon
- [ ] All 6 fields visible:
  - Product Name (required)
  - Supplier SKU
  - Your SKU (optional, shows "Auto-generated" placeholder)
  - Category
  - Unit Cost (required)
  - Brand (optional)
- [ ] "Cancel" and "Add to PO" buttons at bottom
- [ ] Button text changes to "Cancel" when form is open

---

## Test 3: Form Validation
### Steps:
1. Leave Product Name empty
2. Leave Unit Cost empty
3. Click "Add to PO"

### Expected Results:
- [ ] Alert shows: "Product name and unit cost are required"
- [ ] Form does NOT submit
- [ ] Form stays open

---

## Test 4: Add New Product Successfully
### Steps:
1. Fill in Product Name: "Blue Dream Premium"
2. Fill in Supplier SKU: "SUP-BD-001"
3. Leave Your SKU empty (test auto-generation)
4. Fill in Category: "Flower"
5. Fill in Unit Cost: "25.00"
6. Fill in Brand: "Jungle Boys"
7. Click "Add to PO"

### Expected Results:
- [ ] Form closes automatically
- [ ] **New green card appears below** labeled "New Products (1)"
- [ ] Product listed with:
  - Name: "Blue Dream Premium"
  - GREEN "NEW" badge
  - Shows: SKU, Category, Cost
  - Quantity input box (default: 1)
  - Red X button to remove
- [ ] Product is automatically selected (appears in selectedProducts)

---

## Test 5: Quantity Adjustment
### Steps:
1. Find the new product in the "New Products" section
2. Change quantity from 1 to 50

### Expected Results:
- [ ] Quantity updates in real-time
- [ ] No errors in console
- [ ] Value persists if you scroll

---

## Test 6: Remove New Product
### Steps:
1. Click the red X button on a new product

### Expected Results:
- [ ] Product disappears from "New Products" list
- [ ] If no new products remain, entire card disappears
- [ ] No errors

---

## Test 7: Add Multiple New Products
### Steps:
1. Click "Add New Product" again
2. Add: "Gorilla Glue #4", cost: $22.00
3. Click "Add New Product" again
4. Add: "Sour Diesel", cost: $24.00

### Expected Results:
- [ ] Both products appear in "New Products (2)" section
- [ ] Both have green "NEW" badges
- [ ] Both have separate quantity inputs
- [ ] Both can be removed independently

---

## Test 8: Mix New + Existing Products
### Steps:
1. Scroll down to existing products grid
2. Select 2 existing products (click their cards)
3. Verify you have 2 new products + 2 existing = 4 total

### Expected Results:
- [ ] Selected products count shows: "Select Products (4 selected)"
- [ ] Can see both new products section AND existing products selected
- [ ] No duplicate IDs or conflicts

---

## Test 9: Form Reset on Cancel
### Steps:
1. Click "Add New Product"
2. Fill in some fields (name: "Test", cost: "10")
3. Click "Cancel" (WITHOUT clicking "Add to PO")

### Expected Results:
- [ ] Form closes
- [ ] No new product added
- [ ] When reopening form, all fields are empty
- [ ] Form state properly reset

---

## Test 10: Submit Complete PO
### Steps:
1. Have 2-3 new products + 1-2 existing products selected
2. Set quantities for each
3. Click "Review & Submit" (or next step button)
4. Complete PO creation

### Expected Results:
- [ ] PO submits successfully
- [ ] Success message shows: "created successfully with X new product(s)"
- [ ] Modal closes
- [ ] New PO appears in the list with correct PO number
- [ ] No JavaScript errors in console

---

## Test 11: Verify in Database
### Steps:
1. After creating PO, open browser DevTools → Network tab
2. Refresh purchase orders page
3. Check API response

### Expected Results:
- [ ] New PO exists in list
- [ ] Has correct subtotal (sum of all items)
- [ ] Has correct item count
- [ ] PO number formatted: IN-PO-YYYYMMDD-####

---

## Test 12: Check Created Products
### Steps:
1. Navigate to `/vendor/products` page
2. Search for the new products you created

### Expected Results:
- [ ] New products exist in database
- [ ] Have status: "draft"
- [ ] Have auto-generated SKUs (if left blank)
- [ ] Have cost_price set
- [ ] Have regular_price = cost * 2 (100% markup)
- [ ] Description includes PO number
- [ ] meta_data includes: created_from_po, po_id, workflow_status

---

## Test 13: Styling & UX
### Visual Checks:
- [ ] Green theme for new product features (buttons, cards, badges)
- [ ] Smooth animations (form expand/collapse)
- [ ] Proper spacing and alignment
- [ ] Text readable on dark background
- [ ] Form inputs have focus states (green border on focus)
- [ ] Buttons have hover states
- [ ] Badge colors correct (green for NEW)
- [ ] No layout shifts when adding/removing products

---

## Test 14: Edge Cases
### Test Long Names:
1. Add product with 100+ character name
- [ ] Doesn't break layout
- [ ] Truncates gracefully or wraps

### Test Special Characters:
1. Add product with name: "Product™ & Co. (Test) #1"
- [ ] Accepts special characters
- [ ] Displays correctly

### Test Decimal Costs:
1. Add product with cost: 15.99
- [ ] Accepts decimal
- [ ] Displays correctly as $15.99

---

## Test 15: Responsive Design (Optional)
### If time permits:
- [ ] Resize browser to mobile width (~375px)
- [ ] Form still usable
- [ ] 2-column grid becomes 1-column on mobile
- [ ] Buttons stack vertically
- [ ] All text readable

---

## ❌ Known Issues to Report:
_(Fill in during testing)_

1. Issue: _______________
   - Steps to reproduce: _______________
   - Expected: _______________
   - Actual: _______________

---

## 🎉 Success Criteria:
All checkboxes should be ✅ for feature to be production-ready.

**Minimum Requirements:**
- [ ] Tests 1-10 all pass
- [ ] No console errors
- [ ] Data saves correctly to database
- [ ] UI is visually polished

**Bonus:**
- [ ] Tests 11-15 pass
- [ ] Mobile responsive works
- [ ] Accessibility (keyboard navigation works)

---

## 📊 Backend Tests Already Passed:
✅ 27/27 comprehensive API tests (100% pass rate)
- New products only: ✅
- Existing products only: ✅
- Mixed products: ✅
- Validation: ✅
- Database integrity: ✅
- Edge cases: ✅

---

*Tested by: _________*
*Date: October 27, 2025*
*Browser: _________*
*Pass Rate: ___/15 tests*
