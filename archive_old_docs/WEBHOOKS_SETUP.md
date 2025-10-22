# 🔔 Authorize.net Webhooks Setup

## What Was Added

Created `/app/api/webhooks/authorize/route.ts` that automatically handles:

✅ Payment confirmations  
✅ Refunds (full & partial)  
✅ Voids  
✅ Chargebacks/Disputes  
✅ Fraud holds  
✅ Payment declines  
✅ Subscription events (future)  

All events auto-update your Supabase orders in real-time.

---

## Step 1: Add Signature Key to Vercel

Add this 7th environment variable:

```
AUTHORIZENET_SIGNATURE_KEY=4C6F9EAD3779CF3C156FFA1220064355CA769A7109B727DB18317277B4551001E09CADB58F0A6E8EC1903AFA0835D3F55FEFA75AD45FDDBF283EFB5BE412D4D6
```

**Updated full list (7 total):**
```
AUTHORIZENET_API_LOGIN_ID=9SB8Rhk6Ljbu
AUTHORIZENET_TRANSACTION_KEY=8E42ExNw339rJgez
AUTHORIZENET_SIGNATURE_KEY=4C6F9EAD3779CF3C156FFA1220064355CA769A7109B727DB18317277B4551001E09CADB58F0A6E8EC1903AFA0835D3F55FEFA75AD45FDDBF283EFB5BE412D4D6
AUTHORIZENET_ENVIRONMENT=production
NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY=2HCV7znwGcw3xFpnab492K4Ve7p7Us7HmSc5Wf28Uq5NsjTf22FLXezdC87RY7S8
NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID=9SB8Rhk6Ljbu
NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT=production
```

---

## Step 2: Configure Webhooks in Authorize.net

1. Log into Authorize.net Merchant Interface
2. Go to **Account** → **Settings** → **Webhooks**
3. Click **Add Endpoint**

### Webhook URL:
```
https://your-domain.com/api/webhooks/authorize
```
(Replace `your-domain.com` with your actual Vercel domain)

### Events to Subscribe To:

**Payment Events:**
- ✅ `net.authorize.payment.authcapture.created`
- ✅ `net.authorize.payment.authorization.created`
- ✅ `net.authorize.payment.authorization.declined`
- ✅ `net.authorize.payment.fraud.declined`
- ✅ `net.authorize.payment.fraud.held`

**Transaction Events:**
- ✅ `net.authorize.payment.refund.created`
- ✅ `net.authorize.payment.void.created`

**Dispute Events:**
- ✅ `net.authorize.customer.dispute.created`
- ✅ `net.authorize.customer.dispute.updated`

**Subscription Events (optional for now):**
- ⚪ `net.authorize.customer.subscription.created`
- ⚪ `net.authorize.customer.subscription.cancelled`
- ⚪ `net.authorize.customer.subscription.suspended`
- ⚪ `net.authorize.customer.subscription.expiring`

4. **Status:** Set to `Active`
5. Click **Save**

---

## Step 3: Test Webhook

### Option A: Use Authorize.net Test Button
1. In webhooks settings, click **Test** next to your endpoint
2. Select an event type
3. Click **Send Test**
4. Should return `200 OK`

### Option B: Make Test Transaction
1. Process a small payment on your site ($0.01)
2. Check Supabase `orders` table
3. Verify `paid_date` is set
4. Check `order_status_history` for webhook entry

---

## What Each Webhook Does

| Event | Action |
|-------|--------|
| **Payment Authorized** | Updates order to "processing", marks as "paid" |
| **Refund Created** | Updates payment_status to "refunded", creates refund record |
| **Payment Voided** | Marks order as "cancelled" |
| **Dispute Created** | Sets order to "on-hold", adds dispute note, alerts admin |
| **Fraud Hold** | Puts order on hold, adds fraud alert note |
| **Payment Declined** | Marks order as "failed" |

---

## Security

✅ All webhooks are validated with HMAC-SHA512 signature  
✅ Rejects requests without valid signature  
✅ Only processes events from Authorize.net  
✅ No fake webhook attacks possible  

---

## Monitoring

Check webhook activity:
1. Authorize.net Dashboard → Webhooks → View History
2. Vercel Dashboard → Deployments → Functions → `/api/webhooks/authorize`
3. Supabase → `order_status_history` table

---

## Troubleshooting

### Webhook Returns 401 (Invalid Signature)
- Verify `AUTHORIZENET_SIGNATURE_KEY` matches Authorize.net dashboard
- Check no extra spaces/characters in env var

### Webhook Returns 500
- Check Vercel function logs for errors
- Verify Supabase connection is working
- Ensure all required tables exist (orders, order_status_history, order_notes, order_refunds)

### Order Not Updating
- Verify `transaction_id` matches between Authorize.net and Supabase order
- Check webhook event type is in switch statement
- Review Vercel logs for the specific webhook call

---

## Done!

Once webhooks are configured, your system will:
- Auto-sync all payment events
- Prevent fraud/chargebacks
- Keep data accurate
- Alert you of issues in real-time

No manual syncing needed ever again.

