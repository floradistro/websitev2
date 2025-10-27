# POS API Reference

**Last Updated:** October 27, 2025  
**Base URL:** `/api/pos`

---

## 🔐 **Authentication**

All POS endpoints require:
- Valid Supabase session
- User with `pos_staff`, `location_manager`, `vendor_manager`, or `vendor_owner` role
- Location access permission (`user_locations.can_sell = true`)

**Test Mode:** Test routes (`/pos-test`, `/pos-register-test`) bypass auth using service role.

---

## 📦 **Sessions**

### **GET /api/pos/sessions/active**

Get the currently active session for a location.

**Query Parameters:**
- `locationId` (required) - UUID of the location

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "session_number": "POS-CHA-20251027-001",
    "status": "open",
    "opening_cash": 200.00,
    "total_sales": 450.00,
    "total_transactions": 15,
    "total_cash": 325.00,
    "total_card": 125.00,
    "walk_in_sales": 10,
    "pickup_orders_fulfilled": 5,
    "opened_at": "2025-10-27T09:00:00Z",
    "last_transaction_at": "2025-10-27T14:30:00Z"
  }
}
```

**If no session:** `{ "session": null }`

---

### **POST /api/pos/sessions/open**

Open a new POS session for a location.

**Request Body:**
```json
{
  "locationId": "uuid",
  "userId": "uuid",           // Optional - auto-selects if not provided
  "openingCash": 200.00,
  "vendorId": "uuid"          // Optional - auto-detected
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "session_number": "POS-CHA-20251027-002",
    "status": "open",
    "opening_cash": 200.00,
    "opened_at": "2025-10-27T17:00:00Z"
  },
  "message": "Session POS-CHA-20251027-002 opened successfully"
}
```

**Errors:**
- `409` - Session already open
- `404` - Location not found
- `400` - No valid user found

---

### **POST /api/pos/sessions/close**

Close an active POS session.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "closingCash": 525.00,
  "closingNotes": "All sales processed smoothly"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "session_number": "POS-CHA-20251027-001",
    "total_sales": 450.00,
    "total_transactions": 15,
    "walk_in_sales": 10,
    "pickup_orders_fulfilled": 5,
    "opening_cash": 200.00,
    "closing_cash": 525.00,
    "expected_cash": 525.00,
    "cash_difference": 0.00,
    "status": "balanced"         // "balanced" | "over" | "short"
  },
  "message": "Session POS-CHA-20251027-001 closed successfully"
}
```

---

## 🛒 **Sales**

### **POST /api/pos/sales/create**

Create a walk-in sale (in-store customer).

**Request Body:**
```json
{
  "locationId": "uuid",
  "vendorId": "uuid",
  "sessionId": "uuid",        // Optional
  "userId": "uuid",           // Optional - staff member
  "items": [
    {
      "productId": "uuid",
      "productName": "Blue Dream",
      "unitPrice": 35.00,
      "quantity": 2,
      "lineTotal": 70.00,
      "inventoryId": "uuid"
    }
  ],
  "subtotal": 70.00,
  "taxAmount": 5.60,
  "total": 75.60,
  "paymentMethod": "cash",    // "cash" | "card"
  "cashTendered": 100.00,     // For cash payments
  "changeGiven": 24.40,       // For cash payments
  "customerId": "uuid",       // Optional
  "customerName": "Walk-In"   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "order_number": "POS-CHA-20251027-0042",
    "total_amount": 75.60,
    "fulfillment_status": "fulfilled",
    "payment_status": "paid"
  },
  "transaction": {
    "id": "uuid",
    "transaction_number": "TXN-POS-CHA-20251027-0042-1698765432",
    "transaction_type": "walk_in_sale",
    "total_amount": 75.60
  },
  "message": "Sale completed: POS-CHA-20251027-0042"
}
```

