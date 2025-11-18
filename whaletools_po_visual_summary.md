# WhaleTools CreatePOModal - Visual & Quick Reference

## Quick Summary

**CreatePOModal Architecture**: Single Modal, Inline Entry, NO Tabs

- Single modal with all content on one scroll
- Inline product selection + quantity/price entry
- Keyboard-driven workflow (arrow keys, Enter, Escape)
- Compact padding and height management
- Sequential form: Supplier → Location → Products → Notes

---

## 1. Flow Diagram

```
USER OPENS MODAL
       ↓
┌─────────────────────────────────┐
│ Create Purchase Order Modal     │
├─────────────────────────────────┤
│ 1. Select Supplier (required)   │ ← Native select
│ 2. Select Location (required)   │ ← Native select
│ 3. Expected Delivery (optional) │ ← Date input
├─────────────────────────────────┤
│ 4. PRODUCTS SECTION             │
│    ┌─────────────────────────┐  │
│    │ Search products... ↑↓   │  │ ← Keyboard nav
│    │ • Product 1  $12.50 ✓   │  │
│    │ • Product 2  $18.00     │  │
│    │ • Product 3  $25.00     │  │
│    └─────────────────────────┘  │
│    (User selects with ↓↓Enter)  │
│           ↓                      │
│    ┌─────────────────────────┐  │
│    │ Product 1 SKU:ABC-123 ✕ │  │ ← Entry mode
│    │ Qty: [5.00] Price:[12.50]  │
│    │ Press Enter to add ✓    │  │
│    └─────────────────────────┘  │
│    (User fills in & presses Ent)│
│           ↓                      │
│    ✓ Product 1   Qty:5   P:12.50│ ← Added to list
│    (Back to search mode)        │
│                                 │
│ 5. Internal Notes (optional)    │
│ 6. Subtotal display             │
├─────────────────────────────────┤
│ [Cancel]              [Create PO]│
└─────────────────────────────────┘
       ↓
   (if valid)
       ↓
   API POST
       ↓
   ✓ Success! Refreshed list
```

---

## 2. Size & Layout Breakdown

```
Modal: size="xl" (max-width: 95vw, sm: max-w-4xl)

HEADER: px-4 py-2.5 [COMPACT - 32px height]
┌──────────────────────────────────────┐
│ Create Purchase Order            ✕   │
└──────────────────────────────────────┘

CONTENT: p-3 sm:p-4, max-h-[calc(100vh-200px)]
┌──────────────────────────────────────┐
│ Supplier dropdown                    │
│ Location dropdown                    │
│ Date picker                          │
│                                      │ ← Scrollable
│ PRODUCTS SEARCH                      │
│ ┌────────────────────────────────┐  │
│ │ Dropdown (max-h-80)            │  │
│ │ • Item 1                       │  │
│ │ • Item 2                       │  │
│ │ • Item 3                       │  │
│ └────────────────────────────────┘  │
│                                      │
│ ADDED ITEMS (max-h-400)              │
│ ┌────────────────────────────────┐  │
│ │ Item 1 qty:5 price:12.50      │  │
│ │ Item 2 qty:3 price:18.00      │  │
│ │ Item 3 qty:2 price:25.00      │  │
│ └────────────────────────────────┘  │
│                                      │
│ Internal Notes input                 │
│ Subtotal: $180.50                    │
└──────────────────────────────────────┘

FOOTER: px-4 py-2.5 [COMPACT - 32px height]
┌──────────────────────────────────────┐
│                    [Cancel] [Create] │
└──────────────────────────────────────┘
```

---

## 3. State Diagram

```
┌─────────────────────────┐
│ SEARCH MODE             │
│ currentLineItem = null  │
│ showDropdown = false    │
├─────────────────────────┤
│ Display: Search input   │
│ + Dropdown list         │
│ (User types → filtered) │
└──────────┬──────────────┘
           │ User selects (Enter or Click)
           ↓
┌─────────────────────────┐
│ ENTRY MODE              │
│ currentLineItem = {     │
│   product: Product,     │
│   quantity: "",         │
│   unit_price: "12.50"   │
│ }                       │
├─────────────────────────┤
│ Display: Product name   │
│ + Quantity input        │
│ + Unit Price input      │
│ + Add Item button       │
└──────────┬──────────────┘
           │
      (3 paths)
      /    |    \
     /     |     \
    ↓      ↓      ↓
  [Ent]  [Esc] [Cancel]
    |      |      |
    └──────┴──────┘
         ↓
  Back to SEARCH MODE
  + Add item to lineItems
```

---

