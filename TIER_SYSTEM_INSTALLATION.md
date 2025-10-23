# 🚀 Multi-Tier Distribution System - Installation Guide

## Step 1: Run Database Migration in Supabase Dashboard

### Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/20251024_multi_tier_distribution.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)

### What This Does:
- ✅ Adds `account_tier` to vendors and customers tables  
- ✅ Adds `access_roles` array for multi-role support
- ✅ Creates distributor access request workflow  
- ✅ Adds tier visibility to products
- ✅ Creates "Distributor Bulk" pricing blueprint
- ✅ Updates Flora Distro to Tier 1  
- ✅ Adds helper functions for tier checking

---

## Step 2: Verify Installation

Run this command to check everything is working:

```bash
node verify-tier-system.js
```

You should see:
- ✅ Flora Distro showing as Tier 1
- ✅ 4 pricing blueprints (Retail, Wholesale Tiered, Wholesale Cost Plus, Distributor Bulk)
- ✅ Tier summary showing vendor counts

---

## Step 3: Configure Distributor Pricing

### For Flora Distro:
1. Login to vendor dashboard
2. Go to **Settings → Pricing**  
3. You'll now see a new blueprint: **"Distributor Bulk"**
4. Configure your prices:
   - 100-499 lbs: $800/lb (or your price)
   - 500+ lbs: $750/lb (or your price)
5. Click **Save**

---

## How The Tier System Works

### Tier Levels:
```
Tier 1 (Distributor) → Lowest prices, highest minimums, invite-only
Tier 2 (Wholesale)   → Mid-tier pricing, business verification required  
Tier 3 (Retail)      → Public pricing, low minimums, anyone can buy
```

### Example: Blue Dream Pricing

**Same product, 3 different price configurations:**

| Tier | Blueprint | Price | MOQ | Who Sees It |
|------|-----------|-------|-----|-------------|
| 1 | Distributor Bulk | $800/lb | 100 lbs | Flora Distro only (Tier 1) |
| 2 | Wholesale Tiered | $1000/lb | 10 lbs | Business accounts (Tier 2) |
| 3 | Retail Flower | $1200/oz | 1 oz | Everyone (Tier 3) |

### Multi-Role Example: Flora Distro

Flora Distro is **BOTH** a distributor AND a vendor:

**As Distributor (buying):**
- Sees all products (including other distributors)
- Buys at $800/lb from suppliers  
- Minimum order: 100 lbs

**As Vendor (selling):**
- Sells to customers at $1200/oz
- Sells to wholesale customers at $1000/lb
- Sells to other distributors at $800/lb

**UI Shows:**
```
┌─────────────────────────────────┐
│ 👤 Viewing as:                  │
│  • Distributor Mode   ← Active  │
│  • Vendor Mode                  │
└─────────────────────────────────┘
```

---

## Product Visibility Rules

### Distributor Products (minimum_tier_required = 1)
- ✅ Visible to: Tier 1 accounts only
- ❌ Hidden from: Tier 2 and Tier 3

### Wholesale Products (minimum_tier_required = 2)
- ✅ Visible to: Tier 1 and Tier 2
- ❌ Hidden from: Tier 3 (unless they upgrade)

### Retail Products (minimum_tier_required = 3)
- ✅ Visible to: Everyone

---

## Requesting Distributor Access

### For Vendors Who Want Distributor Pricing:

**Customer Journey:**
1. Browse products
2. See "🔒 Distributor Pricing Available" badge
3. Click **"Request Distributor Access"**
4. Fill out form:
   - Business name
   - License number & upload
   - Tax ID
   - Estimated volume
5. Admin reviews application
6. Approved → Account upgraded to Tier 1
7. User now sees distributor pricing + products

**Admin Approval:**
1. Go to `/admin/distributor-requests`
2. Review application & documents
3. Click **Approve** or **Reject**
4. System automatically upgrades user to Tier 1
5. User gets email notification

---

## Pricing Configuration Examples

### Example 1: Flora Distro Sells Blue Dream

**Retail Flower Blueprint (Tier 3 - Public):**
```json
{
  "1g": {"price": "15.00", "enabled": true},
  "3_5g": {"price": "45.00", "enabled": true},
  "7g": {"price": "80.00", "enabled": true},
  "14g": {"price": "150.00", "enabled": true},
  "28g": {"price": "280.00", "enabled": true}
}
```

