# 📦 Inventory Unit Conversion System

## Problem Statement

**Customer buys:** "1 lb" of Blue Dream  
**System must:** Deduct 453.6 grams from inventory  
**Next customer sees:** Updated quantity in their preferred unit  

---

## Solution Architecture

### 1. Database Storage (Base Unit: GRAMS)

```sql
-- All inventory is ALWAYS stored in grams
products:
  - stock_quantity: DECIMAL(10,2) -- in GRAMS

inventory_items:
  - quantity: DECIMAL(10,2) -- in GRAMS
  - location_id: UUID
  
-- Example:
Product "Blue Dream"
├─ stock_quantity: 10000.0 (grams in database)
├─ Display to retail: "10,000g" or "357 oz"
└─ Display to wholesale: "22 lbs"
```

### 2. Pricing Blueprint (Display Configuration)

```json
{
  "break_id": "1_lb",
  "label": "1 Pound",
  "qty": 453.6,           // ← STORED IN GRAMS (conversion done here)
  "display": "1 lb",      // ← SHOWN TO CUSTOMER
  "display_qty": 1,
  "display_unit": "lb"
}
```

**Key Point:** The `qty` field is ALWAYS in grams, even for pound-based blueprints.

### 3. Add to Cart Flow

```typescript
// Customer clicks "Buy 1 lb"
const pricingTier = {
  break_id: "1_lb",
  qty: 453.6,        // grams (from database)
  display: "1 lb",   // display label
  price: 3200        // $3,200 for 1 lb
};

// Add to cart
addToCart({
  productId: "blue-dream-uuid",
  name: "Blue Dream",
  quantity_grams: 453.6,        // ← ALWAYS STORE IN GRAMS
  quantity_display: "1 lb",     // ← FOR DISPLAY ONLY
  price: 3200,
  tierName: "1 Pound Wholesale"
});
```

### 4. Order Processing & Inventory Deduction

```typescript
// When order is placed
async function processOrder(orderItems) {
  for (const item of orderItems) {
    // Item structure:
    // {
    //   productId: "uuid",
    //   quantity_grams: 453.6,  // ← KEY: Always in grams
    //   quantity_display: "1 lb"
    // }
    
    // Deduct from inventory (in grams)
    await deductInventory(item.productId, item.quantity_grams);
  }
}

async function deductInventory(productId: string, quantityInGrams: number) {
  // Update product stock (stored in grams)
  const { data, error } = await supabase
    .from('products')
    .update({ 
      stock_quantity: sql`stock_quantity - ${quantityInGrams}` 
    })
    .eq('id', productId)
    .select('stock_quantity')
    .single();
    
  // Also update inventory_items table if using multi-location
  await supabase
    .from('inventory_items')
    .update({
      quantity: sql`quantity - ${quantityInGrams}`
    })
    .eq('product_id', productId)
    .eq('location_id', selectedLocationId);
    
  console.log(`Deducted ${quantityInGrams}g from inventory`);
  console.log(`New stock: ${data.stock_quantity}g`);
}
```

### 5. Display to Next Customer

```typescript
// Fetch current stock
const product = await getProduct("blue-dream-uuid");
// product.stock_quantity = 9546.4 (grams)

// Display based on customer context
if (customerContext === 'retail') {
  // Show in grams
  display(`${product.stock_quantity}g available`);
  // "9,546g available"
  
} else if (customerContext === 'wholesale') {
  // Convert to pounds for display
  const pounds = product.stock_quantity / 453.592;
  display(`${pounds.toFixed(1)} lbs available`);
  // "21.0 lbs available"
}
```

---

## Complete Transaction Example

### Scenario: Wholesale Customer Buys 1 Pound

```
BEFORE TRANSACTION:
├─ Database: stock_quantity = 10000 grams
├─ Retail view: "10,000g (357 oz)"
└─ Wholesale view: "22 lbs"

CUSTOMER ACTION:
├─ Views product in wholesale marketplace
├─ Sees pricing: "1 lb - $3,200"
├─ Clicks "Add to Cart"
└─ Cart receives: { qty_grams: 453.6, display: "1 lb", price: 3200 }

CHECKOUT & PAYMENT:
├─ Order created with line items
├─ Each line item has:
│   - product_id
│   - quantity_grams: 453.6
│   - quantity_display: "1 lb"
│   - price: 3200
└─ Payment processed

INVENTORY DEDUCTION:
UPDATE products 
SET stock_quantity = stock_quantity - 453.6
WHERE id = 'blue-dream-uuid';

AFTER TRANSACTION:
├─ Database: stock_quantity = 9546.4 grams
├─ Retail view: "9,546g (341 oz)"
└─ Wholesale view: "21.0 lbs"
```

