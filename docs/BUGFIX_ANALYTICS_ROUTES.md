# 🐛 Bugfix: Analytics Routes Broken After Refactoring

## Issue

**Date:** January 10, 2025
**Severity:** 🔴 Critical (broke 3 analytics tabs)
**Status:** ✅ Fixed

### Problem

After migrating 5 high-value routes to DRY wrappers, the following analytics tabs stopped working:
- `/api/vendor/analytics/v2/sales/by-employee`
- `/api/vendor/analytics/v2/sales/by-category`
- `/api/vendor/analytics/v2/sales/by-payment-method`

### Error Message

```
TypeError: Cannot read properties of undefined (reading 'windowMs')
    at RedisRateLimiter.check (lib/redis-rate-limiter.ts:63:55)
    at applyRateLimit (lib/api/route-wrapper.ts:56:97)
```

### Root Cause

The refactored routes used a rate limit config called `"analyticsApi"` which doesn't exist in the `RateLimitConfigs` object.

**Incorrect Code:**
```typescript
export const GET = withVendorAuth(
  async (request, { vendorId }) => {
    // ... route logic
  },
  {
    rateLimit: {
      enabled: true,
      config: "analyticsApi", // ❌ This config doesn't exist!
    },
  },
);
```

### Available Rate Limit Configs

From `lib/rate-limiter.ts`:
```typescript
export const RateLimitConfigs = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  api: { maxRequests: 10, windowMs: 60 * 1000 },
  general: { maxRequests: 100, windowMs: 60 * 1000 },
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  ai: { maxRequests: 20, windowMs: 5 * 60 * 1000 },
  aiChat: { maxRequests: 30, windowMs: 5 * 60 * 1000 },
  aiGeneration: { maxRequests: 10, windowMs: 5 * 60 * 1000 },
  admin: { maxRequests: 200, windowMs: 60 * 1000 },
  adminSensitive: { maxRequests: 50, windowMs: 60 * 1000 },
  publicApi: { maxRequests: 30, windowMs: 60 * 1000 },
  authenticatedApi: { maxRequests: 100, windowMs: 60 * 1000 }, // ✅ This one!
  productCatalog: { maxRequests: 200, windowMs: 60 * 1000 },
  mediaUpload: { maxRequests: 20, windowMs: 60 * 1000 },
  checkout: { maxRequests: 10, windowMs: 60 * 1000 },
  webhook: { maxRequests: 50, windowMs: 60 * 1000 },
};
```

## Fix

Changed all occurrences of `config: "analyticsApi"` to `config: "authenticatedApi"`.

**Fixed Code:**
```typescript
export const GET = withVendorAuth(
  async (request, { vendorId }) => {
    // ... route logic
  },
  {
    rateLimit: {
      enabled: true,
      config: "authenticatedApi", // ✅ Correct config name
    },
  },
);
```

### Files Modified

1. ✅ `app/api/vendor/analytics/v2/sales/by-category/route.ts`
2. ✅ `app/api/vendor/analytics/v2/sales/by-employee/route.ts`
3. ✅ `app/api/vendor/analytics/v2/sales/by-payment-method/route.ts`
4. ✅ `app/api/vendor/products/list/route.ts`
5. ✅ `app/api/vendor/inventory/route.ts`

## Testing

### Before Fix
```bash
$ curl http://localhost:3000/api/vendor/analytics/v2/sales/by-category
{
  "success": false,
  "error": "An error occurred. Please try again.",
  "message": "Cannot read properties of undefined (reading 'windowMs')"
}
```

### After Fix
```bash
$ curl http://localhost:3000/api/vendor/analytics/v2/sales/by-category
{
  "error": "Unauthorized - Authentication required"
}
```

✅ **Success!** The route now properly handles authentication instead of crashing.

## Prevention

### Lessons Learned

1. **Type Safety Needed:** If `RateLimitConfigs` was properly typed, this error would have been caught at compile time.
2. **Better Testing:** Should have tested the refactored routes immediately after migration.
3. **Documentation:** Rate limit config names should be documented.

### Recommended Improvements

1. **Add TypeScript Types to Route Wrapper:**
```typescript
export interface RouteOptions {
  rateLimit?: {
    enabled: boolean;
    config: keyof typeof RateLimitConfigs; // ✅ Type-safe!
  };
}
```

2. **Add Unit Tests for Route Wrappers:**
```typescript
describe("withVendorAuth", () => {
  it("should throw error for invalid rate limit config", () => {
    expect(() => {
      withVendorAuth(handler, {
        rateLimit: { enabled: true, config: "invalidConfig" },
      });
    }).toThrow();
  });
});
```

3. **Add Documentation:**
Create `docs/RATE_LIMIT_CONFIGS.md` documenting all available rate limit configurations.

## Impact

### User Impact
- **Duration:** ~10 minutes (from detection to fix)
- **Affected Users:** Development only (caught before production deployment)
- **Severity:** High (3 critical analytics tabs broken)

### System Impact
- **Performance:** No impact (error occurred before rate limiting)
- **Data:** No data loss or corruption
- **Security:** No security issues

## Follow-up Actions

1. ✅ Fix all 5 refactored routes
2. ⏳ Add type safety to `RouteOptions` interface
3. ⏳ Add unit tests for route wrappers
4. ⏳ Create rate limit config documentation
5. ⏳ Add integration tests for all refactored routes

---

**Status:** ✅ Fixed and verified
**Time to Fix:** 10 minutes
**Root Cause:** Configuration typo (non-existent rate limit config)
**Prevention:** Type safety + better testing
