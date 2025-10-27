# POS Order Flow Diagrams

Visual representation of order flows across WhaleTools contexts.

---

## 🔄 **Flow 1: Online Pickup Order → POS Fulfillment**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER (STOREFRONT)                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Browse products
                            │ 2. Add to cart
                            │ 3. Select "Pickup at Charlotte Central"
                            │ 4. Complete payment (Authorize.net)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (ORDER CREATED)                     │
│                                                                  │
│  orders:                                                        │
│    order_number: 'WEB-CLT-001'                                  │
│    delivery_type: 'pickup'                                      │
│    pickup_location_id: 'charlotte-central-id'                   │
│    payment_status: 'paid'                                       │
│    fulfillment_status: 'unfulfilled'                            │
│    metadata: { online_order: true }                             │
│                                                                  │
│  inventory (Charlotte Central):                                 │
│    quantity: 100 → 100 (unchanged)                             │
│    reserved_quantity: 0 → 3 (RESERVED)                         │
│    available_quantity: 100 → 97 (UPDATED)                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Real-time notification via Supabase Realtime
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              POS SYSTEM (CHARLOTTE CENTRAL)                     │
│                                                                  │
│  [POSPickupQueue Component]                                     │
│  ────────────────────────────────────────────────────────────  │
│  🔔 NEW ORDER RECEIVED                                          │
│                                                                  │
│  Order #WEB-CLT-001                                             │
│  Customer: Sarah Johnson                                        │
│  Phone: (704) 555-1234                                          │
│  Items: 3 items | Total: $125.00                               │
│  Payment: PREPAID ✅                                            │
│                                                                  │
│  • Blue Dream 3.5g (1x)                                         │
│  • Sour Diesel 7g (1x)                                          │
│  • OG Kush 3.5g (1x)                                            │
│                                                                  │
│  [FULFILL ORDER] ← Staff clicks when customer arrives          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 5. Customer arrives
                            │ 6. Staff verifies ID
                            │ 7. Staff clicks "Fulfill Order"
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (ORDER FULFILLED)                   │
│                                                                  │
│  orders:                                                        │
│    fulfillment_status: 'unfulfilled' → 'fulfilled'             │
│    fulfilled_at: NOW()                                          │
│                                                                  │
│  pos_transactions:                                              │
│    transaction_type: 'pickup_fulfillment'                       │
│    payment_method: 'prepaid_online'                             │
│    order_id: [order.id]                                         │
│                                                                  │
│  inventory (Charlotte Central):                                 │
│    quantity: 100 → 97 (DEDUCTED)                               │
│    reserved_quantity: 3 → 0 (RELEASED)                         │
│    available_quantity: 97 → 97 (CORRECT)                       │
│                                                                  │
│  stock_movements:                                               │
│    movement_type: 'sale'                                        │
│    quantity: -3                                                 │
│    reason: 'Pickup order fulfilled at POS'                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 8. Receipt printed (optional)
                            │ 9. Customer receives products
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                CUSTOMER (EMAIL/SMS NOTIFICATION)                │
│                                                                  │
│  Your order #WEB-CLT-001 has been picked up!                    │
│  Thank you for shopping at Flora Distro.                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏪 **Flow 2: Walk-In Sale at POS**

