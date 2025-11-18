# WhaleTools CreatePOModal - Code Patterns Reference

## Pattern 1: Inline Entry State Management

### The Two-State Pattern
The modal switches between "Search Mode" and "Entry Mode" by checking if a product is selected:

```typescript
// Define the current line item being edited
const [currentLineItem, setCurrentLineItem] = useState<{
  product: Product | null;
  quantity: string;
  unit_price: string;
}>({ product: null, quantity: "", unit_price: "" });

// In JSX, render conditionally:
{currentLineItem.product ? (
  // ENTRY MODE - Show quantity/price inputs
  <div className="rounded-lg border-2 p-4 mb-3 bg-white/5 border-primary-500/50">
    {/* Product header */}
    {/* Quantity & Unit Price fields */}
    {/* Add Item button */}
  </div>
) : (
  // SEARCH MODE - Show search input and dropdown
  <>
    {/* Search input */}
    {/* Product dropdown results */}
  </>
)}
```

### Switching Between States

```typescript
// Enter entry mode (product selected)
const selectProduct = useCallback((product: Product) => {
  setCurrentLineItem({
    product,
    quantity: "",
    unit_price: product.regular_price?.toString() || "",
  });
  setProductSearch(""); // Clear search
  setShowDropdown(false); // Hide dropdown
  setTimeout(() => quantityInputRef.current?.focus(), 50); // Auto-focus quantity
}, []);

// Exit entry mode (product added or cancelled)
const cancelLineItem = useCallback(() => {
  setCurrentLineItem({ product: null, quantity: "", unit_price: "" });
  setProductSearch("");
  setError(null);
  setTimeout(() => searchInputRef.current?.focus(), 50); // Return to search
}, []);

// Confirm and add item
const confirmLineItem = useCallback(() => {
  // ... validation ...
  setLineItems([...lineItems, newItem]);
  setCurrentLineItem({ product: null, quantity: "", unit_price: "" }); // Back to search mode
  setProductSearch("");
  setTimeout(() => searchInputRef.current?.focus(), 50);
}, [currentLineItem, lineItems]);
```

---

## Pattern 2: Keyboard Navigation with Arrow Keys

### Product Dropdown Navigation

```typescript
const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Only handle keys if dropdown is open
  if (!showDropdown || filteredProducts.length === 0) {
    if (e.key === "Enter" && !showDropdown) {
      setShowDropdown(true); // Open dropdown on Enter
    }
    return;
  }

  // Handle arrow keys and Enter
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setSelectedProductIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev // Don't go past end
      );
      break;
      
    case "ArrowUp":
      e.preventDefault();
      setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : 0)); // Don't go before start
      break;
      
    case "Enter":
      e.preventDefault();
      if (filteredProducts[selectedProductIndex]) {
        selectProduct(filteredProducts[selectedProductIndex]);
      }
      break;
      
    case "Escape":
      e.preventDefault();
      setShowDropdown(false);
      setProductSearch("");
      break;
  }
};

// Auto-scroll selected item into view
useEffect(() => {
  if (showDropdown && filteredProducts.length > 0) {
    const selectedElement = document.querySelector(
      `[data-product-index="${selectedProductIndex}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
}, [selectedProductIndex, showDropdown, filteredProducts.length]);
```

### Dropdown Item with Keyboard Selection

```typescript
{filteredProducts.map((product, idx) => {
  const isAdded = lineItems.some((item) => item.product_id === product.id);
  const isSelected = idx === selectedProductIndex;
  
  return (
    <button
      key={product.id}
      data-product-index={idx}  // Used for scrollIntoView
      onClick={() => selectProduct(product)}
      disabled={isAdded}
      onMouseEnter={() => setSelectedProductIndex(idx)}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left",
        "hover:bg-white/10 transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isSelected && !isAdded && "bg-white/10 ring-1 ring-primary-500/30", // Visual indicator
      )}
    >
      {/* Product info */}
    </button>
  );
})}
```

---

## Pattern 3: Tab-Like Focus Flow Without Tabs

### Three-Input Focus Sequence

```typescript
const quantityInputRef = useRef<HTMLInputElement>(null);
const unitPriceInputRef = useRef<HTMLInputElement>(null);
const searchInputRef = useRef<HTMLInputElement>(null);

