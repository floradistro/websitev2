# WhaleTools POS System Architecture

**The world's first component-based, AI-generated point-of-sale system integrated into a living commerce organism.**

---

## 🎯 **CORE VISION**

POS is **NOT** a separate system. It's another context in the unified WhaleTools organism.

```
WhaleTools Organism
├─ Storefront Context (customers browse online)
├─ POS Context (staff process in-store & pickup orders)  ← NEW
├─ Vendor Context (managers view analytics)
└─ Admin Context (platform monitors health)

ALL contexts:
- Share same database
- Use same component system
- Feed same AI learning
- Optimize together
```

---

## 📊 **DATABASE ARCHITECTURE**

### **Unified Schema (No Separate POS Tables)**

```sql
-- Existing tables expanded to handle POS context
page_sections (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  location_id UUID, -- NEW: POS is location-specific
  page_key TEXT, -- 'pos_register', 'pos_orders', 'pos_checkout'
  context_type TEXT CHECK (context_type IN ('storefront', 'pos', 'vendor', 'admin')),
  section_key TEXT,
  section_order INT,
  is_enabled BOOLEAN DEFAULT true
);

vendor_component_instances (
  id UUID PRIMARY KEY,
  section_id UUID,
  component_key TEXT, -- 'pos_product_grid', 'pos_cart', 'pos_order_queue'
  props JSONB,
  layout_config JSONB,
  position_order INT
);

-- POS-specific tables for session management
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL, -- Staff member
  
  -- Session info
  session_number TEXT UNIQUE NOT NULL, -- "POS-CLT-20251026-001"
  status TEXT CHECK (status IN ('open', 'closed', 'suspended')) DEFAULT 'open',
  
  -- Cash drawer
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2),
  expected_cash DECIMAL(10,2),
  cash_difference DECIMAL(10,2), -- Over/Short
  
  -- Session totals
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_cash DECIMAL(10,2) DEFAULT 0,
  total_card DECIMAL(10,2) DEFAULT 0,
  total_refunds DECIMAL(10,2) DEFAULT 0,
  
  -- Order types processed
  walk_in_sales INTEGER DEFAULT 0,
  pickup_orders_fulfilled INTEGER DEFAULT 0,
  
  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ,
  
  -- Metadata
  opening_notes TEXT,
  closing_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pos_sessions_location_idx ON pos_sessions(location_id);
CREATE INDEX pos_sessions_user_idx ON pos_sessions(user_id);
CREATE INDEX pos_sessions_status_idx ON pos_sessions(status);
CREATE INDEX pos_sessions_opened_at_idx ON pos_sessions(opened_at DESC);

-- POS transactions (links to orders table)
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES pos_sessions(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL, -- Staff who processed
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  
  -- Transaction info
  transaction_number TEXT UNIQUE NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN (
    'walk_in_sale',    -- Customer buys in-store
    'pickup_fulfillment', -- Online order picked up
    'refund',
    'void'
  )) DEFAULT 'walk_in_sale',
  
  -- Payment details (if processed at POS)
  payment_method TEXT, -- 'cash', 'card', 'split', 'prepaid_online'
  payment_details JSONB DEFAULT '{}',
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  cash_tendered DECIMAL(10,2),
  change_given DECIMAL(10,2),
  tip_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'voided')) DEFAULT 'completed',
  
  -- References
  parent_transaction_id UUID REFERENCES pos_transactions(id), -- For refunds
  authorization_code TEXT,
  receipt_number TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pos_transactions_session_idx ON pos_transactions(session_id);
CREATE INDEX pos_transactions_order_idx ON pos_transactions(order_id);
CREATE INDEX pos_transactions_location_idx ON pos_transactions(location_id);
CREATE INDEX pos_transactions_type_idx ON pos_transactions(transaction_type);
CREATE INDEX pos_transactions_created_at_idx ON pos_transactions(created_at DESC);

-- Existing orders table (already supports POS)
-- Just add comments to clarify usage
COMMENT ON COLUMN orders.delivery_type IS 'delivery (ship via USPS), pickup (customer collects), mixed (some items each)';
COMMENT ON COLUMN orders.pickup_location_id IS 'Location for pickup orders - POS displays orders for their location';
COMMENT ON COLUMN orders.metadata IS 'Contains pos_sale:true for walk-in sales, online_order:true for web orders';
```