## 4. Keyboard Navigation Map

```
PRODUCT SEARCH INPUT:
  ↓ Arrow Down  → Move cursor down in dropdown
  ↑ Arrow Up    → Move cursor up in dropdown
  ⏎ Enter       → Select highlighted product OR open dropdown
  ESC           → Close dropdown, clear search

QUANTITY INPUT (after product selected):
  ⏎ Enter OR Tab → Move focus to Unit Price
  ESC            → Cancel entry, return to search

UNIT PRICE INPUT (after quantity entered):
  ⏎ Enter        → Add item, return to search
  ESC            → Cancel entry, return to search

AUTO-FOCUS CHAIN:
  Start → Search → (product selected) → Quantity → (Enter) → Price → (Enter) → Search (repeat)
```

---

## 5. Data Flow

```
CREATE PO FLOW:

1. Modal Opens
   ↓
2. Lazy Load (parallel):
   ├─ /api/vendor/suppliers?vendor_id=X
   ├─ /api/vendor/products/full?vendor_id=X
   └─ /api/vendor/locations?vendor_id=X

3. User fills supplier + location

4. User adds products via inline entry:
   - Search → Select → Enter qty → Enter price → Confirm
   - Item added to lineItems state array
   - Can edit/delete before submit

5. User clicks "Create PO" button

6. Client-side validation:
   - Supplier selected? ✓
   - Location selected? ✓
   - At least 1 item? ✓
   - Each item has qty > 0? ✓
   - Each item has valid price? ✓

7. API Call: POST /api/vendor/purchase-orders
   Payload:
   {
     action: "create",
     vendor_id: "...",
     po_type: "inbound",
     supplier_id: "...",
     location_id: "...",
     expected_delivery_date: "...", // optional
     internal_notes: "...",          // optional
     items: [
       { product_id, quantity, unit_price, line_total },
       ...
     ]
   }

8. Success → Show message (1.5s)
   ↓
9. Auto-close modal
   ↓
10. Reset all state
    ↓
11. Notify parent to refresh list
```

---

## 6. Height Management Strategy

```
Desktop Viewport (1200px height):
┌───────────────────────────────────┐
│ HEADER (50px)                     │
├───────────────────────────────────┤
│ SCROLLABLE CONTENT                │
│ max-h-[calc(100vh-200px)]         │
│                                   │
│ = 1200 - 200 = 1000px scrollable  │
│                                   │
│ Inside this:                      │
│ • Supplier/Location (100px)       │
│ • Search input (50px)             │
│ • Product dropdown (max-h-80 = 320px, scroll)
│ • Line items (max-h-400, scroll)  │
│ • Notes (50px)                    │
│ • Subtotal (40px)                 │
│                                   │
│ Everything fits but lists scroll  │
│                                   │
├───────────────────────────────────┤
│ FOOTER (50px)                     │
└───────────────────────────────────┘

Mobile Viewport (600px height):
┌───────────────────────────────────┐
│ HEADER (40px)                     │
├───────────────────────────────────┤
│ SCROLLABLE CONTENT                │
│ max-h-[calc(100vh-120px)]         │
│ = 600 - 120 = 480px scrollable    │
│ (narrower to account for mobile)  │
│                                   │
├───────────────────────────────────┤
│ FOOTER (40px)                     │
└───────────────────────────────────┘
```

---

## 7. Component File Map

```
CreatePOModal.tsx (918 lines)
├── Interfaces
│   ├── Supplier
│   ├── Product
│   ├── POLineItem
│   └── CreatePOModalProps
│
├── State (13 useState calls)
│   ├── Data: suppliers, products, locations
│   ├── Selection: selectedSupplier, selectedLocation
│   ├── Entry: currentLineItem, lineItems
│   ├── Search: productSearch, showDropdown, selectedProductIndex
│   └── Feedback: isSubmitting, error, success
│
├── Effects (2 useEffect calls)
│   ├── Load data on modal open
│   └── Scroll selected item into view
│
├── Callbacks (useCallback x 5)
│   ├── selectProduct()
│   ├── confirmLineItem()
│   ├── cancelLineItem()
│   ├── removeLineItem()
│   └── updateLineItem()
│
├── Helpers
│   ├── getFilteredProducts()
│   ├── calculateSubtotal()
│   ├── validateForm()
│   ├── handleSearchKeyDown()
│   ├── handleSubmit()
│   └── resetForm()
│
└── JSX Render
    ├── Modal wrapper
    ├── Success/Error alerts
    ├── Supplier select
    ├── Location select
    ├── Expected delivery input
    ├── PRODUCTS SECTION (conditional)
    │   ├── IF no product selected
    │   │   ├── Search input with keyboard nav
    │   │   └── Dropdown results (searchable)
    │   └── IF product selected
    │       ├── Product header with cancel
    │       ├── Quantity input (keyboard nav)
    │       └── Unit Price input (keyboard nav)
    ├── Line items list (scrollable)
    │   ├── Edit quantity/price
    │   └── Delete button
    ├── Internal notes input
    └── Subtotal display (conditional)
```

