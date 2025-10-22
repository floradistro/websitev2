# 🔐 Authorize.net Setup Instructions

## Quick Setup (2 minutes)

### 1. Get Your Authorize.net Credentials

Log into your Authorize.net Merchant Interface:
- **API Login ID** & **Transaction Key**: Account → Settings → API Credentials & Keys
- **Public Client Key**: Account → Manage Public Client Key

### 2. Add to Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these 6 variables:

```
AUTHORIZENET_API_LOGIN_ID = your_api_login_id_here
AUTHORIZENET_TRANSACTION_KEY = your_transaction_key_here
AUTHORIZENET_ENVIRONMENT = production

NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY = your_public_client_key_here
NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID = your_api_login_id_here  
NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT = production
```

### 3. Deploy

```bash
git add .
git commit -m "Migrate to Authorize.net + Supabase"
git push origin main
```

Vercel will auto-deploy.

---

## Testing Mode

To test in sandbox first:

1. Get sandbox credentials from Authorize.net sandbox account
2. Set `AUTHORIZENET_ENVIRONMENT = sandbox`
3. Set `NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT = sandbox`
4. Test with card: `4111111111111111`, any CVV/expiry

---

## What Changed

✅ `/app/api/payment/route.ts` - Now uses Authorize.net SDK directly, creates orders in Supabase  
✅ `/app/api/authorize-keys/route.ts` - Reads keys from env vars  
✅ Orders stored in `orders` table with `transaction_id`  
✅ Customers auto-created in `customers` table  
✅ 100% WordPress-free payment processing  

---

## Verify It Works

1. Place test order on site
2. Check Supabase → orders table for new order
3. Verify transaction_id matches Authorize.net dashboard
4. Check customers table for auto-created customer

Done. You're fully migrated.

