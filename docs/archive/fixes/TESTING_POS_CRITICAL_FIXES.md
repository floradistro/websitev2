# POS Critical Fixes - Testing Guide

## Overview
This document outlines the critical fixes made to the POS system and provides test scenarios to verify everything works correctly before going live.

---

## 🔴 CRITICAL ISSUES FIXED

### 1. Cash Drawer Tracking (FIXED ✅)
**Problem**: Cash and card totals were never tracked separately in sessions
**Fix**: Created `increment_session_payment()` function that properly tracks:
- `total_cash` - All cash payments
- `total_card` - All card payments
- `total_sales` - Combined total

**Files Modified**:
- Database: Added `increment_session_payment()` function
- `/app/api/pos/sales/create/route.ts` - Line 380-385 (uses new function)

---

### 2. Card Payment Linking (FIXED ✅)
**Problem**: Authorization codes and card details from Dejavoo were not stored with sales
**Fix**: Now stores complete payment details:
- Authorization code (direct column)
- Payment transaction ID (metadata)
- Card type (metadata)
- Card last 4 (metadata)

**Files Modified**:
- `/app/api/pos/sales/create/route.ts` - Lines 35-39, 353-361
- `/app/pos/register/page.tsx` - Lines 529-533

---

### 3. Session Closing (FIXED ✅)
**Problem**: Expected cash calculation used `total_cash` which was always 0
**Fix**: With fix #1, session close now correctly calculates cash variance

**Files**: `/app/api/pos/sessions/close/route.ts` - Lines 51-52

---

### 4. Cash Movements (VERIFIED ✅)
**Status**: Table and API already exist and working
**Location**: `/app/api/pos/cash-movements/route.ts`

---

## 📋 COMPREHENSIVE TEST PLAN

### Test Scenario 1: Cash Sale
**Objective**: Verify cash tracking in sessions

**Steps**:
1. Open a new POS session with $200 opening cash
2. Add products to cart (e.g., $50 subtotal)
3. Checkout → Select "Cash" payment
4. Enter $60 cash tendered
5. Complete sale
6. Check session totals in operations dashboard

**Expected Results**:
```
opening_cash: $200.00
total_sales: $53.50 (with 7% tax)
total_cash: $53.50  ✅ MUST NOT BE $0
total_card: $0.00
total_transactions: 1
expected_cash: $253.50
```

---

### Test Scenario 2: Card Sale
**Objective**: Verify card payment tracking and authorization linking

**Steps**:
1. Continue with same session from Test 1
2. Add products to cart (e.g., $100 subtotal)
3. Checkout → Select "Card" payment
4. Process card payment through Dejavoo terminal
5. Complete sale
6. Check database: `pos_transactions` table

**Expected Results**:
```sql
-- Session totals
total_sales: $160.50 ($53.50 + $107.00)
total_cash: $53.50 (unchanged)
total_card: $107.00  ✅ MUST NOT BE $0
total_transactions: 2

-- pos_transactions record
authorization_code: NOT NULL  ✅
metadata->payment_transaction_id: NOT NULL  ✅
metadata->card_type: "Visa" (or actual card type)  ✅
metadata->card_last4: "1234" (or actual last 4)  ✅
```

---

### Test Scenario 3: Mixed Sales Session
**Objective**: Verify complete cash drawer reconciliation

**Steps**:
1. Open new session with $200 opening cash
2. Process multiple sales:
   - Sale 1: $25 cash
   - Sale 2: $50 card
   - Sale 3: $30 cash
   - Sale 4: $100 card
3. Close session with actual cash count

**Expected Results**:
```
Opening cash: $200.00
Total sales: ~$218.35 (with tax)
Total cash: ~$58.85 ($25 + $30 with tax)  ✅
Total card: ~$160.50 ($50 + $100 with tax)  ✅
Expected cash: $258.85 ($200 + $58.85)
```

**If you count $258.85**:
- Cash difference: $0.00
- Status: "balanced" ✅

**If you count $260.00**:
- Cash difference: $1.15
- Status: "over" ✅