---

## 🔄 **ORDER FLOW INTEGRATION**

### **Scenario 1: Online Order with Pickup**

```
Customer (Storefront):
  1. Browses /storefront?vendor=flora-distro
  2. Adds products to cart
  3. Proceeds to checkout
  4. Selects "Pickup at Charlotte Central"
  5. Completes payment online (Authorize.net)
  6. Order created with:
     - delivery_type: 'pickup'
     - pickup_location_id: charlotte-central-id
     - payment_status: 'paid'
     - fulfillment_status: 'unfulfilled'
     - metadata: { online_order: true, payment_method: 'authorize_net' }

Database:
  INSERT INTO orders (
    customer_id,
    vendor_id,
    order_number: 'WEB-CLT-20251026-001',
    delivery_type: 'pickup',
    pickup_location_id: 'charlotte-central-id',
    payment_status: 'paid',
    fulfillment_status: 'unfulfilled',
    total_amount: 125.00,
    metadata: { online_order: true }
  )

POS System (Charlotte Central):
  1. Real-time notification: New pickup order
  2. Order appears in "pos_pickup_queue" component
  3. Staff sees:
     - Customer name
     - Order items
     - Payment: PREPAID
     - Status: Ready for pickup
  
Customer Arrives:
  1. Staff searches customer name/order number
  2. Verifies ID (for cannabis)
  3. Hands over products
  4. Marks as "Fulfilled" in POS
  5. Updates order:
     - fulfillment_status: 'fulfilled'
     - fulfilled_at: NOW()
  6. Creates POS transaction:
     - transaction_type: 'pickup_fulfillment'
     - payment_method: 'prepaid_online'
  7. Receipt printed (optional)
```

### **Scenario 2: Online Order with USPS Delivery**

```
Customer (Storefront):
  1. Adds products to cart
  2. Selects "USPS Delivery"
  3. Enters shipping address
  4. Completes payment
  5. Order created with:
     - delivery_type: 'delivery'
     - pickup_location_id: NULL
     - shipping_address: {...}
     - fulfillment_status: 'unfulfilled'

Vendor Dashboard:
  1. Order appears in shipping queue
  2. Staff prints shipping label
  3. Packs order from warehouse
  4. Marks as shipped
  5. Updates:
     - fulfillment_status: 'fulfilled'
     - shipped_at: NOW()
     - tracking_number: '...'

POS System:
  - Does NOT show this order (pickup_location_id is NULL)
  - Inventory still deducted from vendor's stock
```

### **Scenario 3: Walk-In Sale at POS**

```
Customer (In-Store):
  1. Walks into Charlotte Central location
  2. Browses physical products

Staff (POS):
  1. Opens POS at /pos/register?location=charlotte-central
  2. Session already open or opens new session
  3. Scans/searches products via pos_product_grid
  4. Adds to pos_cart component
  5. Customer ready to pay
  6. Staff clicks "Charge $125.00"
  7. System creates:
     a. Order record:
        - order_number: 'POS-CLT-20251026-042'
        - delivery_type: 'pickup' (immediate)
        - pickup_location_id: charlotte-central-id
        - fulfillment_status: 'fulfilled' (immediate)
        - payment_status: 'pending'
        - metadata: { pos_sale: true, walk_in: true }
     
     b. Customer record (if new):
        - Quick create: first_name, phone, email
        - Or link to existing customer
     
     c. Payment processed:
        - Cash: staff enters tendered, system calculates change
        - Card: integrate with terminal (future)
     
     d. POS transaction:
        - transaction_type: 'walk_in_sale'
        - payment_method: 'cash' | 'card'
        - links to order_id
     
     e. Inventory deducted:
        - From charlotte-central location inventory
        - Stock movements tracked
     
     f. Receipt printed
  
  8. Order marked fulfilled immediately
  9. Session totals updated
```