---

## Multi-Location Inventory

If using location-based inventory:

```typescript
// When customer selects pickup/delivery location
const availableLocations = await getLocationsWithStock(productId, 453.6);
// Returns only locations with >= 453.6 grams available

// Customer selects Charlotte location
const location = "charlotte-uuid";

// Check stock at that location
const { data: inventoryItem } = await supabase
  .from('inventory_items')
  .select('quantity')
  .eq('product_id', productId)
  .eq('location_id', location)
  .single();

// inventoryItem.quantity = 5000 (grams at Charlotte location)

// After purchase, deduct from that specific location
await supabase
  .from('inventory_items')
  .update({
    quantity: inventoryItem.quantity - 453.6  // 5000 - 453.6 = 4546.4
  })
  .eq('product_id', productId)
  .eq('location_id', location);
```

---

## Cart Context Example

```typescript
interface CartItem {
  productId: string;
  name: string;
  quantity_grams: number;      // ← ALWAYS IN GRAMS (for inventory)
  quantity_display: string;    // ← FOR UI DISPLAY ONLY
  price_per_unit: number;
  total_price: number;
  tierName: string;            // e.g., "1 Pound Wholesale"
  context: 'retail' | 'wholesale';
}

// Example cart items:
const cart = [
  {
    productId: "blue-dream",
    name: "Blue Dream",
    quantity_grams: 3.5,         // Retail: eighth
    quantity_display: "3.5g (⅛ oz)",
    price_per_unit: 50,
    total_price: 50,
    tierName: "Eighth",
    context: "retail"
  },
  {
    productId: "gelato-33",
    name: "Gelato #33",
    quantity_grams: 453.6,       // Wholesale: 1 pound
    quantity_display: "1 lb",
    price_per_unit: 3200,
    total_price: 3200,
    tierName: "1 Pound Wholesale",
    context: "wholesale"
  }
];

// When processing order
cart.forEach(item => {
  // Deduct quantity_grams from inventory
  deductInventory(item.productId, item.quantity_grams);
  
  // Display shows quantity_display to user
  console.log(`Purchased: ${item.quantity_display} of ${item.name}`);
});
```

---

## Pricing Blueprint Structure (Detailed)

```json
// RETAIL BLUEPRINT (Gram-based display, gram storage)
{
  "name": "Retail Cannabis Flower",
  "context": "retail",
  "display_unit": "gram",
  "price_breaks": [
    {
      "break_id": "1g",
      "label": "1 gram",
      "qty": 1.0,              // ← Stored in grams
      "display": "1g",
      "display_qty": 1.0,
      "display_unit": "g"
    },
    {
      "break_id": "3_5g",
      "label": "Eighth",
      "qty": 3.5,              // ← Stored in grams
      "display": "3.5g (⅛ oz)",
      "display_qty": 3.5,
      "display_unit": "g"
    },
    {
      "break_id": "28g",
      "label": "Ounce",
      "qty": 28.0,             // ← Stored in grams
      "display": "28g (1 oz)",
      "display_qty": 28.0,
      "display_unit": "g"
    }
  ]
}

// WHOLESALE BLUEPRINT (Pound display, GRAM storage)
{
  "name": "Wholesale Cannabis Flower",
  "context": "wholesale",
  "display_unit": "pound",
  "price_breaks": [
    {
      "break_id": "quarter_lb",
      "label": "Quarter Pound",
      "qty": 113.4,            // ← STORED IN GRAMS (¼ lb = 113.4g)
      "display": "¼ lb",       // ← DISPLAYED AS POUNDS
      "display_qty": 0.25,
      "display_unit": "lb"
    },
    {
      "break_id": "1_lb",
      "label": "1 Pound",
      "qty": 453.6,            // ← STORED IN GRAMS (1 lb = 453.6g)
      "display": "1 lb",       // ← DISPLAYED AS POUNDS
      "display_qty": 1.0,
      "display_unit": "lb"
    },
    {
      "break_id": "10_lb",
      "label": "10 Pounds",
      "qty": 4536.0,           // ← STORED IN GRAMS (10 lb = 4536g)
      "display": "10 lbs",     // ← DISPLAYED AS POUNDS
      "display_qty": 10.0,
      "display_unit": "lb"
    }
  ]
}
```

