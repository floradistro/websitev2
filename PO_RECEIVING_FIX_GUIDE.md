# Purchase Order Receiving Fix - Implementation Guide

## Problem Summary

Purchase orders were receiving inventory correctly, but the PO status was stuck in "ordered" status because:

1. ❌ `purchase_order_items.quantity_received` was NOT being updated
2. ❌ `purchase_order_items.quantity_remaining` was NOT being updated
3. ❌ `purchase_orders.status` was NOT being changed

## Solution

Updated the `receive_purchase_order_items()` database function to:
- ✅ Update PO item quantities after receiving
- ✅ Update PO status to `'partially_received'` or `'received'`

## Implementation Steps

### Step 1: Apply the Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of:
   ```
   /Users/whale/Desktop/whaletools/supabase/migrations/20251114000003_fix_po_receiving_updates.sql
   ```
4. Paste into SQL Editor
5. Click **Run**
6. You should see: `Success. No rows returned`

**Option B: Using Supabase CLI**

```bash
supabase db push --db-url "postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres"
```

### Step 2: Verify the Migration

Run the verification script:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://uaednwpxursknmwdeejn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npx tsx scripts/check_migration_status.ts
```

You should see:
```
✅ Updates purchase_order_items
✅ Updates purchase_orders status
✅ Sets quantity_received field
✅ Migration HAS been applied correctly!
```

### Step 3: Test the Fix

**Option A: Automated Test**

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://uaednwpxursknmwdeejn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npx tsx scripts/test_po_receiving.ts
```

**Option B: Manual Test**

1. Go to **Products → Purchase Orders** in your app
2. Find a PO in "ordered" status
3. Click **"Receive Items"**
4. Enter quantities to receive
5. Click **"Receive Items"** button
6. ✅ PO should now show "partially_received" or "received" status

## New Features Added

### 1. Edit Purchase Order (API Ready)

**Endpoint:** `PATCH /api/vendor/purchase-orders`

**Usage:**
```javascript
await axios.patch('/api/vendor/purchase-orders', {
  po_id: 'uuid',
  supplier_id: 'uuid',
  items: [
    { id: 'existing-item-id', quantity: 10, unit_price: 5.00 },
    { product_id: 'new-product-id', quantity: 5, unit_price: 3.00 }
  ],
  internal_notes: 'Updated notes'
});
```

**Features:**
- Update PO fields (supplier, location, dates, notes, etc.)
- Add/remove/update line items
- Automatic total recalculation
- Cannot edit fully received POs

### 2. Delete Purchase Order

**Endpoint:** `DELETE /api/vendor/purchase-orders?po_id=uuid`

**Usage:**
```javascript
await axios.delete(`/api/vendor/purchase-orders?po_id=${poId}`);
```

**Features:**
- Deletes PO and all related records
- Cannot delete POs that have received inventory
- Prevents data integrity issues

### 3. UI Actions Menu

Each PO card now has a **⋮** menu with:
- **Edit PO** (shows placeholder alert - ready for modal implementation)
- **Delete PO** (fully functional with confirmation)

**Location:** Products → Purchase Orders → Each PO card

## Troubleshooting

### Issue: Still getting 500 error when receiving

**Check server logs:**
```bash
# Look for error details in terminal running npm run dev
```

**Common causes:**
1. Migration not applied - Run Step 1 again
2. Database function has syntax error - Check Supabase logs
3. Missing columns - Check purchase_order_items table schema

### Issue: Function returns null

This means the database function is failing silently. Check:

```sql
-- In Supabase SQL Editor
SELECT prosrc
FROM pg_proc
WHERE proname = 'receive_purchase_order_items';
```

Verify it contains:
- `UPDATE purchase_order_items`
- `UPDATE purchase_orders`
- `quantity_received` and `quantity_remaining` fields

### Issue: PO status not updating

Check that your `purchase_orders` table has these status values:
- `'ordered'`
- `'partially_received'`
- `'received'`

## Files Changed

### Database
- `supabase/migrations/20251114000003_fix_po_receiving_updates.sql` - New migration

### API Routes
- `app/api/vendor/purchase-orders/route.ts` - Added PATCH and DELETE endpoints

### Components
- `app/vendor/products/components/purchase-orders/POList.tsx` - Added edit/delete UI
- `app/vendor/products/components/purchase-orders/PurchaseOrdersTab.tsx` - Wired up handlers

### Scripts (Testing)
- `scripts/test_po_receiving.ts` - Comprehensive end-to-end test
- `scripts/check_migration_status.ts` - Verify migration applied

## Next Steps

1. ✅ Apply the migration (Step 1)
2. ✅ Test receiving flow (Step 3)
3. ✅ Test delete functionality
4. 🔜 Implement EditPOModal (optional - similar to CreatePOModal)

## Support

If you encounter issues:

1. Check server logs in terminal
2. Check browser console for errors
3. Run the test script with DEBUG=true for verbose output
4. Check Supabase logs in Dashboard → Logs

## Migration SQL Reference

The migration does three key things:

1. **Updates PO Item Quantities:**
```sql
UPDATE purchase_order_items
SET
  quantity_received = v_new_quantity_received,
  quantity_remaining = quantity - v_new_quantity_received,
  updated_at = NOW()
WHERE id = (v_item->>'po_item_id')::UUID;
```

2. **Updates PO Status:**
```sql
IF v_all_received THEN
  UPDATE purchase_orders
  SET status = 'received', updated_at = NOW()
  WHERE id = p_po_id;
ELSIF v_any_received THEN
  UPDATE purchase_orders
  SET status = 'partially_received', updated_at = NOW()
  WHERE id = p_po_id AND status = 'ordered';
END IF;
```

3. **Creates Full Audit Trail:**
- ✅ `purchase_order_receives` - Receive history
- ✅ `stock_movements` - Inventory movement tracking
- ✅ `inventory` - Stock levels with weighted average cost
