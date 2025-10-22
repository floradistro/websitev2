# 🧪 Test Payment System NOW

## Quick Setup (30 seconds)

The dev server is starting with Authorize.net credentials loaded.

---

## Step-by-Step Testing

### 1. Open Admin Dashboard
```
http://localhost:3000/admin/login
```

Login with your admin credentials, then click **"Orders"** in the sidebar (new menu item).

---

### 2. Open Checkout in New Tab
```
http://localhost:3000/checkout
```

If cart is empty, add a product first from:
```
http://localhost:3000/products
```

---

### 3. Fill Checkout Form

**Billing:**
- First Name: `Test`
- Last Name: `User`
- Email: `test@floradistro.com`
- Phone: `5551234567`
- Address: `123 Test St`
- City: `Los Angeles`
- State: `CA`
- Zip: `90001`

**Payment (Authorize.net Test Card):**
- Card: `4111111111111111`
- Expiry: `12/25`
- CVV: `123`

---

### 4. Place Order

Click **"Place Order"**

You should see:
1. Processing spinner
2. Redirect to `/track?orderId=...`
3. Order confirmation with order number like `FD-1729...`

---

### 5. Check Admin Dashboard

Go back to the admin tab (`/admin/orders`)

Click **Refresh** button

You should see your new order:
- Order Number: `FD-1729...`
- Customer: `test@floradistro.com`
- Status: `PROCESSING` (blue)
- Payment: `PAID` (green)
- Total: Whatever amount you ordered
- Transaction ID: Shows Authorize.net transaction (green code)

Click **"View"** to see full order details.

---

### 6. Verify in Supabase

Open Supabase Dashboard → Table Editor → `orders`

Find your order by `order_number` starting with `FD-`

Verify:
- ✅ `transaction_id` is populated
- ✅ `payment_status` = `paid`
- ✅ `status` = `processing`
- ✅ `customer_id` linked to customers table

---

### 7. Check Authorize.net Dashboard

Log into Authorize.net Merchant Interface → Transactions

Your test transaction should appear:
- Amount matches your order
- Status: "Authorized/Pending Capture" (test mode)
- Customer email: `test@floradistro.com`

---

## Test Scenarios

### ✅ Test 1: Successful Payment
Card: `4111111111111111`
**Expected:** Order created, shows in admin, transaction ID present

### ❌ Test 2: Declined Card
Card: `4222222222222`
**Expected:** Error message, no order created

### 🔁 Test 3: Multiple Items
Add 3+ products, complete checkout
**Expected:** All items show in admin order details

---

## What You're Testing

1. **Frontend Integration**
   - Accept.js tokenizes card securely
   - Checkout form validates
   - Success/error handling

2. **Payment API**
   - `/api/payment` calls Authorize.net SDK
   - Charges card successfully
   - Returns transaction ID

3. **Database Integration**
   - Order created in Supabase
   - Customer auto-created/linked
   - Order items saved
   - Transaction ID stored

4. **Admin Dashboard**
   - Orders list displays correctly
   - Filters work
   - Order details complete
   - Transaction IDs visible

---

## Expected Success Output

**Browser Console (no errors):**
```
✓ Payment successful
✓ Order created: FD-1729999999
✓ Redirecting to tracking...
```

**Admin Orders Page:**
```
[Green PAID badge] [Blue PROCESSING badge]
Order: FD-1729999999
Customer: test@floradistro.com
Total: $XX.XX
Transaction: 40123456789... (green)
```

**Supabase Orders Table:**
```json
{
  "order_number": "FD-1729999999",
  "payment_status": "paid",
  "status": "processing",
  "transaction_id": "40123456789",
  "total_amount": XX.XX
}
```

---

## If Something Fails

### "Authorize.net keys not configured"
- Restart dev server (it's loading env vars on startup)
- Wait 10 seconds for server to fully start

### "Payment failed"
- Check browser console for specific error
- Verify test card: `4111111111111111`
- Ensure Authorize.net is in test mode

### Order not in admin
- Check browser console - did payment API succeed?
- Refresh admin page
- Check `/api/supabase/orders` directly
- Verify Supabase connection working

### No transaction ID
- Payment may have been declined
- Check Authorize.net dashboard
- Try different test card

---

## Server Status

Dev server running on: **http://localhost:3000**

Check health:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": { "connected": true }
}
```

---

## Ready to Test!

1. **Admin:** http://localhost:3000/admin/orders
2. **Checkout:** http://localhost:3000/checkout
3. **Test Card:** `4111111111111111`

Let's verify the full payment flow works end-to-end! 🚀

