# Purchase Order System Consolidation Plan

**Date:** 2025-11-07
**Status:** Planning → Implementation
**Priority:** CRITICAL (blocks PO receiving workflow)

---

## Problem Statement

Two overlapping PO systems exist in the database:

1. **Original System** (migration: `20251023_purchase_orders.sql`)
   - Simple inbound-only PO structure
   - Dedicated `purchase_order_receives` table for quality control
   - Better receiving workflow with condition tracking
   - Auto-status update triggers

2. **Wholesale System** (migration: `20251027_wholesale_system.sql`)
   - More comprehensive with inbound/outbound support
   - `suppliers` and `wholesale_customers` tables
   - `inventory_reservations` table
   - Separate `purchase_order_payments` table
   - Supports B2B selling (outbound POs)

**Current State:**
- API uses **Wholesale System** schema
- Original System has better receiving features
- Confusion about which schema to use
- Missing features from both systems

---

## Decision: Use Wholesale System as Base

**Why Wholesale System:**
✅ More complete architecture (inbound + outbound)
✅ Already integrated with suppliers table
✅ Supports B2B scenarios (selling to other vendors)
✅ Has inventory reservations
✅ Separate payment tracking
✅ Current API already uses it

**What to Add from Original System:**
✅ `purchase_order_receives` table (quality control)
✅ Better receiving workflow triggers
✅ Auto-status update logic
✅ `receive_status` field on items
✅ Quality control fields (condition, quality_notes)

---

## Consolidation Strategy

### Phase 1: Database Schema Consolidation ✅
**Action:** Create new migration that enhances wholesale system with original system's best features

**Changes to make:**
1. Add `purchase_order_receives` table to wholesale schema
2. Add `receive_status` field to `purchase_order_items`
3. Add receiving triggers (auto-update status)
4. Add `quantity_remaining` generated column
5. Keep wholesale system's core tables intact
6. Mark original system as deprecated

**New Migration File:** `20251107_consolidate_po_systems.sql`

### Phase 2: API Updates
**No changes needed** - API already uses wholesale system!

### Phase 3: Documentation
Update all references to use consolidated schema

---

## Consolidated Schema Design

### Core Tables (from Wholesale System)
```sql
suppliers                    ✅ Keep as-is
wholesale_customers          ✅ Keep as-is
purchase_orders             ✅ Enhance with better fields
purchase_order_items        ✅ Add receive_status
purchase_order_payments     ✅ Keep as-is
inventory_reservations      ✅ Keep as-is
```

### New Table (from Original System)
```sql
purchase_order_receives     ✅ ADD - critical for quality control
  - purchase_order_id
  - po_item_id
  - quantity_received
  - received_date
  - received_by
  - condition (good/damaged/expired/rejected)
  - quality_notes
  - inventory_id (link to inventory update)
  - notes
```

### Enhanced Fields
```sql
purchase_order_items:
  + receive_status TEXT (pending/partial/received/cancelled)
  + quantity_remaining DECIMAL (generated)

purchase_orders:
  + received_date DATE (for tracking completion)
  + receiver_by UUID (who received it)
```

### Triggers to Add
```sql
1. update_item_receive_status_trigger
   - Updates item.quantity_received sum from receives table
   - Auto-updates item.receive_status

2. update_po_status_trigger
   - Auto-updates PO status based on all items
   - Sets received_date when fully received

3. sync_inventory_on_receive_trigger
   - Creates stock_movement record
   - Updates inventory quantities
   - Calculates weighted average cost
```

---

## Migration Strategy

### Option A: Drop and Recreate (DESTRUCTIVE)
```sql
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
-- Recreate with consolidated schema
```
**Pros:** Clean slate
**Cons:** Loses all existing PO data

### Option B: Alter Existing (SAFE) ⭐ RECOMMENDED
```sql
-- Add missing columns to existing tables
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS receive_status TEXT;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS quantity_remaining DECIMAL;

-- Create new tables
CREATE TABLE purchase_order_receives (...);

-- Add triggers
CREATE TRIGGER update_item_receive_status_trigger ...;
```
**Pros:** Preserves data, incremental
**Cons:** Need to handle conflicts

---

## Implementation Steps

### Step 1: Create Consolidation Migration
```bash
File: supabase/migrations/20251107_consolidate_po_systems.sql
```

**Contents:**
1. Comment header explaining consolidation
2. Add `receive_status` to `purchase_order_items`
3. Add `quantity_remaining` as generated column
4. Create `purchase_order_receives` table
5. Create receiving triggers
6. Add comments deprecating 20251023 migration

### Step 2: Test Migration
```bash
# Apply to local database
psql -h localhost -U postgres -d whaletools -f supabase/migrations/20251107_consolidate_po_systems.sql

# Verify tables exist
\dt purchase_order*

# Verify columns added
\d purchase_order_items
```

### Step 3: Update API Receiving Endpoint
File: `/app/api/vendor/purchase-orders/receive/route.ts`

**Changes needed:**
- Use `purchase_order_receives` table ✅ (already does!)
- Update to use consolidated schema fields
- Add transaction handling

### Step 4: Mark Original Migration as Deprecated
Add to `20251023_purchase_orders.sql`:
```sql
-- ================================================================
-- DEPRECATED: 2025-11-07
-- This schema has been superseded by the consolidated system
-- See migration: 20251107_consolidate_po_systems.sql
-- ================================================================
```

---

## Data Migration (if needed)

If there's existing PO data in the old schema:

```sql
-- Copy POs from old to new (if tables have different structure)
INSERT INTO purchase_orders (/* new fields */)
SELECT /* old fields */ FROM old_purchase_orders;

-- Update references
UPDATE purchase_order_items
SET receive_status = 'pending'
WHERE receive_status IS NULL;
```

---

## Verification Checklist

After consolidation:
- [ ] Both table structures exist and work
- [ ] No duplicate table names
- [ ] Triggers fire correctly
- [ ] API endpoints work
- [ ] Foreign keys intact
- [ ] RLS policies applied
- [ ] Indexes created
- [ ] Receiving workflow functional

---

## Rollback Plan

If consolidation fails:

```sql
-- Drop new additions
DROP TABLE IF EXISTS purchase_order_receives CASCADE;
DROP TRIGGER IF EXISTS update_item_receive_status_trigger;
DROP TRIGGER IF EXISTS update_po_status_trigger;

-- Remove added columns
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS receive_status;
ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS quantity_remaining;
```

---

## Post-Consolidation Benefits

✅ Single source of truth for PO schema
✅ No confusion about which tables to use
✅ Best features from both systems combined
✅ Full inbound + outbound support
✅ Complete receiving workflow with quality control
✅ Proper inventory integration
✅ Clean foundation for UI development

---

## Timeline

**Duration:** 1-2 hours

- ✅ Analysis complete (30 min)
- ⏳ Create migration SQL (30 min)
- ⏳ Test migration locally (15 min)
- ⏳ Verify API compatibility (15 min)
- ⏳ Deploy to production (15 min)

---

## Next Steps After Consolidation

1. Build Receiving UI (uses consolidated schema)
2. Build PO Creation UI (uses consolidated schema)
3. Build PO Detail view (uses consolidated schema)
4. Add stock movement visibility

**All UI development will use the clean, consolidated schema!**
