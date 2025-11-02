# Vercel Environment Variables Setup

## Production Issue: API Routes Not Working

The live site is not fetching API data because **environment variables are not configured in Vercel**.

## Required Environment Variables

Go to your Vercel project settings → Environment Variables and add:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Value**: `https://uaednwpxursknmwdeejn.supabase.co`
- **Environments**: Production, Preview, Development
- **Required**: ✅ Yes

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Value**: Your Supabase anonymous/public key
- **Environments**: Production, Preview, Development
- **Required**: ✅ Yes
- **Get from**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Value**: Your Supabase service role key (219 characters)
- **Environments**: Production, Preview, Development
- **Required**: ✅ Yes (for API routes)
- **Get from**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **⚠️ CRITICAL**: This is the one that's missing and causing the production failure

## How to Add in Vercel

1. Go to https://vercel.com/your-username/your-project/settings/environment-variables
2. Click "Add New"
3. Enter variable name (e.g., `SUPABASE_SERVICE_ROLE_KEY`)
4. Enter value
5. Select which environments (Production, Preview, Development)
6. Click "Save"
7. **Redeploy** your application for changes to take effect

## Quick Test

After adding variables and redeploying, test:

```bash
# Check health endpoint
curl https://your-domain.vercel.app/api/health

# Expected response if working:
{
  "timestamp": "2025-11-01T...",
  "environment": "production",
  "checks": {
    "supabaseUrl": true,
    "supabaseAnonKey": true,
    "supabaseServiceKey": true  ← This should be true
  },
  "status": "ok"
}
```

## Why This Broke

API routes in `/app/api/pos/registers/route.ts` use `getServiceSupabase()` which requires `SUPABASE_SERVICE_ROLE_KEY`:

```typescript
const supabase = getServiceSupabase(); // ← Throws error if env var missing
```

When the environment variable is missing:
- API throws: `Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')`
- Frontend receives 500 error
- No registers load
- Console shows: "NO REGISTERS FOUND"

## What Works Locally

Local works because `.env.local` file contains all variables. Vercel deployment needs them separately configured in Vercel's settings.

## After Fixing

Once environment variables are added in Vercel:
1. Redeploy the application
2. Registers will load correctly
3. Atomic session management will work
4. All API endpoints will function

## Still Not Working?

If environment variables are set but it still doesn't work:

1. **Check deployment logs**: Vercel Dashboard → Deployments → Latest → Build Logs
2. **Check function logs**: Vercel Dashboard → Deployments → Latest → Function Logs
3. **Verify variables are saved**: Settings → Environment Variables (should show 3 variables)
4. **Force redeploy**: Deployments → Latest → ... → Redeploy
5. **Test health endpoint**: `curl https://your-domain.vercel.app/api/health`