### **Scenario 4: Mixed Order (Some Pickup, Some Delivery)**

```
Customer (Storefront):
  1. Adds 5 products to cart
  2. At checkout:
     - 3 items: "Pickup at Charlotte Central"
     - 2 items: "Deliver to my address"
  3. Order created with:
     - delivery_type: 'mixed'

Database:
  - Creates order with delivery_type: 'mixed'
  - order_items table tracks per-item:
    - order_type: 'pickup' | 'delivery'
    - pickup_location_id (if pickup)

POS System (Charlotte Central):
  - Shows only the 3 pickup items
  - Staff fulfills those items
  - Other 2 items go to shipping queue

Vendor Dashboard:
  - Shows full order
  - Pickup section: tracked via POS
  - Delivery section: tracked via shipping
```

---

## 🖥️ **POS USER INTERFACE**

### **Component Architecture**

```typescript
// POS Components (in component registry)
const POS_COMPONENTS = {
  // Session Management
  'pos_session_header': {
    props: {
      show_employee: true,
      show_cash_drawer: true,
      show_session_time: true,
      location_name: 'Charlotte Central'
    },
    fetches: ['active_session', 'employee_info']
  },
  
  // Product Selection
  'pos_product_grid': {
    props: {
      display_mode: 'cards' | 'list' | 'compact',
      show_inventory: true,
      show_pricing_tiers: true,
      location_id: 'auto', // Shows only this location's inventory
      category_filter: true,
      quick_search: true,
      barcode_scanner: false // Future
    },
    fetches: ['location_inventory', 'products', 'pricing_tiers']
  },
  
  // Shopping Cart
  'pos_cart': {
    props: {
      show_customer_info: true,
      show_weight_display: true, // For cannabis
      show_tier_pricing: true,
      allow_discounts: true,
      calculate_tax: true
    },
    state: 'local' // Cart state in browser
  },
  
  // Pickup Order Queue
  'pos_pickup_queue': {
    props: {
      location_id: 'auto',
      show_ready_orders: true,
      show_preparing_orders: false,
      auto_refresh_seconds: 30,
      notification_sound: true
    },
    fetches: ['pickup_orders_for_location']
  },
  
  // Customer Lookup
  'pos_customer_lookup': {
    props: {
      search_by: ['phone', 'email', 'name'],
      quick_create: true,
      show_order_history: true
    },
    fetches: ['customers']
  },
  
  // Payment Terminal
  'pos_payment': {
    props: {
      enabled_methods: ['cash', 'card'],
      processor: 'authorize_net', // Per location config
      show_tip_screen: false,
      receipt_options: ['print', 'email', 'sms', 'none']
    }
  },
  
  // Quick Actions
  'pos_quick_actions': {
    props: {
      actions: ['hold_transaction', 'retrieve_held', 'void_last', 'open_drawer']
    }
  }
};
```

### **POS Page Layouts**