**Wholesale Tiered Blueprint (Tier 2 - Business accounts):**
```json
{
  "tier_1": {"price": "1200", "min_qty": 1, "max_qty": 9, "enabled": true},
  "tier_2": {"price": "1100", "min_qty": 10, "max_qty": 19, "enabled": true},
  "tier_3": {"price": "1000", "min_qty": 20, "enabled": true}
}
```

**Distributor Bulk Blueprint (Tier 1 - Invite only):**
```json
{
  "100lb": {"price": "800", "min_qty": 100, "max_qty": 499, "enabled": true},
  "500lb": {"price": "750", "min_qty": 500, "enabled": true}
}
```

---

## Frontend Components (Next Steps)

After database migration, these components will be built:

1. **AccountTierBadge** - Shows user's tier level
2. **RoleSwitcher** - For multi-role accounts (Distributor + Vendor)
3. **TieredPricingDisplay** - Shows appropriate pricing based on tier
4. **RequestDistributorAccess** - Application form modal
5. **DistributorAccessRequests** - Admin approval dashboard

---

## Database Schema Summary

### New Columns:

**vendors:**
- `account_tier` INTEGER (1, 2, or 3)
- `access_roles` TEXT[] (array of roles)
- `can_access_distributor_pricing` BOOLEAN

**customers:**
- `account_tier` INTEGER (1, 2, or 3)
- `access_roles` TEXT[] (array of roles)

**products:**
- `minimum_tier_required` INTEGER (1, 2, or 3)
- `distributor_only` BOOLEAN

**pricing_tier_blueprints:**
- `intended_for_tier` INTEGER
- `minimum_access_tier` INTEGER
- `requires_distributor_access` BOOLEAN

### New Tables:

**distributor_access_requests:**
- Stores applications for tier upgrades
- Tracks license verification
- Approval workflow

---

## Helper Functions

### get_user_best_tier(user_id)
Returns the highest tier (lowest number) a user qualifies for.

```sql
SELECT get_user_best_tier(auth.uid());
-- Returns: 1, 2, or 3
```

### get_user_accessible_blueprints(user_id)
Returns all pricing blueprints the user can access.

```sql
SELECT * FROM get_user_accessible_blueprints(auth.uid());
```

### can_access_distributor_pricing(user_id)
Boolean check for distributor access.

```sql
SELECT can_access_distributor_pricing(auth.uid());
-- Returns: true or false
```

---

## Testing

### Test Tier 1 User (Flora Distro):
```javascript
// Should see ALL 4 pricing blueprints
// Should see distributor-only products
// Can buy at lowest prices
```

### Test Tier 2 User (Wholesale):
```javascript
// Should see 3 blueprints (no distributor)
// Should NOT see distributor products  
// Can request distributor access
```

### Test Tier 3 User (Retail):
```javascript
// Should see 1 blueprint (retail only)
// Should NOT see wholesale/distributor products
// Can apply for wholesale or distributor access
```

---

## Rollback (If Needed)

To remove the tier system:

```sql
-- Remove columns
ALTER TABLE public.vendors 
  DROP COLUMN IF EXISTS account_tier,
  DROP COLUMN IF EXISTS access_roles,
  DROP COLUMN IF EXISTS can_access_distributor_pricing;

ALTER TABLE public.customers 
  DROP COLUMN IF EXISTS account_tier,
  DROP COLUMN IF EXISTS access_roles;

ALTER TABLE public.products 
  DROP COLUMN IF EXISTS minimum_tier_required,
  DROP COLUMN IF EXISTS distributor_only;

-- Remove table
DROP TABLE IF EXISTS public.distributor_access_requests CASCADE;

-- Remove functions
DROP FUNCTION IF EXISTS get_user_best_tier CASCADE;
DROP FUNCTION IF EXISTS get_user_accessible_blueprints CASCADE;
DROP FUNCTION IF EXISTS can_access_distributor_pricing CASCADE;
```

---

## Next Actions

1. ✅ Run SQL migration in Supabase Dashboard
2. ⏳ Verify with `node verify-tier-system.js`
3. ⏳ Configure Flora Distro distributor pricing
4. ⏳ Build frontend components
5. ⏳ Test with different tier levels
6. ⏳ Deploy to production

---

**Questions?** Check the migration file comments or reach out to support.

