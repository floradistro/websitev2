# 🚀 APPLY INVENTORY MIGRATION TO SUPABASE

## ⚠️ QUICK & EASY METHOD (5 MINUTES)

The automated approach didn't work, but the manual method is actually faster and more reliable!

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Open Supabase SQL Editor**

Click this link:
```
https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new
```

Or navigate to:
1. Supabase Dashboard
2. Your project: `uaednwpxursknmwdeejn`
3. Click **SQL Editor** in left sidebar
4. Click **New query**

---

### **Step 2: Copy Migration SQL**

Open this file in your editor:
```
/Users/whale/Desktop/Website/supabase/migrations/20251021_inventory_system.sql
```

**OR** run this command to view it:
```bash
cat /Users/whale/Desktop/Website/supabase/migrations/20251021_inventory_system.sql
```

**OR** I'll show you the first few lines - you need to copy the ENTIRE file:

```sql
-- ============================================================================
-- FLORA DISTRO - INVENTORY SYSTEM (Supabase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ...
```

---

### **Step 3: Paste & Run**

1. **Select all** content from the migration file (Cmd+A)
2. **Copy** (Cmd+C)
3. **Paste** into Supabase SQL Editor (Cmd+V)
4. Click **RUN** button (bottom right)
5. Wait ~10-30 seconds

---

### **Step 4: Verify Success**

You should see:
```
Success. No rows returned
```

Then check the **Table Editor**:
1. Click **Table Editor** in left sidebar
2. You should see NEW tables:
   - ✅ locations
   - ✅ inventory
   - ✅ stock_movements
   - ✅ stock_transfers
   - ✅ stock_transfer_items
   - ✅ vendor_orders
   - ✅ pos_transactions
   - ✅ pos_transaction_items
   - ✅ vendor_payouts

---

## ✅ AFTER MIGRATION SUCCESS

### **Test the APIs:**

```bash
# Test locations endpoint
curl http://localhost:3000/api/supabase/locations

# Expected response:
# {"success":true,"locations":[]}
```

### **Create First Location:**

```bash
curl -X POST http://localhost:3000/api/supabase/locations \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: YOUR_VENDOR_UUID_HERE" \
  -d '{
    "name": "Test Warehouse",
    "slug": "test-warehouse",  
    "type": "vendor",
    "city": "Charlotte",
    "state": "NC"
  }'
```

---

## 🐛 TROUBLESHOOTING

### **Error: "relation already exists"**
✅ **This is GOOD!** Tables are already created. Just ignore the error.

### **Error: "permission denied"**
❌ Check you're using the **service_role** key, not the anon key.

### **Error: "syntax error"**
❌ Make sure you copied the ENTIRE file, not just part of it.

### **No tables showing up**
1. Refresh the Table Editor page
2. Check you're in the right schema: **public**
3. Click the schema dropdown and select **public**

---

## 🎯 QUICK COMMANDS

```bash
# Open migration file
code /Users/whale/Desktop/Website/supabase/migrations/20251021_inventory_system.sql

# Or view in terminal
cat /Users/whale/Desktop/Website/supabase/migrations/20251021_inventory_system.sql

# Count lines (should be ~500+)
wc -l /Users/whale/Desktop/Website/supabase/migrations/20251021_inventory_system.sql
```

---

## 📊 WHAT GETS CREATED

**9 Tables:**
1. `locations` - 10+ columns
2. `inventory` - 20+ columns  
3. `stock_movements` - 15+ columns
4. `stock_transfers` - 12+ columns
5. `stock_transfer_items` - 8+ columns
6. `vendor_orders` - 12+ columns
7. `pos_transactions` - 10+ columns
8. `pos_transaction_items` - 10+ columns
9. `vendor_payouts` - 15+ columns

**Plus:**
- 30+ indexes
- 20+ RLS policies
- 5+ triggers
- Functions

**Total:** ~500 lines of production SQL ✅

---

## ⏱️ TIME ESTIMATE

- **Copy file:** 30 seconds
- **Paste in SQL Editor:** 10 seconds  
- **Click Run:** 1 second
- **Wait for execution:** 10-30 seconds

**Total: ~1 minute** ⚡

---

## 🎉 YOU'RE DONE!

Once tables are created, your inventory system is LIVE and ready to use!

**Next:**
- Build vendor inventory UI
- Test APIs
- Create test data
- Start building! 🚀

