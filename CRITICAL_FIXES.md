# CRITICAL FIXES - CODE EXAMPLES

## ISSUE #1: Floating Point Arithmetic

### Current (BROKEN):
```typescript
// app/api/vendor/inventory/grouped/route.ts - Line 71
const total_quantity = productInventory.reduce(
  (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
  0,
); // 1.1 + 2.2 = 3.3000000000000003 ❌
```

### Fixed:
```typescript
// Use integer arithmetic (store as smallest unit - milligrams or cents)
const total_quantity = productInventory.reduce(
  (sum, inv) => {
    const qtyInGrams = parseFloat(inv.quantity) || 0;
    const qtyInMilligrams = Math.round(qtyInGrams * 1000);
    return sum + qtyInMilligrams;
  },
  0,
) / 1000; // Convert back to grams with proper rounding

// OR use BigDecimal library:
import { Decimal } from 'decimal.js';
const total_quantity = productInventory.reduce(
  (sum, inv) => sum.plus(new Decimal(inv.quantity || 0)),
  new Decimal(0),
).toNumber();
```

---

## ISSUE #2: Cache Invalidation Strategy

### Current (BROKEN):
```typescript
// app/api/vendor/products/list/route.ts - Line 133
cache: {
  enabled: false, // TEMP: Disabled to debug product loading issue ❌
  ttl: 300,
  keyGenerator: ...
}

// app/api/vendor/products/route.ts - Line 291
await CacheInvalidation.products(vendorId); // Tries to invalidate non-existent cache ❌
```

### Fixed:
```typescript
// Step 1: Remove the TEMP disabled cache
cache: {
  enabled: true,
  ttl: 300,
  keyGenerator: (request, context) => {
    const { searchParams } = new URL(request.url);
    // Include all filter params in key to avoid cache collision
    return `products:list:${context.vendorId}:${searchParams.toString()}`;
  },
}

// Step 2: Ensure invalidation is called after mutations
// In POST/PUT/DELETE handlers:
await CacheInvalidation.products(vendorId);
await CacheInvalidation.products(`${vendorId}:categories`);

// Step 3: Verify CacheInvalidation utility exists
// If not, implement it:
export const CacheInvalidation = {
  async products(vendorId: string) {
    // Delete cache with pattern matching
    const pattern = `products:*:${vendorId}:*`;
    await redis.del(pattern);
  }
};
```

---

## ISSUE #3: Inventory Double-Counting

### Current (BROKEN):
```typescript
// app/api/vendor/inventory/grouped/route.ts - Lines 67-95
const total_quantity = productInventory.reduce(
  (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
  0, // Includes ALL locations
);

const locationInventory = productInventory
  .filter((inv) => parseFloat(inv.quantity) > 0) // Filters OUT zero locations
  .map((inv) => ({...}));

// PROBLEM: total_quantity includes zeros, locationInventory doesn't ❌
```

### Fixed:
```typescript
// Calculate totals and filtered list consistently
const filteredInventory = productInventory.filter(
  (inv) => parseFloat(inv.quantity) > 0
);

const total_quantity = filteredInventory.reduce(
  (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
  0,
);

const locationInventory = filteredInventory.map((inv) => ({
  inventory_id: inv.id.toString(),
  location_id: inv.location_id,
  location_name: locationMap.get(inv.location_id) || "Unknown",
  quantity: parseFloat(inv.quantity) || 0,
}));

// Now both values are calculated from the same filtered set ✓
```

---

## ISSUE #4: Missing Numeric Validation

### Current (BROKEN):
```typescript
// app/api/vendor/products/route.ts - Lines 118-124
const stockQty = productData.initial_quantity
  ? parseInt(productData.initial_quantity.toString())
  : 0; // Accepts negative numbers ❌

regular_price: productData.price ? parseFloat(productData.price.toString()) : null, // Accepts negative ❌
```

### Fixed:
```typescript
// Validate all numeric inputs
function validateNumerics(data: any) {
  const errors: string[] = [];

  if (data.initial_quantity !== undefined) {
    const qty = parseFloat(data.initial_quantity);
    if (isNaN(qty) || !isFinite(qty)) {
      errors.push('initial_quantity must be a valid number');
    }
    if (qty < 0) {
      errors.push('initial_quantity cannot be negative');
    }
  }

  if (data.price !== undefined) {
    const price = parseFloat(data.price);
    if (isNaN(price) || !isFinite(price)) {
      errors.push('price must be a valid number');
    }
    if (price <= 0) {
      errors.push('price must be greater than zero');
    }
  }

  if (data.cost_price !== undefined) {
    const cost = parseFloat(data.cost_price);
    if (isNaN(cost) || !isFinite(cost)) {
      errors.push('cost_price must be a valid number');
    }
    if (cost < 0) {
      errors.push('cost_price cannot be negative');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Use in your API:
const validation = validateNumerics(productData);
if (!validation.valid) {
  return NextResponse.json(
    { success: false, errors: validation.errors },
    { status: 400 }
  );
}
```