#### **Layout 1: Register (Two-Column)**
```
/pos/register?location=charlotte-central

┌─────────────────────────────────────────────────────────────────┐
│ Charlotte Central | Staff: John D. | Session: POS-CLT-001       │
│ [END SESSION] [PICKUP ORDERS: 3]                                │
├─────────────────────────┬───────────────────────────────────────┤
│ PRODUCT SELECTION       │ CART                                  │
│                         │                                        │
│ [🔍 Search Products]    │ Customer: Walk-In                     │
│                         │ [Search Customer]                      │
│ Categories:             │                                        │
│ [All] [Flower] [Edibles]│ Items (3):                            │
│                         │ → Blue Dream 3.5g        $35.00       │
│ ┌──────┬──────┬──────┐  │ → Sour Diesel 7g         $60.00       │
│ │ Blue │ Sour │ OG   │  │ → Gummy Bears 10mg       $25.00       │
│ │Dream │Diesel│ Kush │  │                                        │
│ │$35/  │$60/  │$45/  │  │ Subtotal:                $120.00     │
│ │3.5g  │ 7g   │3.5g  │  │ Tax (8%):                  $9.60     │
│ │[ADD] │[ADD] │[ADD] │  │ ─────────────────────────────────     │
│ └──────┴──────┴──────┘  │ TOTAL:                   $129.60     │
│                         │                                        │
│ [More products...]      │ [💵 CASH] [💳 CARD]                   │
│                         │ [🎁 DISCOUNT] [❌ VOID]                │
│                         │ [⏸️ HOLD] [🔄 RETRIEVE]                │
└─────────────────────────┴───────────────────────────────────────┘
```

#### **Layout 2: Pickup Orders**
```
/pos/orders/pickup?location=charlotte-central

┌─────────────────────────────────────────────────────────────────┐
│ Pickup Orders - Charlotte Central                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Ready for Pickup (3)                                            │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Order #WEB-CLT-20251026-001                                │ │
│ │ Customer: Sarah Johnson                                    │ │
│ │ Phone: (704) 555-1234                                      │ │
│ │ Items: 3 items | Total: $125.00                           │ │
│ │ Payment: PREPAID (Authorize.net)                           │ │
│ │ Ordered: 2:35 PM (15 minutes ago)                         │ │
│ │                                                             │ │
│ │ • Blue Dream 3.5g (1x)                                     │ │
│ │ • Sour Diesel 7g (1x)                                      │ │
│ │ • OG Kush 3.5g (1x)                                        │ │
│ │                                                             │ │
│ │ [FULFILL ORDER] [VIEW DETAILS] [CONTACT CUSTOMER]          │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Order #WEB-CLT-20251026-002                                │ │
│ │ Customer: Mike Davis                                       │ │
│ │ Phone: (704) 555-5678                                      │ │
│ │ Items: 2 items | Total: $85.00                            │ │
│ │ Payment: PREPAID (Credit Card)                             │ │
│ │ Ordered: 1:15 PM (1 hour 35 minutes ago)                  │ │
│ │                                                             │ │
│ │ [FULFILL ORDER] [VIEW DETAILS] [CONTACT CUSTOMER]          │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Preparing (0) | Fulfilled Today (12) | [VIEW HISTORY]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔔 **REAL-TIME SYNC**

### **Online → POS (Instant Notification)**

```typescript
// When customer places pickup order online:
// app/api/payment/route.ts (existing file, enhanced)

export async function POST(request: NextRequest) {
  // ... existing payment processing ...
  
  // After order created:
  if (order.delivery_type === 'pickup' && order.pickup_location_id) {
    // Send real-time notification to POS
    await sendPOSNotification({
      location_id: order.pickup_location_id,
      type: 'new_pickup_order',
      order_id: order.id,
      customer_name: `${billing.firstName} ${billing.lastName}`,
      items_count: items.length,
      total: order.total_amount,
      message: 'New pickup order received'
    });
  }
  
  return NextResponse.json({ success: true, order });
}