```
┌─────────────────────────────────────────────────────────────────┐
│                 CUSTOMER (PHYSICAL STORE)                       │
│                                                                  │
│  Walks into Charlotte Central location                          │
│  Browses physical products                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Customer ready to purchase
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              STAFF (POS REGISTER)                               │
│                                                                  │
│  /pos/register?location=charlotte-central                       │
│                                                                  │
│  ┌──────────────────┬────────────────────────┐                 │
│  │ PRODUCT GRID     │ CART                   │                 │
│  │                  │                         │                 │
│  │ [Search: "blue"] │ Customer: Walk-In      │                 │
│  │                  │                         │                 │
│  │ Blue Dream 3.5g  │ Items:                 │                 │
│  │ $35 [ADD] ────────→ • Blue Dream 3.5g    │                 │
│  │                  │   $35.00               │                 │
│  │ Sour Diesel 7g   │                         │                 │
│  │ $60 [ADD] ────────→ • Sour Diesel 7g     │                 │
│  │                  │   $60.00               │                 │
│  └──────────────────┴────────────────────────┘                 │
│                                                                  │
│  2. Staff adds products to cart                                 │
│  3. Staff clicks "Charge $95.00"                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 4. Payment processing
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POS PAYMENT FLOW                               │
│                                                                  │
│  Total: $95.00                                                  │
│  Tax (8%): $7.60                                                │
│  ────────────────                                               │
│  TOTAL: $102.60                                                 │
│                                                                  │
│  [💵 CASH]  [💳 CARD]                                          │
│                                                                  │
│  Staff selects: CASH                                            │
│  Cash Tendered: $110.00                                         │
│  Change: $7.40                                                  │
│                                                                  │
│  [COMPLETE TRANSACTION]                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 5. Transaction completed
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (WALK-IN SALE CREATED)                    │
│                                                                  │
│  orders:                                                        │
│    order_number: 'POS-CLT-042'                                  │
│    delivery_type: 'pickup' (immediate)                          │
│    pickup_location_id: 'charlotte-central-id'                   │
│    payment_status: 'paid'                                       │
│    fulfillment_status: 'fulfilled' (immediate)                  │
│    metadata: { pos_sale: true, walk_in: true }                  │
│                                                                  │
│  pos_transactions:                                              │
│    transaction_type: 'walk_in_sale'                             │
│    payment_method: 'cash'                                       │
│    cash_tendered: 110.00                                        │
│    change_given: 7.40                                           │
│    session_id: [active_session.id]                              │
│                                                                  │
│  inventory (Charlotte Central):                                 │
│    quantity: 97 → 95 (DEDUCTED IMMEDIATELY)                    │
│    available_quantity: 97 → 95                                 │
│                                                                  │
│  stock_movements:                                               │
│    movement_type: 'sale'                                        │
│    quantity: -2                                                 │
│    reason: 'Walk-in POS sale'                                   │
│                                                                  │
│  pos_sessions:                                                  │
│    total_sales: +102.60                                         │
│    total_transactions: +1                                       │
│    total_cash: +102.60                                          │
│    walk_in_sales: +1                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 6. Receipt printed
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER (RECEIPT)                           │
│                                                                  │
│  FLORA DISTRO - CHARLOTTE CENTRAL                               │
│  Order #POS-CLT-042                                             │
│                                                                  │
│  Blue Dream 3.5g         $35.00                                 │
│  Sour Diesel 7g          $60.00                                 │
│                          ───────                                │
│  Subtotal                $95.00                                 │
│  Tax (8%)                 $7.60                                 │
│  TOTAL                  $102.60                                 │
│                                                                  │
│  Cash                   $110.00                                 │
│  Change                   $7.40                                 │
│                                                                  │
│  Thank you!                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 **Flow 3: Inventory Reservation & Sync**

```
┌─────────────────────────────────────────────────────────────────┐
│              INITIAL STATE (Before Any Orders)                  │
│                                                                  │
│  inventory (Charlotte Central - Blue Dream):                    │
│    quantity: 100 units                                          │
│    reserved_quantity: 0                                         │
│    available_quantity: 100                                      │
│                                                                  │
│  Storefront shows: "100 available"                              │
│  POS shows: "100 available"                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   Online Order 1      Online Order 2      Walk-In Sale
   (3 units)           (5 units)           (2 units)
   PICKUP              DELIVERY            IMMEDIATE
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ RESERVED     │    │ NOT RESERVED │    │ DEDUCTED     │
│              │    │ (delivery)   │    │ IMMEDIATELY  │
│ qty: 100     │    │              │    │              │
│ reserved: 3  │    │ qty: 100     │    │ qty: 98      │
│ available:97 │    │ (unchanged)  │    │ available:98 │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   
        │ Customer          │ Staff ships       
        │ picks up          │ from warehouse    
        │                   │                   
        ▼                   ▼                   
┌──────────────┐    ┌──────────────┐    
│ DEDUCTED     │    │ DEDUCTED     │    
│              │    │ (from        │    
│ qty: 97      │    │ warehouse)   │    
│ reserved: 0  │    │              │    
│ available:97 │    │ Charlotte    │    
└──────────────┘    │ unaffected   │    
                    └──────────────┘    
