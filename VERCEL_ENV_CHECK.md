# ⚠️ Vercel Environment Variables Required

## The 500 Error is from Missing Environment Variables

Your payment backend (WordPress) is **100% working**.

The error is from **Vercel not having the environment variables**.

---

## Fix: Add These to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: `websitev2`
3. Go to: **Settings → Environment Variables**
4. Add these:

```
WORDPRESS_API_URL=https://api.floradistro.com
WORDPRESS_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WORDPRESS_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```

5. **Redeploy** the site

---

## Why This Happens

The `/api/payment` route tries to call:
```
${process.env.WORDPRESS_API_URL}/wp-admin/admin-ajax.php
```

If `WORDPRESS_API_URL` is undefined on Vercel:
```
undefined/wp-admin/admin-ajax.php → 500 error
```

---

## Proof WordPress Works

Just created order #41619:
- ✅ Payment status: **paid**
- ✅ Card charged successfully
- ✅ All data correct
- ✅ No errors

The WordPress endpoint is perfect! Just needs Vercel to have the env vars.

---

## Quick Fix

**Add the 3 environment variables to Vercel**, then redeploy.

That's it!