**Key Insight:** The `qty` field is ALWAYS in grams. The `display` and `display_unit` are just for presentation.

---

## API Implementation

### Product API (Wholesale)

```typescript
// app/api/wholesale/products/route.ts

export async function GET(request: NextRequest) {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_wholesale', true);
  
  // Transform for wholesale display
  const transformedProducts = products.map(product => ({
    ...product,
    stock_quantity_grams: product.stock_quantity,  // Original (grams)
    stock_quantity_display: convertToDisplayUnit(
      product.stock_quantity, 
      'pound'
    ),  // Converted for display
    available_tiers: product.wholesale_pricing.map(tier => ({
      ...tier,
      quantity_grams: tier.minimum_quantity,  // Always in grams
      quantity_display: `${(tier.minimum_quantity / 453.592).toFixed(1)} lbs`
    }))
  }));
  
  return NextResponse.json({ products: transformedProducts });
}

function convertToDisplayUnit(grams: number, unit: 'pound' | 'ounce'): string {
  switch(unit) {
    case 'pound':
      return `${(grams / 453.592).toFixed(1)} lbs`;
    case 'ounce':
      return `${(grams / 28.3495).toFixed(1)} oz`;
    default:
      return `${grams.toFixed(1)}g`;
  }
}
```

### Order API (Inventory Deduction)

```typescript
// app/api/orders/route.ts

export async function POST(request: NextRequest) {
  const { line_items } = await request.json();
  
  // Process each line item
  for (const item of line_items) {
    // Validate stock (in grams)
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single();
    
    if (product.stock_quantity < item.quantity_grams) {
      throw new Error(`Insufficient stock for ${item.name}`);
    }
    
    // Deduct from inventory (in grams)
    await supabase
      .from('products')
      .update({
        stock_quantity: product.stock_quantity - item.quantity_grams
      })
      .eq('id', item.product_id);
    
    console.log(
      `✅ Deducted ${item.quantity_grams}g (${item.quantity_display}) ` +
      `from ${item.name}. New stock: ${product.stock_quantity - item.quantity_grams}g`
    );
  }
  
  // Create order record
  const { data: order } = await supabase
    .from('orders')
    .insert({
      line_items: line_items.map(item => ({
        product_id: item.product_id,
        name: item.name,
        quantity_grams: item.quantity_grams,      // For inventory tracking
        quantity_display: item.quantity_display,  // For receipt display
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
    })
    .select()
    .single();
  
  return NextResponse.json({ success: true, order });
}
```

---

## Stock Availability Check

```typescript
// Check if product has enough stock for purchase
function checkStockAvailability(
  productStockInGrams: number,
  requestedQuantity: { display: string, grams: number }
): boolean {
  return productStockInGrams >= requestedQuantity.grams;
}

// Example:
const product = {
  stock_quantity: 500 // grams in database
};

const customerWants = {
  display: "1 lb",
  grams: 453.6
};

if (!checkStockAvailability(product.stock_quantity, customerWants)) {
  showError(`Only ${convertToDisplayUnit(product.stock_quantity, 'pound')} available`);
  // "Only 1.1 lbs available"
}
```

---

## Summary

### ✅ **Core Principle:**

```
STORAGE:  Always in grams (single source of truth)
DISPLAY:  Context-appropriate (grams for retail, pounds for wholesale)
TRANSACTIONS: Convert display → grams → deduct from inventory
```

### ✅ **Data Flow:**

```
1. Pricing Blueprint defines:
   - qty: 453.6 (grams) ← WHAT GETS DEDUCTED
   - display: "1 lb"    ← WHAT CUSTOMER SEES

2. Customer adds to cart:
   - Stores: quantity_grams = 453.6
   - Shows: "1 lb"

3. Order processed:
   - Deducts: 453.6 grams from inventory
   - Receipt shows: "1 lb"

4. Inventory updates:
   - Database: stock_quantity -= 453.6
   - Next customer sees updated amount in their preferred unit
```

### ✅ **No Conversion Needed at Transaction Time:**

The conversion is **pre-calculated** in the pricing blueprint. When a customer selects "1 lb", the system already knows that equals 453.6 grams.

---

**Next Step:** Run the migration and I can help you implement the cart/order processing with proper gram-based inventory deduction! 🚀