// In quantity input: Enter or Tab moves to unit price
<input
  ref={quantityInputRef}
  type="number"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      unitPriceInputRef.current?.focus(); // Move to next field
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelLineItem(); // Cancel entry
    }
  }}
/>

// In unit price input: Enter confirms, Escape cancels
<input
  ref={unitPriceInputRef}
  type="number"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmLineItem(); // Submit and go back to search
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelLineItem(); // Cancel entry
    }
  }}
/>
```

**User Flow**:
1. Search & find product
2. Press Enter → Product selected, quantity input auto-focused
3. Type quantity, press Enter/Tab → Unit price input auto-focused
4. Type price, press Enter → Item added, back to search
5. Repeat or press Escape to exit

---

## Pattern 4: Pre-filling Values from Dropdown

### Auto-populate Unit Price from Product

```typescript
const selectProduct = useCallback((product: Product) => {
  setCurrentLineItem({
    product,
    quantity: "",
    unit_price: product.regular_price?.toString() || "", // PRE-FILL!
  });
  // ...
}, []);

// In the input
<input
  ref={unitPriceInputRef}
  type="number"
  value={currentLineItem.unit_price}
  onChange={(e) =>
    setCurrentLineItem({ ...currentLineItem, unit_price: e.target.value })
  }
  min={0}
  step={0.01}
  placeholder="0.00"
/>
```

**Benefit**: Reduces typing. If price is wrong, user can easily edit. Shows in dropdown too:

```typescript
{product.regular_price && (
  <div className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
    ${parseFloat(product.regular_price.toString()).toFixed(2)}
  </div>
)}
```

---

## Pattern 5: Height Management with Max-Height + Scroll

### Modal Content Container

```typescript
// Modal wrapper (Modal.tsx)
<div className="p-3 sm:p-4 max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
  {children}
</div>
```

### Line Items List

```typescript
// Line items are in their own scrollable container
<div className="space-y-2 max-h-[400px] overflow-y-auto">
  {lineItems.map((item, index) => (
    <div key={index} className="rounded-lg border p-3 ...">
      {/* Item content */}
    </div>
  ))}
</div>
```

### Product Dropdown

```typescript
{showDropdown && (
  <div
    className={cn(
      "absolute z-10 w-full mt-2 rounded-lg border max-h-80 overflow-y-auto", // Max height + scroll
      "bg-black/95 backdrop-blur-xl",
      ds.colors.border.default,
      "shadow-2xl",
    )}
  >
    {/* Products */}
  </div>
)}
```

**Strategy**:
- Parent modal: `max-h-[calc(100vh-200px)]` → leaves room for header/footer
- Line items list: `max-h-[400px]` → prevent huge list
- Dropdown: `max-h-80` → keep dropdown manageable
- All use `overflow-y-auto` for scrolling

---

## Pattern 6: Real-Time Filtering with Search

### Debounce-Free Search (Fast)

```typescript
const getFilteredProducts = () => {
  if (!productSearch.trim()) {
    return allProducts; // Show all if empty
  }

  // Search across name, SKU, and category
  const searchLower = productSearch.toLowerCase();
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower) ||
      p.primary_category?.name.toLowerCase().includes(searchLower)
  );
};

const filteredProducts = getFilteredProducts();

// In search input
<input
  ref={searchInputRef}
  type="text"
  value={productSearch}
  onChange={(e) => {
    setProductSearch(e.target.value);
    setShowDropdown(true); // Show dropdown as user types
  }}
  onFocus={() => setShowDropdown(true)}
  onBlur={() => {
    setTimeout(() => setShowDropdown(false), 200); // Delay to allow clicks
  }}
  placeholder="Search products... (↑↓ to navigate, Enter to select)"