**Side Effects:**
- Creates order in `orders` table
- Creates order items in `order_items` table
- Creates POS transaction in `pos_transactions` table
- **Deducts inventory** for each item
- **Updates session totals** (if sessionId provided)

---

### **POST /api/pos/sales/fulfill**

Fulfill an online pickup order.

**Request Body:**
```json
{
  "orderId": "uuid",
  "locationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "transaction_number": "TXN-WEB-CLT-001-1698765432",
    "transaction_type": "pickup_fulfillment",
    "payment_method": "prepaid_online",
    "total_amount": 125.00
  },
  "message": "Order WEB-CLT-001 fulfilled successfully"
}
```

**Side Effects:**
- Updates order to `fulfillment_status='fulfilled'`
- Creates POS transaction
- **Deducts inventory** via database trigger
- **Updates session totals** (if session active)

---

## 📦 **Orders**

### **GET /api/pos/orders/pickup**

Get all pickup orders awaiting fulfillment for a location.

**Query Parameters:**
- `locationId` (required) - UUID of the location

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "WEB-CLT-001",
      "customer_id": "uuid",
      "customers": {
        "first_name": "Sarah",
        "last_name": "Johnson",
        "phone": "(704) 555-1234",
        "email": "sarah@example.com"
      },
      "order_items": [
        {
          "id": "uuid",
          "product_name": "Blue Dream 3.5g",
          "quantity": 1,
          "unit_price": 35.00,
          "line_total": 35.00
        }
      ],
      "total_amount": 125.00,
      "subtotal": 120.00,
      "tax_amount": 5.00,
      "payment_status": "paid",
      "payment_method": "authorize_net",
      "created_at": "2025-10-27T14:30:00Z",
      "metadata": { "online_order": true }
    }
  ]
}
```

**Filters:**
- Only shows orders where `pickup_location_id = locationId`
- Only shows `delivery_type = 'pickup'`
- Only shows `fulfillment_status IN ('unfulfilled', 'partial')`
- Ordered by `created_at DESC`

---

## 📊 **Inventory**

### **GET /api/pos/inventory**

Get all available inventory for a location with product details.

**Query Parameters:**
- `locationId` (required) - UUID of the location

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Blue Dream",
      "price": 35.00,
      "image_url": "https://...",
      "category": null,
      "inventory_quantity": 28.00,
      "inventory_id": "uuid"
    }
  ]
}
```

**Filters:**
- Only products with `quantity > 0` at location
- Uses `available_quantity` (quantity - reserved_quantity)
- Sorted alphabetically by product name

---

## 🔔 **Real-Time Events**

### **Supabase Realtime Subscriptions**

POS components can subscribe to real-time database changes:

**Example: Pickup Orders**
```typescript
supabase
  .channel('pickup-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `pickup_location_id=eq.${locationId}`
  }, (payload) => {
    // New pickup order received!
    showNotification('New pickup order');
    playSound();
    addToQueue(payload.new);
  })
  .subscribe();
```

**Events:**
- `INSERT` on `orders` table → New pickup order
- `UPDATE` on `orders` table → Order status changed
- `UPDATE` on `inventory` table → Stock levels changed
- `INSERT` on `pos_transactions` table → New sale completed

---

## 📝 **Data Models**

### **POS Session**
```typescript
interface POSSession {
  id: string;
  location_id: string;
  vendor_id: string;
  user_id: string;
  session_number: string;          // "POS-CHA-20251027-001"
  status: 'open' | 'closed' | 'suspended';
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;  // Over/short
  total_sales: number;
  total_transactions: number;
  total_cash: number;
  total_card: number;
  walk_in_sales: number;
  pickup_orders_fulfilled: number;
  opened_at: string;
  closed_at: string | null;
}
```

### **POS Transaction**
```typescript
interface POSTransaction {
  id: string;
  transaction_number: string;
  location_id: string;
  vendor_id: string;
  session_id: string | null;
  order_id: string | null;
  user_id: string | null;
  transaction_type: 'walk_in_sale' | 'pickup_fulfillment' | 'refund' | 'void';
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'refunded' | 'voided';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  cash_tendered: number | null;
  change_given: number | null;
  metadata: Record<string, any>;
  created_at: string;
}
```