// Real-time notification system
async function sendPOSNotification(notification: POSNotification) {
  // Option 1: WebSocket (real-time)
  await broadcastToLocation(notification.location_id, {
    type: 'NEW_PICKUP_ORDER',
    payload: notification
  });
  
  // Option 2: Database polling (simple, no infrastructure)
  await supabase.from('pos_notifications').insert({
    location_id: notification.location_id,
    type: notification.type,
    data: notification,
    is_read: false,
    created_at: new Date()
  });
  
  // Option 3: Supabase Realtime (best of both worlds)
  // POS subscribes to changes on orders table filtered by location
}
```

### **POS Implementation (Real-Time Listening)**

```typescript
// components/component-registry/pos/POSPickupQueue.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function POSPickupQueue({ locationId }: { locationId: string }) {
  const [pickupOrders, setPickupOrders] = useState([]);
  
  useEffect(() => {
    // Load initial orders
    loadPickupOrders();
    
    // Subscribe to real-time updates (Supabase Realtime)
    const channel = supabase
      .channel('pickup-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `pickup_location_id=eq.${locationId}`
        },
        (payload) => {
          // New pickup order created
          showNotification('New pickup order received!');
          playNotificationSound();
          addOrderToQueue(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `pickup_location_id=eq.${locationId}`
        },
        (payload) => {
          // Order updated (e.g., customer modified)
          updateOrderInQueue(payload.new);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);
  
  async function loadPickupOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        customers(*)
      `)
      .eq('pickup_location_id', locationId)
      .eq('delivery_type', 'pickup')
      .in('fulfillment_status', ['unfulfilled', 'partial'])
      .order('created_at', { ascending: false });
    
    setPickupOrders(data || []);
  }
  
  async function fulfillOrder(orderId: string) {
    // Mark order as fulfilled
    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    // Create POS transaction
    await fetch('/api/pos/transactions', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        transaction_type: 'pickup_fulfillment',
        payment_method: 'prepaid_online'
      })
    });
    
    // Remove from queue
    setPickupOrders(prev => prev.filter(o => o.id !== orderId));
    
    showNotification('Order fulfilled successfully!');
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-white uppercase">
        Pickup Orders ({pickupOrders.length})
      </h2>
      
      {pickupOrders.map(order => (
        <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-white font-bold text-lg">
                Order #{order.order_number}
              </div>
              <div className="text-white/60">
                {order.customers.first_name} {order.customers.last_name}
              </div>
              <div className="text-white/40 text-sm">
                {order.customers.phone}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-xl">
                ${order.total_amount}
              </div>
              <div className="text-green-500 text-sm">
                PREPAID
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {order.order_items.map(item => (
              <div key={item.id} className="flex justify-between text-white/60">
                <span>{item.product_name} ({item.quantity}x)</span>
                <span>${item.line_total}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => fulfillOrder(order.id)}
              className="flex-1 bg-white text-black font-black uppercase py-3 rounded-2xl hover:bg-white/90"
            >
              Fulfill Order
            </button>
            <button className="px-6 border border-white/20 text-white rounded-2xl hover:bg-white/5">
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📦 **INVENTORY SYNC**

### **Inventory Reservation System**

```sql
-- When online pickup order is placed:
-- Inventory is RESERVED but not yet deducted

-- orders table tracks this:
CREATE OR REPLACE FUNCTION reserve_inventory_for_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a pickup order
  IF NEW.delivery_type = 'pickup' AND NEW.pickup_location_id IS NOT NULL THEN
    -- Loop through order items
    FOR item IN 
      SELECT * FROM order_items WHERE order_id = NEW.id
    LOOP
      -- Update inventory: add to reserved_quantity
      UPDATE inventory
      SET 
        reserved_quantity = reserved_quantity + item.quantity,
        available_quantity = quantity - (reserved_quantity + item.quantity),
        updated_at = NOW()
      WHERE 
        location_id = NEW.pickup_location_id
        AND product_id = item.product_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after order created
CREATE TRIGGER reserve_inventory_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION reserve_inventory_for_order();

-- When staff fulfills pickup order at POS:
CREATE OR REPLACE FUNCTION fulfill_pickup_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If order just marked as fulfilled
  IF OLD.fulfillment_status != 'fulfilled' AND NEW.fulfillment_status = 'fulfilled' THEN
    -- Loop through order items
    FOR item IN 
      SELECT * FROM order_items WHERE order_id = NEW.id
    LOOP
      -- Update inventory: deduct from reserved AND actual quantity
      UPDATE inventory
      SET 
        quantity = quantity - item.quantity,
        reserved_quantity = reserved_quantity - item.quantity,
        available_quantity = quantity - item.quantity - reserved_quantity,
        updated_at = NOW()
      WHERE 
        location_id = NEW.pickup_location_id
        AND product_id = item.product_id;
      
      -- Create stock movement
      INSERT INTO stock_movements (
        inventory_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        reason
      ) VALUES (
        (SELECT id FROM inventory WHERE location_id = NEW.pickup_location_id AND product_id = item.product_id),
        'sale',
        -item.quantity,
        'order',
        NEW.id,
        'Pickup order fulfilled at POS'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on order update
CREATE TRIGGER fulfill_pickup_order_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION fulfill_pickup_order();
```

### **POS Shows Accurate Inventory**

```typescript
// POS Product Grid shows:
// - Actual quantity on hand
// - Minus reserved quantity (from online orders)
// = Available for walk-in sales

// components/component-registry/pos/POSProductGrid.tsx

async function loadLocationInventory(locationId: string) {
  const { data } = await supabase
    .from('inventory')
    .select(`
      *,
      products(*)
    `)
    .eq('location_id', locationId);
  
  return data.map(inv => ({
    ...inv.products,
    quantity_on_hand: inv.quantity,
    quantity_reserved: inv.reserved_quantity,
    quantity_available: inv.available_quantity, // This is what POS shows
    low_stock: inv.available_quantity < inv.low_stock_threshold
  }));
}
```

---

## 🎯 **API ENDPOINTS**

```typescript
// POS-specific endpoints

// Session Management
POST   /api/pos/sessions/open
POST   /api/pos/sessions/close
GET    /api/pos/sessions/active
PATCH  /api/pos/sessions/[id]

// Sales
POST   /api/pos/sales/create          // Walk-in sale
POST   /api/pos/sales/fulfillment     // Fulfill pickup order
POST   /api/pos/sales/refund
POST   /api/pos/sales/void

// Orders
GET    /api/pos/orders/pickup         // Get pickup orders for location
PATCH  /api/pos/orders/[id]/fulfill   // Mark as fulfilled
GET    /api/pos/orders/history

// Products
GET    /api/pos/products              // Location inventory
GET    /api/pos/products/search

// Customers
GET    /api/pos/customers/search
POST   /api/pos/customers/quick-create

// Transactions
POST   /api/pos/transactions
GET    /api/pos/transactions/session

// Notifications
GET    /api/pos/notifications         // Polling fallback
PATCH  /api/pos/notifications/[id]/read
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation (Week 1-2)**
- [ ] Create POS database tables (sessions, transactions)
- [ ] Add context_type to page_sections
- [ ] Add location_id to page_sections
- [ ] Create POS component directory structure
- [ ] Extend COMPONENT_MAP for POS components

### **Phase 2: Core POS Components (Week 2-3)**
- [ ] POSSessionHeader
- [ ] POSProductGrid (location-specific inventory)
- [ ] POSCart (shopping cart widget)
- [ ] POSCustomerLookup
- [ ] POSPayment (cash only to start)

### **Phase 3: Pickup Order Integration (Week 3)**
- [ ] POSPickupQueue component
- [ ] Supabase Realtime subscription
- [ ] Order fulfillment workflow
- [ ] Inventory reservation system
- [ ] Stock deduction on fulfillment

### **Phase 4: Walk-In Sales (Week 4)**
- [ ] Session management (open/close)
- [ ] Walk-in sale workflow
- [ ] Cash payment handling
- [ ] Receipt generation
- [ ] End-of-day reports

### **Phase 5: Advanced Features (Week 5-6)**
- [ ] Hold/retrieve transactions
- [ ] Refunds/voids
- [ ] Customer loyalty integration
- [ ] Multi-location transfer requests
- [ ] Advanced reporting

### **Phase 6: AI Optimization (Week 6+)**
- [ ] AI generates POS layouts per location
- [ ] Track staff efficiency metrics
- [ ] Auto-optimize product positioning
- [ ] Predict peak hours for staffing
- [ ] Cross-location learning

---

## 🌊 **THE LIVING ORGANISM**

### **How POS Feeds the AI:**

```
Customer views product online (storefront)
  ↓
AI tracks: "Product X: 100 views"
  ↓
Customer orders online for pickup (storefront)
  ↓
AI tracks: "Product X: 10 online conversions"
  ↓
Staff fulfills pickup order (POS)
  ↓
AI tracks: "Product X: Pickup orders fulfill in 5 minutes avg"
  ↓
Walk-in customer buys Product X (POS)
  ↓
AI tracks: "Product X: 20 walk-in sales"
  ↓
AI learns: "Product X converts 30% better in-store than online"
  ↓
AI optimizes storefront: Add "Available for Pickup" badge
  ↓
AI optimizes POS: Feature Product X at top
  ↓
Revenue increases 15%
  ↓
AI shares learning with all cannabis vendors
  ↓
PLATFORM EVOLVES
```

### **Cross-Context Optimization:**

| Metric | Storefront Impact | POS Impact | Learning |
|--------|-------------------|------------|----------|
| Product views high, sales low | Add urgency badges | Feature at POS top | "Customers researching online, buying in-store" |
| Pickup orders pile up | Show wait time | Staff alert, prioritize | "Need more staff during peak" |
| Certain products return often | Show warning | Flag at POS | "Quality issue detected" |
| Location out of stock | Show other locations | Can't sell, suggest alternative | "Stock prediction was wrong" |

---

## 🎯 **SUCCESS METRICS**

### **Technical:**
- [ ] Order appears in POS within 5 seconds of online placement
- [ ] Inventory sync: <1 second delay
- [ ] POS page load: <2 seconds
- [ ] Zero inventory conflicts (overselling)
- [ ] 99.9% uptime during store hours

### **Business:**
- [ ] Pickup orders fulfilled in <5 minutes avg
- [ ] Walk-in transaction time: <2 minutes avg
- [ ] Zero missed pickup orders
- [ ] Staff satisfaction: 8/10+
- [ ] Inventory accuracy: 99%+

### **Integration:**
- [ ] All online pickup orders appear in POS
- [ ] All POS sales update online inventory
- [ ] Unified order history (online + POS)
- [ ] Single customer record (online + in-store)
- [ ] Real-time inventory accuracy

---

## 📋 **REQUIRED FEATURES CHECKLIST**

### **Core POS:**
- [ ] Session management (open/close)
- [ ] Product search/browse
- [ ] Add items to cart
- [ ] Process payment (cash)
- [ ] Print receipt
- [ ] Inventory deduction

### **Pickup Order Integration:**
- [ ] Receive online orders in real-time
- [ ] Display pickup queue
- [ ] Notify staff of new orders
- [ ] Fulfill orders (mark complete)
- [ ] Deduct reserved inventory
- [ ] Update customer order status

### **Customer Management:**
- [ ] Search existing customers
- [ ] Quick create walk-in customer
- [ ] Link online account to in-store
- [ ] View order history

### **Inventory:**
- [ ] Show location-specific inventory
- [ ] Reserve inventory for online orders
- [ ] Deduct on fulfillment
- [ ] Low stock alerts
- [ ] Track stock movements

### **Reporting:**
- [ ] Session summary (sales, transactions)
- [ ] Daily sales report
- [ ] Pickup vs walk-in breakdown
- [ ] Staff performance
- [ ] Cash drawer reconciliation

---

## 🚀 **NEXT STEPS**

1. **Week 1:** Set up database tables and base POS components
2. **Week 2:** Build pickup order queue with real-time sync
3. **Week 3:** Test with Flora Distro Charlotte Central
4. **Week 4:** Launch walk-in sales at one location
5. **Week 5:** Roll out to all Flora Distro locations
6. **Week 6:** AI optimization begins learning

**The foundation is ready. The vision is clear. Let's build the first component-based, AI-optimized POS system.**