---

## 8. Why NOT Tabs?

| Question | Answer |
|----------|--------|
| Are sections independent? | NO - Supplier/Location context required before products |
| Can user skip sections? | NO - All required for valid PO |
| Do sections have separate logic? | NO - Single flow: select supplier → location → add products |
| Many sections (8+)? | NO - Only 6 sections, fits on one scroll |
| Complex branching? | NO - Linear workflow |
| Tabs needed? | NO - Single modal is simpler and better |

**Would use Tabs if**: "Edit supplier details" vs "Edit product list" (independent concerns)

---

## 9. Quick Features Checklist

```
KEYBOARD SHORTCUTS:
  ✓ Arrow keys (↑↓) → Navigate product dropdown
  ✓ Enter → Select product / Confirm quantity / Confirm price
  ✓ Tab → Move from quantity to price
  ✓ Escape → Cancel entry / Close dropdown
  ✓ Placeholder text shows hints

POWER USER FLOW:
  1. "prod" + ↓↓ + Enter        (3 keystrokes to select product)
  2. "5" + Tab + "12.50" + Enter (5 keystrokes to add item)
  3. (Repeat step 2)
  4. Tab to notes, type, click Create
  5. Fast! No mouse needed except final click

MOUSE USER FLOW:
  1. Click search, type product name, click in list
  2. Click quantity, enter value
  3. Click price, enter value
  4. Click "Add Item"
  5. (Repeat)
  6. Click Create

ACCESSIBILITY:
  ✓ All inputs have labels
  ✓ Keyboard navigation complete
  ✓ Visual focus indicators
  ✓ Error messages clear
  ✓ Success feedback
  ✓ Modal semantic HTML
```

---

## 10. Performance Considerations

```
LAZY LOADING:
  ✓ Data loaded ONLY when modal opens
  ✓ Suppliers loaded in parallel
  ✓ Products loaded in parallel
  ✓ Locations cached from context (avoid reload)
  ✓ Benefits: Smaller initial JS, faster page load

SEARCH PERFORMANCE:
  ✓ No debounce (instant filter feedback)
  ✓ Filter in-memory (allProducts array)
  ✓ Search across 3 fields (name, SKU, category)
  ✓ Only disables products in lineItems
  ✓ Fast enough for 1000+ products

RENDERING:
  ✓ Conditional render: Search mode XOR Entry mode
  ✓ Dropdown uses data-product-index for scrolling
  ✓ Line items scrollable (max-h-400)
  ✓ No infinite loops (useCallback deps correct)
  ✓ No memory leaks (cleanup in useEffect)

STATE UPDATES:
  ✓ lineItems spread operator (immutable)
  ✓ currentLineItem reset on confirm/cancel
  ✓ productSearch cleared when product selected
  ✓ Error cleared on successful action
```

---

## 11. Error States & Handling

```
LINE ITEM ENTRY ERRORS:
  "Please enter a valid quantity"
  "Please enter a valid unit price"

FORM SUBMISSION ERRORS:
  "Please select a supplier"
  "Please select a location"
  "Please add at least one product"
  "Please add valid quantities and prices"
  "Vendor not found"
  "Failed to create purchase order" (API error)

DISPLAY:
  ┌──────────────────────────────┐
  │ ✕ Error message here         │
  │ bg-red-500/10, border-red    │
  └──────────────────────────────┘
  (At top of modal, above form)

SUCCESS:
  ┌──────────────────────────────┐
  │ ✓ PO created successfully!   │
  │ bg-green-500/10              │
  └──────────────────────────────┘
  (Shows 1.5s, then auto-closes)
```

---

## 12. State Machine (Simplified)