---

## ISSUE #5: Filter Endpoint Debouncing

### Current (BROKEN):
```typescript
// app/vendor/products/components/inventory/InventoryTab.tsx - Line 87-90
const response = await axios.get("/api/vendor/inventory/grouped", {
  headers: { "x-vendor-id": vendor.id },
  timeout: 20000,
});

// Called immediately on every filter change ❌
<select
  value={locationFilter}
  onChange={(e) => setLocationFilter(e.target.value)} // Fires API call on each keystroke
/>
```

### Fixed:
```typescript
// Step 1: Add debounced filter handler
import { useMemo } from 'react';

const handleLocationFilterChange = useMemo(
  () => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setLocationFilter(value);
      }, 500); // Wait 500ms after last change before fetching
    };
  },
  []
);

// Step 2: Or use a dedicated debounce hook
import { useDebouncedCallback } from 'use-debounce';

const debouncedSetLocationFilter = useDebouncedCallback((value: string) => {
  setLocationFilter(value);
}, 500);

// Step 3: Use it in the filter
<select
  value={locationFilter}
  onChange={(e) => debouncedSetLocationFilter(e.target.value)}
/>

// Step 4: Consider caching the result
const queryClient = useQueryClient();
const cacheKey = ['inventory', { locationFilter, categoryFilter, vendor: vendor?.id }];

const handleFilterChange = useCallback((value: string) => {
  // Check if we have cached data for this filter before fetching
  const cachedData = queryClient.getQueryData(cacheKey);
  if (cachedData) {
    setLocationFilter(value);
  } else {
    // Only fetch if no cache
    debouncedSetLocationFilter(value);
  }
}, []);
```

---

## ISSUE #6: Race Condition in Stock Adjustments

### Current (BROKEN):
```typescript
// app/vendor/products/components/inventory/LocationStock.tsx - Line 40-48
const handleDirectEdit = async () => {
  const newQty = parseFloat(editValue);
  if (!isNaN(newQty) && newQty >= 0) {
    const change = newQty - quantity;
    if (change !== 0) {
      await onAdjust(...); // No error handling ❌
    }
    setEditMode(false); // Closes regardless of success ❌
  }
};
```

### Fixed:
```typescript
const handleDirectEdit = async () => {
  const newQty = parseFloat(editValue);
  
  if (isNaN(newQty) || !isFinite(newQty)) {
    setError('Please enter a valid number');
    return;
  }
  
  if (newQty < 0) {
    setError('Quantity cannot be negative');
    return;
  }

  const change = newQty - quantity;
  if (change === 0) {
    setEditMode(false);
    return; // No change needed
  }

  try {
    // Wait for the adjustment to complete AND verify success
    await onAdjust(productId, locationId, inventoryId, change);
    
    // Only close edit mode on success
    setEditMode(false);
    setError(null);
  } catch (error) {
    // Show error and keep edit mode open
    const errorMsg = error instanceof Error ? error.message : 'Failed to adjust stock';
    setError(errorMsg);
    
    // Don't close the edit box - let user retry or cancel manually
    console.error('Stock adjustment failed:', error);
  }
};
```

---

## ISSUE #7: Unvalidated Bulk Operations

### Current (BROKEN):
```typescript
// app/vendor/products/components/inventory/InventoryTab.tsx - Line 272-319
const handleBulkZeroOut = useCallback(async () => {
  if (!confirm(`Zero out ${selectedItems.size} selected items?`)) return;

  setBulkOperating(true);
  try {
    const items = Array.from(selectedItems).map((key) => {
      const [productId, locationId] = key.split("-");
      // NO validation that product still exists ❌
    });

    const response = await axios.post(...);

    if (response.data.success) {
      setSelectedItems(new Set()); // Clears selection ❌
      // No per-item verification of success ❌
    }
  } catch (error: any) {
    // Doesn't know which items failed ❌
  }
});
```