**If you count $255.00**:
- Cash difference: -$3.85
- Status: "short" ✅

---

### Test Scenario 4: Edge Cases

#### 4a. Session with Only Card Sales
**Expected**:
- `total_cash`: $0.00 ✅
- `total_card`: Full amount ✅
- Session close: Expected cash = Opening cash only

#### 4b. Session with Only Cash Sales
**Expected**:
- `total_cash`: Full amount ✅
- `total_card`: $0.00 ✅
- Session close: Expected cash = Opening + all sales

#### 4c. Manual Card Entry (No Terminal)
**Expected**:
- `authorization_code`: "MANUAL-ENTRY" ✅
- `card_type`: "Manual Entry" ✅
- Still tracks in `total_card` ✅

---

## 🔍 SQL VERIFICATION QUERIES

### Check Session Tracking
```sql
SELECT
  session_number,
  opening_cash,
  total_sales,
  total_cash,  -- SHOULD NOT BE 0 if cash sales exist
  total_card,  -- SHOULD NOT BE 0 if card sales exist
  total_transactions,
  expected_cash,
  cash_difference,
  status
FROM pos_sessions
WHERE id = 'YOUR_SESSION_ID';
```

### Check Transaction Details
```sql
SELECT
  transaction_number,
  payment_method,
  total_amount,
  authorization_code,  -- SHOULD NOT BE NULL for card
  metadata->>'payment_transaction_id' as txn_id,
  metadata->>'card_type' as card_type,
  metadata->>'card_last4' as card_last4
FROM pos_transactions
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at;
```

### Check Cash/Card Split
```sql
SELECT
  payment_method,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_amount
FROM pos_transactions
WHERE session_id = 'YOUR_SESSION_ID'
GROUP BY payment_method;
```

---

## ⚠️ REGRESSION TESTING

Ensure existing functionality still works:

### Inventory Deduction
- Products sold should deduct from inventory
- Out-of-stock items should be handled gracefully
- Atomic deduction (race condition safe)

### Order Creation
- Orders created with correct status
- Order items linked correctly
- Customer pickup orders work

### Tax Calculation
- 7% tax applies correctly
- Tax breakdown shown in cart
- No fallback to 7% if tax config missing (requires config)

### Session Management
- Can't open duplicate sessions on same register
- Can join existing session
- Session polling works (2-second refresh)

---

## 🚀 GO-LIVE CHECKLIST

Before launching to production:

- [ ] All test scenarios pass
- [ ] SQL queries show correct cash/card split
- [ ] Authorization codes stored for all card transactions
- [ ] Session close shows accurate cash variance
- [ ] No "total_cash: 0.00" on sessions with cash sales
- [ ] Card transactions have card_type and card_last4 in metadata
- [ ] Terminal test connection works (from operations page)
- [ ] Multiple consecutive sales work without errors
- [ ] Session can be closed and reopened
- [ ] Cash movements API works (if using drawer operations)

---

## 📊 MONITORING

After going live, monitor these metrics:

1. **Cash Variance**: Should be within acceptable range (e.g., ±$5)
2. **Missing Authorization Codes**: Should be 0 for terminal payments
3. **Session Balance Issues**: Investigate any "short" > $10
4. **Payment Failures**: Check Dejavoo logs if card payments fail

---

## 🛠️ TROUBLESHOOTING

### Issue: total_cash still showing 0
**Check**: Are you using an old session created before the fix?
**Solution**: Close old session and open a new one

### Issue: Authorization code is NULL
**Check**: Was terminal connected during payment?
**Solution**: Verify terminal test passes in operations page

### Issue: Cash difference incorrect
**Check**: Did all sales use the new `increment_session_payment` function?
**Solution**: Verify API logs show the new function being called

---

## 📞 SUPPORT

If issues persist after testing:
1. Check server logs for errors
2. Verify database function exists: `SELECT * FROM pg_proc WHERE proname = 'increment_session_payment'`
3. Confirm all files were updated correctly
4. Test with fresh session (not pre-existing)