### **Cart Item**
```typescript
interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inventoryId: string;
}
```

---

## ⚠️ **Error Handling**

### **Common Error Codes:**
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (no valid session)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (order/session/location not found)
- `409` - Conflict (session already open)
- `500` - Internal Server Error (database/server error)

### **Error Response Format:**
```json
{
  "error": "Human-readable error message",
  "details": "Technical details (dev mode only)"
}
```

---

## 🧪 **Testing**

### **Test Data Creation:**

```sql
-- Create test pickup order
INSERT INTO orders (
  order_number, customer_id, vendor_id,
  delivery_type, pickup_location_id,
  payment_status, fulfillment_status,
  subtotal, tax_amount, total_amount,
  billing_address
) VALUES (
  'TEST-CLT-001',
  '27f2dd67-4f80-4d99-8dcf-f2e6d2b694cb',
  'cd2e1122-d511-4edb-be5d-98ef274b4baf',
  'pickup',
  'c4eedafb-4050-4d2d-a6af-e164aad5d934',
  'paid', 'unfulfilled',
  100.00, 8.00, 108.00,
  '{"firstName":"Test","lastName":"Customer"}'::jsonb
);

-- Add order items
INSERT INTO order_items (
  order_id, product_id, product_name,
  unit_price, quantity, line_total, vendor_id
) VALUES (
  '[order_id]', '[product_id]', 'Product Name',
  10.00, 2, 20.00, '[vendor_id]'
);
```

### **Test Endpoints:**

```bash
# Test active session
curl "http://localhost:3000/api/pos/sessions/active?locationId=c4eedafb-4050-4d2d-a6af-e164aad5d934"

# Test pickup orders
curl "http://localhost:3000/api/pos/orders/pickup?locationId=c4eedafb-4050-4d2d-a6af-e164aad5d934"

# Test inventory
curl "http://localhost:3000/api/pos/inventory?locationId=c4eedafb-4050-4d2d-a6af-e164aad5d934"
```

---

## 🔧 **Database Side Effects**

### **Inventory Deduction (Automatic)**

When orders are fulfilled or walk-in sales created:

1. **Order status updated** → `fulfillment_status = 'fulfilled'`
2. **Inventory deducted** → `quantity = quantity - item.quantity`
3. **Stock movement logged** → Audit trail created
4. **Session totals updated** → Real-time session stats

**Trigger:** `deduct_inventory_on_pickup_fulfillment()` fires on order UPDATE.

### **Session Totals Update (Automatic)**

When POS transactions are created:

1. **Total sales** incremented
2. **Transaction count** incremented
3. **Walk-in/pickup counts** updated
4. **Cash/card totals** updated
5. **Last transaction time** updated

**Trigger:** `update_session_totals()` fires on pos_transactions INSERT/UPDATE.

---

## 📊 **Reports & Analytics**

### **Session Summary:**

```sql
SELECT * FROM pos_session_summary
WHERE location_id = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'
ORDER BY opened_at DESC
LIMIT 10;
```

**Returns:**
- Session details
- Sales totals
- Transaction breakdown
- Average transaction value
- Session duration
- Cash over/short

### **Active Sessions:**

```sql
SELECT * FROM active_pos_sessions
ORDER BY opened_at DESC;
```

**Returns:**
- All currently open sessions
- Location and staff info
- Hours open
- Current totals

---

## 🔗 **Related Documentation**

- [POS Implementation Status](POS_IMPLEMENTATION_STATUS.md)
- [POS System Architecture](POS_SYSTEM.md)
- [POS Order Flows](POS_ORDER_FLOWS.md)

---

**Built with:** Next.js API Routes + Supabase + TypeScript