### Fixed:
```typescript
const handleBulkZeroOut = useCallback(async () => {
  // Step 1: Detailed confirmation with item list
  const itemList = Array.from(selectedItems)
    .map(key => {
      const [productId, locationId] = key.split("-");
      const product = products.find(p => p.product_id === productId);
      return `${product?.product_name} at ${locationMap.get(locationId)}`;
    })
    .join('\n');

  const confirmed = await showConfirm({
    title: 'Zero Out Inventory',
    message: `Zero out the following items?\n\n${itemList}`,
    confirmText: 'Zero Out',
    cancelText: 'Cancel',
  });

  if (!confirmed) return;

  setBulkOperating(true);
  const failedItems: string[] = [];
  const results = { success: 0, failed: 0 };

  try {
    // Step 2: Validate items exist before sending
    const itemsToZero = Array.from(selectedItems)
      .map((key) => {
        const [productId, locationId] = key.split("-");
        const product = products.find((p) => p.product_id === productId);
        
        if (!product) {
          failedItems.push(`Product ${productId} not found`);
          results.failed++;
          return null;
        }
        
        return {
          productId,
          locationId,
          inventoryId: product.locations.find(l => l.location_id === locationId)?.inventory_id,
          currentQuantity: product.locations.find(l => l.location_id === locationId)?.quantity || 0,
        };
      })
      .filter(item => item !== null);

    if (itemsToZero.length === 0) {
      showNotification({
        type: 'error',
        title: 'No Valid Items',
        message: 'No items available to zero out. Please refresh and try again.',
      });
      return;
    }

    // Step 3: Call API with full item data
    const response = await axios.post(
      "/api/vendor/inventory/bulk-operations",
      {
        operation: "zero_out",
        items: itemsToZero,
      },
      { headers: { "x-vendor-id": vendor?.id } },
    );

    // Step 4: Verify response includes per-item results
    if (response.data.success && response.data.results) {
      results.success = response.data.results.success || itemsToZero.length;
      results.failed = response.data.results.failed || 0;

      // Step 5: Only deselect items that were successfully zeroed
      if (results.success > 0) {
        const successIds = response.data.results.successIds || [];
        const newSelection = new Set(
          Array.from(selectedItems).filter(
            item => !successIds.includes(item)
          )
        );
        setSelectedItems(newSelection);
      }

      // Step 6: Show detailed results
      if (results.failed > 0) {
        showNotification({
          type: 'warning',
          title: 'Partial Success',
          message: `Zeroed out ${results.success} items. ${results.failed} items failed. Please retry the failed items.`,
        });
      } else {
        showNotification({
          type: 'success',
          title: 'Complete',
          message: `Successfully zeroed out ${results.success} items`,
        });
      }

      // Reload only the modified items
      await loadInventory();
    }
  } catch (error: any) {
    showNotification({
      type: 'error',
      title: 'Bulk Operation Failed',
      message: `${error.response?.data?.error || 'Operation failed'}. ${selectedItems.size - results.success} items remain selected for retry.`,
    });
  } finally {
    setBulkOperating(false);
  }
}, [selectedItems, products, locationMap, vendor?.id, loadInventory]);
```

---

## ISSUE #8: Hardcoded Stats (Lines 121-124)

### Current (BROKEN):
```typescript
// app/api/vendor/products/full/route.ts - Lines 121-124
const inStock = 0; // Hardcoded! ❌
const lowStock = 0;
const outOfStock = 0;
```

### Fixed:
```typescript
// Calculate stats from inventory data
const inStock = (products || []).filter((p) => {
  const qty = inventoryMap.get(p.id) || 0;
  return qty > 10;
}).length;

const lowStock = (products || []).filter((p) => {
  const qty = inventoryMap.get(p.id) || 0;
  return qty > 0 && qty <= 10;
}).length;

const outOfStock = (products || []).filter((p) => {
  const qty = inventoryMap.get(p.id) || 0;
  return qty === 0;
}).length;
```

---

## Testing These Fixes

```typescript
// Unit test for floating point fix
import { Decimal } from 'decimal.js';

test('inventory total should be accurate with decimal quantities', () => {
  const inventory = [
    { quantity: '1.1' },
    { quantity: '2.2' },
    { quantity: '3.3' },
  ];

  // OLD WAY (broken)
  const total_broken = inventory.reduce(
    (sum, inv) => sum + parseFloat(inv.quantity),
    0
  );
  expect(total_broken).not.toBe(6.6); // Fails: 6.600000000000001

  // NEW WAY (fixed)
  const total_fixed = inventory.reduce(
    (sum, inv) => sum.plus(new Decimal(inv.quantity)),
    new Decimal(0)
  ).toNumber();
  expect(total_fixed).toBe(6.6); // Passes ✓
});
```

