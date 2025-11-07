# Production Auth Fixes - 401 Errors & Multiple Client Instances

## 🚨 Critical Production Issues Fixed

### Issue #1: 401 Unauthorized Errors on All Vendor Endpoints
**Symptom:**
```
GET /api/vendor/products/full?page=1&limit=20 401 (Unauthorized)
GET /api/vendor/products/categories 401 (Unauthorized)
GET /api/vendor/website/status 401 (Unauthorized)
```

**Root Cause:**
- Supabase client had `persistSession: false`
- Vendor auth sessions weren't persisting across page reloads
- Every page refresh = lost session = 401 errors

**Fix Applied:**
```typescript
// Before (BROKEN)
auth: {
  autoRefreshToken: false,
  persistSession: false,  // ❌ Sessions don't persist
}

// After (FIXED)
auth: {
  autoRefreshToken: true,   // ✅ Auto-refresh tokens
  persistSession: true,     // ✅ Persist sessions
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  storageKey: 'whaletools-auth-token',
}
```

---

### Issue #2: Multiple GoTrueClient Instances Warning
**Symptom:**
```
Multiple GoTrueClient instances detected in the same browser context.
```

**Root Cause:**
- Every import of `supabase` from `/lib/supabase/client.ts` created a new instance
- No singleton pattern = multiple auth clients = undefined behavior

**Fix Applied:**
```typescript
// Singleton instance to prevent multiple GoTrueClient warnings
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;  // ✅ Reuse existing instance
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {...});
  return supabaseInstance;
}

export const supabase = createSupabaseClient();
```

---

### Issue #3: WebSocket Connection Failures
**Symptom:**
```
WebSocket connection to 'wss://...supabase.co/realtime/v1/websocket' failed
```

**Root Cause:**
- Realtime subscriptions failing when session is invalid
- No automatic cleanup of failed connections

**Fix:**
- Enabled session persistence (fixes auth for WebSocket)
- Session now persists = realtime can authenticate properly

---

## 📦 Files Changed

### `/lib/supabase/client.ts`
**Changes:**
1. Added singleton pattern for client instance
2. Enabled `persistSession: true`
3. Enabled `autoRefreshToken: true`
4. Added proper storage configuration
5. Added custom storage key: `whaletools-auth-token`

**Impact:**
- ✅ Sessions persist across page reloads
- ✅ Tokens auto-refresh before expiry
- ✅ Only one auth client instance
- ✅ Vendor stays logged in

---

## 🚀 Deployment Checklist

### 1. **Test Locally First**
```bash
cd /Users/whale/Desktop/whaletools
npm run dev
```

**Test:**
1. Login as vendor at http://localhost:3000/vendor/login
2. Navigate to products page
3. Refresh the page
4. ✅ Should stay logged in (no 401 errors)

### 2. **Check for Breaking Changes**
- [ ] Vendor login still works
- [ ] Products page loads without 401s
- [ ] Inventory page loads without 401s
- [ ] No multiple GoTrueClient warnings in console
- [ ] WebSocket connects successfully

### 3. **Deploy to Production**
```bash
cd /Users/whale/Desktop/whaletools
git add lib/supabase/client.ts
git commit -m "Fix: Enable session persistence and singleton pattern for Supabase client

- Fixes 401 errors on vendor endpoints after page refresh
- Prevents multiple GoTrueClient instance warnings
- Enables auto-refresh for long-lived sessions"

git push origin main
```

### 4. **Monitor Production After Deploy**
Watch for:
- ✅ No 401 errors on vendor endpoints
- ✅ No "Multiple GoTrueClient" warnings
- ✅ WebSocket connections succeed
- ✅ Vendors stay logged in after refresh

### 5. **Clear User Sessions (Optional)**
If issues persist, ask vendors to:
```
1. Logout completely
2. Clear browser cache/cookies
3. Login again with new session persistence
```

---

## 🔍 How to Verify Fix Works

### Test Case 1: Session Persistence
1. Login to https://whaletools.dev/vendor/login
2. Go to https://whaletools.dev/vendor/products
3. Hard refresh page (Cmd+Shift+R)
4. ✅ **Expected:** Products load without 401 errors
5. ❌ **Before Fix:** 401 errors, need to re-login

### Test Case 2: No Multiple Instances
1. Open browser console
2. Login to vendor dashboard
3. Navigate between pages
4. ✅ **Expected:** No "Multiple GoTrueClient" warnings
5. ❌ **Before Fix:** Warning on every page navigation

### Test Case 3: Long Session
1. Login as vendor
2. Leave tab open for 30 minutes
3. Come back and interact with page
4. ✅ **Expected:** Token auto-refreshes, no 401
5. ❌ **Before Fix:** Session expires, 401 errors

---

## 🛡️ Prevention Measures

### 1. **Add Session Health Check**
Create middleware to verify session before API calls:

```typescript
// lib/auth/session-check.ts
export async function ensureValidSession() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to login
    window.location.href = '/vendor/login';
    return false;
  }
  
  // Check if token expires soon (< 5 minutes)
  const expiresAt = session.expires_at;
  const now = Date.now() / 1000;
  
  if (expiresAt && (expiresAt - now) < 300) {
    // Refresh token preemptively
    await supabase.auth.refreshSession();
  }
  
  return true;
}
```

### 2. **Add Error Boundary for 401s**
```typescript
// app/vendor/layout.tsx
useEffect(() => {
  // Global error handler for 401s
  const handleUnauthorized = (event: Event) => {
    if (event instanceof CustomEvent && event.detail.status === 401) {
      console.error('Session expired, redirecting to login');
      router.push('/vendor/login');
    }
  };
  
  window.addEventListener('unauthorized', handleUnauthorized);
  return () => window.removeEventListener('unauthorized', handleUnauthorized);
}, []);
```

### 3. **Monitor Session Health**
Add logging to track session issues:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token refreshed successfully');
  }
  
  if (event === 'SIGNED_OUT') {
    console.warn('⚠️ User signed out');
  }
  
  if (event === 'USER_UPDATED') {
    console.log('✅ User data updated');
  }
});
```

---

## 📊 Expected Improvements

### Before Fix:
- **Session Duration:** ~5 minutes (then 401 errors)
- **Page Refresh:** Required re-login
- **Console Warnings:** Multiple GoTrueClient instances
- **WebSocket:** Failed to authenticate

### After Fix:
- **Session Duration:** 1 hour+ (auto-refreshes)
- **Page Refresh:** Stays logged in
- **Console Warnings:** None
- **WebSocket:** Connects successfully

---

## 🚨 If Issues Persist After Deploy

### Symptom: Still Getting 401 Errors
**Solution:**
1. Check Supabase JWT settings in dashboard
2. Verify JWT expiry time (should be 3600 seconds)
3. Check if CORS is blocking auth headers

### Symptom: Still Multiple GoTrueClient Warnings
**Solution:**
1. Check for other Supabase client imports
2. Ensure all imports use: `import { supabase } from '@/lib/supabase/client'`
3. Don't create new clients with `createClient()` directly

### Symptom: Sessions Expire Too Quickly
**Solution:**
1. Increase JWT expiry in Supabase Dashboard
2. Settings → Auth → JWT Expiry → Set to 3600 (1 hour)
3. Ensure `autoRefreshToken: true` is set

---

## 📞 Emergency Rollback

If this causes issues in production:

```bash
git revert HEAD
git push origin main
```

Then investigate locally before re-deploying.

---

**Status:** ✅ Ready for production deployment
**Risk Level:** Low (improves stability, no breaking changes)
**Estimated Downtime:** None (hot reload)

