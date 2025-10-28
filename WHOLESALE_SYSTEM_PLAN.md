# Wholesale System Implementation Plan

## Overview
Multi-tenant B2B/B2C wholesale ordering system for your platform.

## Architecture

### Core Concepts

1. **Suppliers** - Where vendors buy FROM
   - Can be external companies OR other vendors in the system
   - If `supplier_vendor_id` is set → automated B2B with another vendor
   - If `supplier_vendor_id` is null → manual external supplier

2. **Wholesale Customers** - Who vendors sell TO
   - Can be retail businesses OR other vendors
   - If `customer_vendor_id` is set → order appears in their vendor dashboard
   - If `customer_vendor_id` is null → external business (manual tracking)

3. **Purchase Orders**
   - **Inbound POs**: Buying from suppliers → receive inventory
   - **Outbound POs**: Selling to wholesale customers → fulfill/ship

---

## Database Schema ✅ COMPLETE

Tables created:
- `suppliers` - Vendor's supplier relationships
- `wholesale_customers` - Vendor's wholesale customers
- `purchase_orders` - All POs (inbound & outbound)
- `purchase_order_items` - Line items for POs
- `purchase_order_payments` - Payment tracking
- `inventory_reservations` - Reserve stock for outbound POs

**Location:** `supabase/migrations/20251027_wholesale_system.sql`

**To Run:**
1. Go to Supabase SQL Editor
2. Copy/paste the migration file
3. Execute

---

## TypeScript Types ✅ COMPLETE

**Location:** `types/wholesale.ts`

Includes:
- Supplier
- WholesaleCustomer
- PurchaseOrder
- PurchaseOrderItem
- PurchaseOrderPayment
- InventoryReservation
- Input types for creating/updating

---

## API Routes (TODO)

### 1. Suppliers API
**Endpoint:** `/api/vendor/suppliers`

**Methods:**
- `GET` - List all suppliers for vendor
- `POST` - Create new supplier
  - Action: `create` - Add supplier
  - Action: `update` - Update supplier
  - Action: `delete` - Soft delete supplier

**Features:**
- Filter by active/inactive
- Search by name
- Link to vendor (B2B)

---

### 2. Wholesale Customers API
**Endpoint:** `/api/vendor/wholesale-customers`

**Methods:**
- `GET` - List all wholesale customers
- `POST` - Create/update/delete customers

**Features:**
- Filter by pricing tier
- Filter by active/inactive
- Credit limit tracking
- Link to vendor (B2B)

---

### 3. Purchase Orders API
**Endpoint:** `/api/vendor/purchase-orders`

**Methods:**
- `GET` - List POs (filter by type, status)
- `POST` - Create/update PO
  - Action: `create` - New PO
  - Action: `update_status` - Update status
  - Action: `add_payment` - Record payment
  - Action: `receive` - Mark items received (inbound)
  - Action: `fulfill` - Mark items fulfilled (outbound)

**Endpoint:** `/api/vendor/purchase-orders/[id]`
- `GET` - Get single PO with items

**Features:**
- Automatic inventory reservation (outbound)
- Automatic inventory update (inbound when received)
- Calculate totals from line items
- Generate PO numbers
- Payment tracking

---

## Frontend Pages (TODO)

### 1. Wholesale POS
**Route:** `/wholesale/pos`

**Purpose:** Create outbound POs for wholesale customers

**Features:**
- Select wholesale customer
- Search & add products
- Apply customer's discount tier
- Set payment terms
- Add shipping costs
- Generate & send PO
- Reserve inventory immediately

**User Roles:** warehouse_staff, sales, admin

---

### 2. Supplier Management
**Route:** `/vendor/suppliers`

**Features:**
- List all suppliers
- Add/edit suppliers
- Link to vendor suppliers (B2B)
- View purchase history
- Manage payment terms

---

### 3. Wholesale Customer Management
**Route:** `/vendor/wholesale-customers`

**Features:**
- List customers
- Add/edit customers
- Set pricing tiers
- Manage credit limits
- View order history
- Link to vendor customers (B2B)

---

### 4. Purchase Orders Dashboard
**Route:** `/vendor/purchase-orders`

**Features:**
- Tabs for Inbound/Outbound
- Filter by status
- Quick actions (approve, fulfill, cancel)
- Print POs
- Track payments

---

## Order Status Flows

### Inbound PO (Buying from Supplier)
```
draft → sent → confirmed → in_transit → received
```

When "received" → Update inventory quantities

### Outbound PO (Selling to Customer)
```
draft → sent → confirmed → fulfilled → shipped → delivered
```

When "created" → Reserve inventory
When "fulfilled" → Deduct from inventory

---

## Customer-Initiated Orders

For regular orders (not POs), flow is:
```
pending → accepted → preparing → ready → completed
```

This is handled by existing order system in `/pos/orders`

---

## Next Steps

1. **Run Migration** - Execute the SQL in Supabase
2. **Build API Routes** - Create supplier, customer, and PO APIs
3. **Build Wholesale POS** - New app at `/wholesale/pos`
4. **Build Management UIs** - Supplier & customer management
5. **Update Navigation** - Add wholesale menu items
6. **Testing** - Test full B2B flow

---

## Questions Resolved

1. ✅ **POS Interface**: Separate app at `/wholesale/pos`
2. ✅ **Customer Accounts**: Wholesale customers can be vendors (B2B) or external
3. ✅ **Inventory**: Outbound POs reserve immediately, customer orders go through statuses
4. ✅ **Supplier Model**: Hybrid - can be vendors (automated) or external (manual)
5. ✅ **Priority**: Building both supplier and wholesale customer systems simultaneously

---

## Benefits of This Design

1. **Flexible B2B**: Vendors can sell to each other within the platform
2. **Hybrid Model**: Works with both platform vendors and external businesses
3. **Automated**: If supplier/customer is a vendor, orders sync automatically
4. **Scalable**: Same infrastructure for small and large operations
5. **Multi-Tier**: Supports retail → wholesale → distributor pricing
6. **Inventory Smart**: Automatic reservations and updates

---

**Status:** Schema complete, types complete, ready to build APIs and UI
