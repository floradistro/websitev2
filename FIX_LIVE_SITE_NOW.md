# 🚨 FIX LIVE SITE IMMEDIATELY

## Problem
- 401 errors on all vendor endpoints
- Multiple GoTrueClient warning
- Old session is cached in browser

## ✅ IMMEDIATE FIX (2 minutes)

### On https://whaletools.dev/vendor/products:

1. **Open Browser Console** (F12 or Cmd+Option+I)

2. **Run these commands:**
```javascript
// Clear all auth data
localStorage.clear();
sessionStorage.clear();

// Clear specific Supabase keys
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth')) {
    localStorage.removeItem(key);
  }
});

// Reload the page
window.location.href = '/vendor/login';
```

3. **Or manually:**
   - Go to Application tab → Storage → Local Storage
   - Delete all `sb-*` and `whaletools-auth-token` keys
   - Click "Clear site data"
   - Go to `/vendor/login`

4. **Login fresh** with vendor credentials

5. **Navigate to products page**
   - Should stay logged in ✅
   - No 401 errors ✅
   - No Multiple GoTrueClient warning ✅

---

## Why This Happened

Your browser has an old auth session from BEFORE we enabled session persistence. The old session doesn't have the new structure, causing:
- 401 errors (session not recognized)
- Multiple GoTrueClient (old + new client instances)

Once you clear and login fresh, the new session will:
- ✅ Persist across page refreshes
- ✅ Auto-refresh tokens
- ✅ Use singleton client (no duplicate instances)

---

## Verify It's Fixed

After clearing and re-logging in:

1. ✅ Login at `/vendor/login`
2. ✅ Go to `/vendor/products` (should load without 401)
3. ✅ Refresh page (should stay logged in)
4. ✅ Check console (no Multiple GoTrueClient warning)
5. ✅ Navigate between pages (no 401 errors)

---

## For Other Vendors

Send this message to all vendors:

> "We've updated our authentication system. If you're seeing login issues:
> 1. Clear your browser cache and cookies
> 2. Log out completely
> 3. Log back in
> 
> Your session will now persist across page refreshes."

---

## If Still Not Working

If 401 errors persist after clearing session:

```bash
# Check if deployment is actually live
curl -I https://whaletools.dev/api/vendor/products/categories

# Should return 401 (expected without auth)
# If returns 500 or different error, deployment might have issues
```

Then check Vercel deployment logs for any runtime errors.