/>
```

**Key Features**:
- No debounce delay (instant feedback)
- Shows count: `{filteredProducts.length} products`
- Disables products already in lineItems
- Search across multiple fields

---

## Pattern 7: Lazy Loading on Modal Open

### Parallel Data Loading

```typescript
useEffect(() => {
  if (isOpen && vendor?.id) {
    // Load all data in parallel
    loadSuppliers();
    loadProducts();
    // Load locations if not in context
    if (!contextLocations || contextLocations.length === 0) {
      loadLocations();
    } else {
      setLocations(contextLocations);
    }
  }
}, [isOpen, vendor?.id, contextLocations]);

const loadSuppliers = async () => {
  if (!vendor?.id) return;
  setLoadingSuppliers(true);
  try {
    const response = await fetch(`/api/vendor/suppliers?vendor_id=${vendor.id}`, {
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      setSuppliers(data.data || []);
    }
  } catch (err) {
    logger.error("Failed to load suppliers:", err);
  } finally {
    setLoadingSuppliers(false);
  }
};

// Similar for loadProducts and loadLocations
```

**Benefits**:
- Only load when modal opens (saves bandwidth)
- Load in parallel (faster than sequential)
- Cache locations from context (avoid duplicate loads)
- Show loading state in selects: `{loadingSuppliers ? "Loading suppliers..." : "Select supplier"}`

---

## Pattern 8: Form Validation (Client-Side First)

### Progressive Validation

```typescript
// Step 1: Validate individual line item
const confirmLineItem = useCallback(() => {
  if (!currentLineItem.product) return;

  const quantity = parseFloat(currentLineItem.quantity);
  const unit_price = parseFloat(currentLineItem.unit_price);

  if (!quantity || quantity <= 0) {
    setError("Please enter a valid quantity");
    return; // Don't proceed
  }

  if (unit_price < 0 || isNaN(unit_price)) {
    setError("Please enter a valid unit price");
    return;
  }

  // If valid, add to list
  const newItem: POLineItem = {
    product_id: currentLineItem.product.id,
    product_name: currentLineItem.product.name,
    product_sku: currentLineItem.product.sku || "",
    quantity,
    unit_price,
  };

  setLineItems([...lineItems, newItem]);
  setCurrentLineItem({ product: null, quantity: "", unit_price: "" });
  setError(null); // Clear error on success
}, [currentLineItem, lineItems]);

// Step 2: Validate full form before submit
const validateForm = () => {
  if (!selectedSupplier) {
    setError("Please select a supplier");
    return false;
  }

  if (!selectedLocation) {
    setError("Please select a location");
    return false;
  }

  if (lineItems.length === 0) {
    setError("Please add at least one product");
    return false;
  }

  const validItems = lineItems.filter(
    (item) => item.product_id && item.quantity > 0 && item.unit_price >= 0
  );

  if (validItems.length === 0) {
    setError("Please add valid quantities and prices");
    return false;
  }

  return true;
};

// Step 3: Use validation before API call
const handleSubmit = async () => {
  if (!vendor?.id) {
    setError("Vendor not found");
    return;
  }

  if (!validateForm()) return; // Stop if validation fails

  setIsSubmitting(true);
  setError(null);

  try {
    // API call
  } catch (err: any) {
    setError(err.message || "Failed to create purchase order");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Pattern 9: State Reset After Success

### Clean Slate After Modal Closes

```typescript
const resetForm = () => {
  setSelectedSupplier("");
  setSelectedLocation("");
  setExpectedDeliveryDate("");
  setInternalNotes("");
  setLineItems([]);
  setProductSearch("");
  setShowDropdown(false);
  setCurrentLineItem({ product: null, quantity: "", unit_price: "" });
  setSelectedProductIndex(0);
  setError(null);
  setSuccess(false);
};

// Called after API success
const handleSubmit = async () => {
  // ... API call ...
  setSuccess(true);
  setTimeout(() => {
    onSuccess(); // Notify parent to refresh list
    onClose(); // Close modal
    resetForm(); // Reset all state
  }, 1500); // Show success message for 1.5s
};
```

---

## Pattern 10: Inline Edit for Line Items

### After Items Are Added

```typescript
// Users can edit quantities and prices after adding
<div className="grid grid-cols-2 gap-2">
  <div>
    <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1 block")}>
      Quantity
    </label>
    <Input
      type="number"
      value={item.quantity ? String(item.quantity) : ""}
      onChange={(e) =>
        updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)
      }
      min={0}
      step={0.01}
      placeholder="0.00"
    />
  </div>
  <div>
    <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1 block")}>
      Unit Price
    </label>
    <Input
      type="number"
      value={item.unit_price ? String(item.unit_price) : ""}
      onChange={(e) =>
        updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)
      }
      min={0}
      step={0.01}
      placeholder="0.00"
    />
  </div>
</div>

// Calculate and show line total
{item.quantity > 0 && item.unit_price > 0 && (
  <div className={cn("text-right mt-2", ds.typography.size.xs, ds.colors.text.tertiary)}>
    Line Total: ${(item.quantity * item.unit_price).toFixed(2)}
  </div>
)}

// Helper function
const updateLineItem = (index: number, field: keyof POLineItem, value: any) => {
  const updated = [...lineItems];
  updated[index] = { ...updated[index], [field]: value };
  setLineItems(updated);
};

// Delete button
<Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
  <Trash2 size={12} />
</Button>
```

---

## Pattern 11: Smart Default Showing

### Empty State vs. Data Display

```typescript
// Only show subtotal if there are items and a subtotal
const subtotal = calculateSubtotal();

{subtotal > 0 && (
  <div className={cn("rounded-lg p-3", ds.colors.bg.secondary)}>
    <div className="flex items-center justify-between">
      <span className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>Subtotal</span>
      <span className={cn(ds.typography.size.lg, "text-white font-light")}>
        ${subtotal.toFixed(2)}
      </span>
    </div>
    <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mt-1")}>
      {lineItems.length} items • Tax and shipping can be added after PO is created
    </div>
  </div>
)}

// Empty state for products
{lineItems.length > 0 ? (
  <div className="space-y-2 max-h-[400px] overflow-y-auto">
    {/* Line items list */}
  </div>
) : (
  <div className="rounded-lg border-2 border-dashed p-8 text-center ...">
    <Search size={32} className="mx-auto mb-2 opacity-20" />
    <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
      Search and add products to your purchase order
    </p>
  </div>
)}
```

---

## Pattern 12: Success/Error Messages as Inline Alerts

### NOT Modal Popups, Just Alerts

```typescript
{/* Error Alert */}
{error && (
  <div className={cn(
    "flex items-center gap-2 p-3 rounded-lg mb-4",
    "bg-red-500/10 border border-red-500/20",
  )}>
    <XCircle size={16} className="text-red-400" />
    <span className={cn(ds.typography.size.xs, "text-red-400")}>{error}</span>
  </div>
)}

{/* Success Alert */}
{success && (
  <div className={cn(
    "flex items-center gap-2 p-3 rounded-lg mb-4",
    "bg-green-500/10 border border-green-500/20",
  )}>
    <CheckCircle2 size={16} className="text-green-400" />
    <span className={cn(ds.typography.size.xs, "text-green-400")}>
      Purchase order created successfully!
    </span>
  </div>
)}
```

**Benefits**:
- No modal interrupt
- Stays in context
- Clear visual hierarchy (color-coded)
- Auto-dismisses on success (1.5s timeout)

---

## Summary of Code Patterns

| Pattern | Use Case | Key Code |
|---------|----------|----------|
| Inline Entry | Product selection + entry | Two-state `currentLineItem` |
| Arrow Key Nav | Product search | `handleSearchKeyDown` with switch |
| Tab-Like Flow | Quantity → Price → Confirm | `useRef` + `focus()` chain |
| Pre-filling | Auto-populate from data | Use `product.regular_price` |
| Max-Height Scroll | Prevent modal bloat | `max-h-[Xpx] overflow-y-auto` |
| Lazy Loading | Load on open | `useEffect([isOpen])` |
| Progressive Validation | Item → Form | Two validation functions |
| State Reset | Clean after success | `resetForm()` helper |
| Line Item Edit | Post-add modifications | `updateLineItem()` helper |
| Empty States | User guidance | Conditional render with icon |
| Alerts | Feedback without popups | Inline colored divs |

