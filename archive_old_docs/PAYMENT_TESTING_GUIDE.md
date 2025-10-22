# 💳 Payment Testing Guide

## Admin Dashboard - Orders Management

✅ **Added to Admin:**
- `/admin/orders` - View all orders with filters
- `/admin/orders/[id]` - Detailed order view with payment info

---

## Test Mode Configuration

You mentioned **transaction processing mode is disabled** for testing. This means Authorize.net is in **test mode**.

### Authorize.net Test Cards

Use these test cards for payments:

| Card Number | Type | Result |
|-------------|------|--------|
| `4111111111111111` | Visa | ✅ Approved |
| `4012888818888` | Visa | ✅ Approved |
| `5424000000000015` | Mastercard | ✅ Approved |
| `370000000000002` | Amex | ✅ Approved |
| `4222222222222` | Visa | ❌ Declined |
| `4000300011112220` | Visa | ❌ Card declined (insufficient funds) |

**Any CVV:** 123 or any 3 digits  
**Any Expiry:** Any future date (e.g., 12/25)

---

## Testing Flow

### Step 1: Start Dev Server
```bash
npm run dev
```
Server will be on `http://localhost:3000`

### Step 2: Go to Checkout
1. Browse products: `http://localhost:3000/products`
2. Add item to cart
3. Go to checkout: `http://localhost:3000/checkout`

### Step 3: Fill Out Checkout Form

**Billing Info:**
```
First Name: John
Last Name: Doe
Email: test@floradistro.com
Phone: (555) 123-4567
Address: 123 Test St
City: Los Angeles
State: CA
Zip: 90001
```

**Payment Info:**
```
Card Number: 4111111111111111
Expiry: 12/25
CVV: 123
```

### Step 4: Submit Payment

Click "Place Order" and watch for:
1. ✅ Payment processing spinner
2. ✅ Redirect to order confirmation `/track?orderId=...`
3. ✅ Order number displayed

### Step 5: Verify in Admin

1. Go to `http://localhost:3000/admin/login`
2. Login with admin credentials
3. Go to **Orders** tab (new menu item)
4. You should see your test order:
   - Status: **PROCESSING**
   - Payment: **PAID**
   - Transaction ID: Shows Authorize.net transaction ID
   - Total amount displayed

5. Click **View** to see order details:
   - Order items
   - Customer info
   - Payment transaction ID
   - Addresses

### Step 6: Verify in Supabase

Open Supabase Dashboard → Tables:

**Check `orders` table:**
- New order exists
- `transaction_id` populated
- `payment_status` = 'paid'
- `status` = 'processing'
- `total_amount` correct

**Check `order_items` table:**
- Items linked to order_id
- Product details saved

**Check `customers` table:**
- Customer auto-created with email
- Billing address saved

---

## Test Scenarios

### ✅ Successful Payment
1. Use card: `4111111111111111`
2. Complete checkout
3. Verify order in admin shows "PAID" and "PROCESSING"
4. Check transaction_id is present

### ❌ Declined Payment
1. Use card: `4222222222222`
2. Try to complete checkout
3. Should see error message
4. No order created in Supabase

### 🔁 Multiple Items
1. Add 3+ products to cart
2. Mix pickup and delivery items
3. Complete checkout
4. Verify all items appear in admin order details

### 📦 Pickup vs Delivery
1. Test pickup-only order
2. Test delivery-only order
3. Test mixed order
4. Verify `delivery_type` in admin

---

## What to Verify

### Frontend Checkout:
- [ ] Accept.js loads (payment form appears)
- [ ] Card tokenization works (no raw card data sent)
- [ ] Successful payment redirects to order tracking
- [ ] Failed payment shows error message

### Backend Payment API:
- [ ] `/api/payment` charges card via Authorize.net
- [ ] Order created in Supabase `orders` table
- [ ] Order items created in `order_items` table
- [ ] Customer auto-created if new email
- [ ] Transaction ID stored

### Admin Dashboard:
- [ ] Orders page shows all orders
- [ ] Filters work (status, payment)
- [ ] Search works (order number, email, transaction ID)
- [ ] Order detail page shows complete info
- [ ] Transaction ID displayed correctly

### Supabase Database:
- [ ] Orders have correct data
- [ ] Customers linked properly
- [ ] Payment status accurate
- [ ] Transaction IDs present

---

## Expected Results

### After Test Order:

**Admin Dashboard (`/admin/orders`):**
```
Order: FD-1729999999999
Customer: test@floradistro.com
Status: PROCESSING
Payment: PAID
Total: $XX.XX
Transaction ID: 40123456789
```

**Supabase `orders` Table:**
```json
{
  "id": "uuid-here",
  "order_number": "FD-1729999999999",
  "customer_id": "customer-uuid",
  "status": "processing",
  "payment_status": "paid",
  "total_amount": 100.00,
  "transaction_id": "40123456789",
  "payment_method": "authorize_net",
  "order_date": "2025-10-22T..."
}
```

**Authorize.net Dashboard:**
- Transaction appears in Transactions list
- Amount matches order total
- Customer email shown
- Status: "Authorized/Pending Capture" or "Captured"

---

## Common Issues

### 1. "Payment Keys Not Configured"
**Fix:** Environment variables not set locally.

Create `.env.local`:
```env
AUTHORIZENET_API_LOGIN_ID=9SB8Rhk6Ljbu
AUTHORIZENET_TRANSACTION_KEY=8E42ExNw339rJgez
AUTHORIZENET_ENVIRONMENT=production
NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY=2HCV7znwGcw3xFpnab492K4Ve7p7Us7HmSc5Wf28Uq5NsjTf22FLXezdC87RY7S8
NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID=9SB8Rhk6Ljbu
NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT=production
```

Restart dev server: `npm run dev`

### 2. "Invalid Card Number"
- Make sure using test card: `4111111111111111`
- Check Authorize.net is in test/sandbox mode

### 3. Order Not Appearing in Admin
- Check Supabase connection
- Verify API call succeeded (check browser console)
- Check `/api/supabase/orders` endpoint works

### 4. Transaction ID Missing
- Payment may have failed
- Check Authorize.net dashboard for transaction
- Verify Authorize.net credentials correct

---

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Check admin dashboard shows orders correctly
3. ✅ Confirm webhooks are configured (WEBHOOKS_SETUP.md)
4. ✅ Deploy to Vercel with production env vars
5. ✅ Test with real card in production (small amount)
6. ✅ Monitor first real orders in admin dashboard

---

## Quick Test Commands

```bash
# Check dev server
curl http://localhost:3000/api/health

# Check if orders API works
curl http://localhost:3000/api/supabase/orders

# Check Authorize.net keys endpoint
curl http://localhost:3000/api/authorize-keys
```

---

## Support

If payment fails, check in order:
1. Browser console for errors
2. Vercel function logs
3. Authorize.net dashboard → Transactions
4. Supabase logs
5. Environment variables are set correctly

Ready to test! 🚀