```

---

## 🌐 **Flow 4: Cross-Context Intelligence**

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOREFRONT CONTEXT                           │
│  Customer browses Blue Dream                                    │
│  Views product 5 times, doesn't buy                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI LEARNING                                │
│  Tracks: "Blue Dream: High views, low conversion online"       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     POS CONTEXT                                 │
│  Same customer walks into store                                 │
│  Staff recommends Blue Dream                                    │
│  Customer buys immediately                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI LEARNING                                │
│  Learns: "Blue Dream: Converts better in-person"               │
│  Reason: "Customers want to smell/see it first"                │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│  STOREFRONT OPTIMIZED   │  │  POS OPTIMIZED          │
│                         │  │                         │
│  Add badge:             │  │  Feature at top:        │
│  "👃 Visit store to     │  │  "🔥 Most requested     │
│   experience aroma"     │  │   by customers"         │
│                         │  │                         │
│  Show nearest location  │  │  Staff recommendation   │
│  with stock             │  │  prompt appears         │
└─────────────────────────┘  └─────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VENDOR DASHBOARD                                │
│                                                                  │
│  Insight: "Blue Dream performs 40% better in-store"            │
│  Recommendation: "Increase in-store inventory"                  │
│  Prediction: "Will sell out in 3 days at current rate"         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              PLATFORM COLLECTIVE INTELLIGENCE                   │
│                                                                  │
│  Shares learning with all cannabis vendors:                     │
│  "High-aroma strains convert better in-person"                  │
│                                                                  │
│  All vendors' storefronts & POS systems optimize                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Flow 5: Real-Time Sync Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                           │
│                                                                  │
│  orders table                                                   │
│  ├─ INSERT triggers: reserve_inventory_for_order()             │
│  └─ UPDATE triggers: fulfill_pickup_order()                     │
│                                                                  │
│  inventory table                                                │
│  ├─ quantity (physical count)                                   │
│  ├─ reserved_quantity (online orders pending pickup)            │
│  └─ available_quantity (calculated: qty - reserved)             │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  STOREFRONT  │    │     POS      │    │   VENDOR     │
│   Context    │    │   Context    │    │  Dashboard   │
│              │    │              │    │              │
│ Subscribes   │    │ Subscribes   │    │ Subscribes   │
│ to inventory │    │ to orders    │    │ to orders    │
│ changes      │    │ WHERE        │    │ WHERE        │
│              │    │ pickup_      │    │ vendor_id    │
│ Shows stock  │    │ location_id  │    │ = mine       │
│ in real-time │    │ = mine       │    │              │
│              │    │              │    │              │
│ Updates on:  │    │ Notified on: │    │ Updates on:  │
│ • Sale       │    │ • New order  │    │ • Any sale   │
│ • Restock    │    │ • Fulfillment│    │ • Trends     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE REALTIME                              │
│                                                                  │
│  WebSocket connections maintain live sync                       │
│  Changes propagate in <1 second                                 │
│  No polling required                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 **Flow 6: Session Management**

```
STAFF SHIFT START
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OPEN POS SESSION                               │
│                                                                  │
│  Staff logs in: john@floradistro.com                            │
│  Location: Charlotte Central                                    │
│  Opening Cash: $200.00                                          │
│                                                                  │
│  [START SESSION]                                                │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 POS SESSION ACTIVE                              │
│                                                                  │
│  pos_sessions:                                                  │
│    session_number: 'POS-CLT-20251026-001'                       │
│    status: 'open'                                               │
│    opening_cash: 200.00                                         │
│    total_sales: 0                                               │
│    total_transactions: 0                                        │
│    opened_at: 9:00 AM                                           │
└─────────────────────────────────────────────────────────────────┘
        │
        │ During shift: Process transactions
        │
        ├─ Walk-in Sale #1 ($125 cash)
        │  ├─ total_sales: +125
        │  ├─ total_cash: +125
        │  ├─ total_transactions: +1
        │  └─ walk_in_sales: +1
        │
        ├─ Pickup Fulfillment #1 ($85 prepaid)
        │  ├─ total_sales: +85
        │  ├─ total_transactions: +1
        │  └─ pickup_orders_fulfilled: +1
        │
        ├─ Walk-in Sale #2 ($200 card)
        │  ├─ total_sales: +200
        │  ├─ total_card: +200
        │  └─ total_transactions: +1
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   END OF SHIFT                                  │
│                                                                  │
│  Staff clicks: [END SESSION]                                    │
│                                                                  │
│  Session Summary:                                               │
│  ────────────────────────────────                               │
│  Total Sales: $410.00                                           │
│  Transactions: 3                                                │
│  Walk-In: 2 ($325)                                              │
│  Pickups: 1 ($85)                                               │
│                                                                  │
│  Cash Breakdown:                                                │
│  Opening Cash: $200.00                                          │
│  Cash Sales: $125.00                                            │
│  Expected: $325.00                                              │
│                                                                  │
│  Closing Cash Count: $_____  (Staff enters)                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│               CASH RECONCILIATION                               │
│                                                                  │
│  Staff enters: $327.00                                          │
│                                                                  │
│  Expected: $325.00                                              │
│  Actual:   $327.00                                              │
│  ─────────────────                                              │
│  Over:      $2.00 ✅                                            │
│                                                                  │
│  Notes: "Found $2 in tip jar, added to drawer"                 │
│                                                                  │
│  [CLOSE SESSION]                                                │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              SESSION CLOSED                                     │
│                                                                  │
│  pos_sessions:                                                  │
│    status: 'closed'                                             │
│    closing_cash: 327.00                                         │
│    expected_cash: 325.00                                        │
│    cash_difference: +2.00                                       │
│    closed_at: 5:00 PM                                           │
│                                                                  │
│  Report generated for vendor dashboard                          │
│  AI learns: "This location averages $410/shift"                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **KEY INTEGRATION POINTS**

### **1. Order Creation Points:**
- ✅ Online Storefront → USPS delivery
- ✅ Online Storefront → Pickup at location
- ✅ POS Register → Walk-in sale (immediate fulfillment)
- 🔄 Future: Mobile app, Kiosk, Phone order

### **2. Inventory Touch Points:**
- ✅ Online pickup order → RESERVE inventory
- ✅ POS fulfillment → DEDUCT from reserved & actual
- ✅ Walk-in sale → DEDUCT immediately
- ✅ Delivery order → DEDUCT from warehouse/fulfillment location

### **3. Payment Methods:**
- ✅ Online: Authorize.net (prepaid)
- ✅ POS: Cash (immediate)
- 🔄 POS: Card terminal (Clover/Square - Phase 2)
- 🔄 POS: Split payment (Phase 2)

### **4. Real-Time Sync:**
- ✅ Supabase Realtime for order notifications
- ✅ Database triggers for inventory updates
- ✅ Webhook option for external integrations
- ✅ Polling fallback for unstable connections

---

**All flows documented. All integration points mapped. Ready for implementation.**