```
States:
  - INITIAL: Modal closed
  - LOADING: Data loading (suppliers/products/locations)
  - READY: Ready for user input
  - ENTRY_MODE: Product selected, entering qty/price
  - SUBMITTING: API call in progress
  - SUCCESS: Order created, showing success message
  - ERROR: Validation or API error

Transitions:
  INITIAL → LOADING (onOpenModal)
  LOADING → READY (dataLoaded)
  READY → ENTRY_MODE (selectProduct)
  ENTRY_MODE → READY (confirmLineItem)
  ENTRY_MODE → READY (cancelLineItem)
  READY → SUBMITTING (handleSubmit if valid)
  SUBMITTING → SUCCESS (API success)
  SUBMITTING → ERROR (API error or validation fail)
  SUCCESS → INITIAL (autoClose after 1.5s)
  ERROR → READY (user can fix and retry)
  READY → INITIAL (onClose button)
  ENTRY_MODE → INITIAL (onClose button)
  Any → ERROR (any validation error)
  Error → READY (onSuccess or error clears)
```

---

## 13. CSS Classes Used

```
LAYOUT:
  w-full, flex, gap-3, mb-4, rounded-lg

COLORS:
  bg-white/5, bg-white/10, border-white/10
  text-white, text-white/60, text-white/30
  bg-red-500/10, text-red-400
  bg-green-500/10, text-green-400
  border-primary-500/30, ring-primary-500/30

SIZES:
  p-3 sm:p-4, px-3 py-2, px-4 py-2.5
  text-xs, text-sm, text-lg
  space-y-2, gap-2, gap-3

STATES:
  hover:bg-white/10, hover:border-white/20
  focus:outline-none focus:ring-2 focus:ring-primary-500/50
  disabled:opacity-50 disabled:cursor-not-allowed
  animate-pulse (loading state)

GRID:
  grid grid-cols-2, grid grid-cols-1 sm:grid-cols-2
  grid grid-cols-2 lg:grid-cols-5 (stats)
```

---

## 14. Key Implementation Details

```
REFS USED (3):
  searchInputRef → Product search input
  quantityInputRef → Quantity entry field
  unitPriceInputRef → Unit price entry field
  (Used for programmatic focus)

CONTROLLED INPUTS:
  value={productSearch}
  onChange={(e) => setProductSearch(e.target.value)}
  (All form fields are controlled components)

DROPDOWN POSITIONING:
  absolute z-10 w-full mt-2
  (Positioned below search input, full width)
  (z-10 above modal content, below modal backdrop)

SMOOTH SCROLL:
  scrollIntoView({ block: "nearest", behavior: "smooth" })
  (Used for keyboard navigation)

PRE-FILLED VALUES:
  unit_price: product.regular_price?.toString() || ""
  (Auto-fills from product data, user can edit)

ITEM IDENTIFICATION:
  data-product-index={idx}
  (Used by scrollIntoView query selector)
```

---

## 15. Files & Structure

```
/Users/whale/Desktop/whaletools/
├── app/vendor/products/components/purchase-orders/
│   ├── CreatePOModal.tsx ········· Main component (918 lines)
│   ├── PurchaseOrdersTab.tsx ····· Container & state mgmt
│   ├── POList.tsx ················ List display with actions
│   ├── POFilters.tsx ············· Search/filter bar
│   ├── POStats.tsx ··············· Stats cards
│   ├── ReceiveModal.tsx ········· Receiving workflow
│   └── types.ts ················· Shared TypeScript types
│
└── components/ds/
    ├── Modal.tsx ················ Base modal component
    ├── Button.tsx ··············· Button component
    ├── Input.tsx ················ Input component
    ├── Tabs.tsx ················· Tabs (not used in PO)
    ├── Textarea.tsx ············· Textarea component
    └── index.ts ················· Exports

ANALYSIS DOCS:
├── whaletools_po_modal_analysis.md ··· Full architecture
├── whaletools_po_code_patterns.md ··· Code snippets
└── whaletools_po_visual_summary.md ·· This file
```

---

## Quick Copy-Paste Snippets

### Focus Management Pattern
```typescript
const quantityInputRef = useRef<HTMLInputElement>(null);
setTimeout(() => quantityInputRef.current?.focus(), 50);
```

### Keyboard Navigation Pattern
```typescript
onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    confirmLineItem();
  }
}}
```

### Two-State Conditional Render
```typescript
{currentLineItem.product ? (
  // ENTRY MODE
  <div>Entry form</div>
) : (
  // SEARCH MODE
  <div>Search form</div>
)}
```

### Immutable List Update
```typescript
setLineItems([...lineItems, newItem]);
const updated = [...lineItems];
updated[index] = { ...updated[index], field: value };
setLineItems(updated);
```

### Error Alert
```typescript
{error && (
  <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-red-500/10 border border-red-500/20">
    <XCircle size={16} className="text-red-400" />
    <span className="text-red-400 text-xs">{error}</span>
  </div>
)}
```

