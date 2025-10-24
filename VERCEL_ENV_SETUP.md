# Vercel Environment Variables Required

## Critical Environment Variables for Production

These environment variables MUST be set in your Vercel project settings for the storefront to work correctly:

### 1. Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://uaednwpxursknmwdeejn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Why needed:**
- `NEXT_PUBLIC_SUPABASE_URL`: Client-side Supabase connection
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for client-side queries
- `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL** - Middleware uses this to lookup vendors by domain/slug. Without this, all storefront product pages will 404!

### 2. Payment Gateway (Optional - for checkout)

```bash
AUTHORIZENET_API_LOGIN_ID=<your-api-login-id>
AUTHORIZENET_TRANSACTION_KEY=<your-transaction-key>
AUTHORIZENET_SIGNATURE_KEY=<your-signature-key>
AUTHORIZENET_ENVIRONMENT=production
NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY=<your-client-key>
NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID=<your-api-login-id>
NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT=production
```

## How to Set on Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (`floradistro/websitev2`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Set them for **Production**, **Preview**, and **Development** environments
6. Redeploy after adding variables

## Finding Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select project: `uaednwpxursknmwdeejn`
3. Go to **Settings** → **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

## Current Issue

**Symptom:** Product pages work locally but show 404 on live site
**Root Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` on Vercel
**Impact:** Middleware can't lookup vendor from `?vendor=flora-distro` parameter, returns 404

**Fix:** Add the environment variables to Vercel and redeploy.

