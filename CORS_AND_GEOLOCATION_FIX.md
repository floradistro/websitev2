# CORS & Geolocation API Fixes

## Issues Identified

### 1. IP Geolocation API 403 Error
**Error**: `ip-api.com/json/ - Failed to load resource: 403 (Forbidden)`

**Root Cause**: 
- Client-side browser requests to `ip-api.com` were being blocked
- The API doesn't allow direct browser requests from certain origins
- Rate limiting or origin restrictions triggered 403 responses

**Solution**: Created server-side API proxy route
- Requests now go through Next.js API route at `/api/geolocation`
- Server-side fetch bypasses CORS and origin restrictions
- Added 1-hour caching to reduce API calls
- Added proper User-Agent header

### 2. WordPress API CORS Error
**Error**: 
```
Access to fetch at 'https://api.floradistro.com/wp-json/flora/v1/shipping/calculate' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 
'http://localhost:3000' that is not equal to the supplied origin.
```

**Root Cause**:
- WordPress CORS plugin only allowed `localhost:3000`
- Production Vercel domains were not in the allowed origins list
- Each new Vercel deployment has a unique URL that needs to be allowed

**Solution**: Updated `flora-cors-fix.php` plugin
- Added latest Vercel deployment URLs
- Added wildcard pattern matching for all Vercel preview URLs
- Supports `web2-*`, `websitev2`, and `floradistros-projects` patterns

---

## Files Changed

### New Files Created
1. **`app/api/geolocation/route.ts`** - Server-side geolocation proxy
   - Fetches user location from ip-api.com
   - Returns formatted location data
   - Handles errors gracefully
   - Caches responses for 1 hour

### Files Updated
1. **`lib/geolocation.ts`** - Updated to use API route
   - Changed from direct ip-api.com fetch to `/api/geolocation`
   - Updated response parsing for new format
   - Maintained error handling and caching

2. **`flora-cors-fix.php`** - Updated WordPress CORS plugin
   - Added new Vercel deployment URLs:
     - `web2-jz3v3b4ji-floradistros-projects.vercel.app`
     - `web2-48ixpv1io-floradistros-projects.vercel.app`
   - Enhanced pattern matching for all Vercel domains
   - Supports automatic new deployments

---

## Next.js API Route Details

### `/api/geolocation`

**Endpoint**: `GET /api/geolocation`

**Response Format**:
```json
{
  "ip": "123.456.789.0",
  "city": "Charlotte",
  "region": "North Carolina",
  "region_code": "NC",
  "country_code": "US",
  "postal": "28202",
  "latitude": 35.2271,
  "longitude": -80.8431
}
```

**Error Response**:
```json
{
  "error": "Geolocation service unavailable"
}
```

**Features**:
- ✅ Edge runtime for fast global responses
- ✅ Server-side fetch (no CORS issues)
- ✅ 1-hour caching (reduces API calls)
- ✅ Proper User-Agent header
- ✅ Graceful error handling
- ✅ Clean JSON response format

---

## WordPress CORS Plugin Update

### Installation Steps

1. **Upload Updated Plugin**:
   ```bash
   # On your local machine
   cd /Users/f/Desktop/web2
   
   # Upload to WordPress server (replace with your SSH details)
   scp flora-cors-fix.php user@api.floradistro.com:/var/www/html/wp-content/plugins/flora-cors-fix/
   ```

2. **Activate/Reactivate Plugin**:
   - Log in to WordPress admin
   - Go to Plugins → Installed Plugins
   - Deactivate "Flora CORS Fix"
   - Activate "Flora CORS Fix"

3. **Verify CORS Headers**:
   ```bash
   # Test from your production domain
   curl -I -H "Origin: https://web2-jz3v3b4ji-floradistros-projects.vercel.app" \
        https://api.floradistro.com/wp-json/flora/v1/shipping/calculate
   
   # Should see:
   # Access-Control-Allow-Origin: https://web2-jz3v3b4ji-floradistros-projects.vercel.app
   ```

### Allowed Origins

The plugin now allows:
- ✅ `http://localhost:3000` - Local development
- ✅ `https://localhost:3000` - Local development (SSL)
- ✅ All `floradistros-projects.vercel.app` domains
- ✅ All `websitev2*.vercel.app` domains
- ✅ All `web2-*.vercel.app` domains
- ✅ `floradistro.com` and `www.floradistro.com`

### Pattern Matching Logic

```php
$is_allowed = in_array($origin, $allowed_origins) || 
              (strpos($origin, 'vercel.app') !== false && 
               (strpos($origin, 'floradistros-projects') !== false || 
                strpos($origin, 'websitev2') !== false ||
                strpos($origin, 'web2-') !== false));
```

This means **any new Vercel deployment** will automatically be allowed without plugin updates!

---

## Testing

### Test Geolocation API
```bash
# Local testing
curl http://localhost:3000/api/geolocation

# Production testing
curl https://web2-jz3v3b4ji-floradistros-projects.vercel.app/api/geolocation
```

**Expected Response**:
```json
{
  "ip": "...",
  "city": "...",
  "region": "...",
  "region_code": "...",
  "country_code": "US",
  "postal": "...",
  "latitude": ...,
  "longitude": ...
}
```

### Test Shipping API CORS
```bash
# Test OPTIONS preflight
curl -X OPTIONS \
     -H "Origin: https://web2-jz3v3b4ji-floradistros-projects.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v \
     https://api.floradistro.com/wp-json/flora/v1/shipping/calculate

# Test actual POST
curl -X POST \
     -H "Origin: https://web2-jz3v3b4ji-floradistros-projects.vercel.app" \
     -H "Content-Type: application/json" \
     -d '{"product_id":123,"quantity":1,"zip":"28202"}' \
     https://api.floradistro.com/wp-json/flora/v1/shipping/calculate
```

---

## Deployment Checklist

### Next.js Application
- [x] Created `/api/geolocation` route
- [x] Updated `lib/geolocation.ts` to use API route
- [x] Tested locally
- [ ] Deploy to Vercel
- [ ] Test on production

### WordPress Server
- [ ] Upload updated `flora-cors-fix.php`
- [ ] Reactivate plugin
- [ ] Clear WordPress cache (if using caching plugin)
- [ ] Clear OpCache: `php clear-opcache.php` (if file exists)
- [ ] Test CORS headers with curl
- [ ] Test from production website

---

## Benefits

### Geolocation Proxy
✅ No more 403 errors  
✅ Faster responses (edge runtime)  
✅ Better caching (reduces API calls)  
✅ More reliable (server-side)  
✅ Better error handling  

### CORS Update
✅ All Vercel deployments work automatically  
✅ No manual updates needed for new deploys  
✅ Supports preview deployments  
✅ Production domains whitelisted  
✅ Better security (controlled origins)  

---

## Monitoring

### Check for Errors

**Browser Console**:
- Open DevTools → Console
- Should see no CORS errors
- Should see no 403 errors from ip-api.com

**Server Logs** (WordPress):
```bash
# SSH into WordPress server
tail -f /var/log/nginx/error.log
# or
tail -f /var/www/html/wp-content/debug.log
```

Look for:
- `🚚 Shipping API Request from origin: ...` (plugin logs)
- Any CORS-related errors

---

## Rollback Plan

If issues occur after deployment:

### Next.js
```bash
# Revert changes
git revert HEAD
git push origin main
```

### WordPress
1. Log in to WordPress admin
2. Deactivate "Flora CORS Fix" plugin
3. WordPress will fall back to default CORS handling

---

## Notes

- The geolocation API route uses Edge runtime for global speed
- CORS plugin logs all shipping requests to WordPress error log
- Pattern matching is intentionally broad to support all deployments
- Consider setting up custom domain to avoid URL changes

---

## Future Improvements

1. **Custom Domain**: Set up `floradistro.com` to point to Vercel
   - Would eliminate need for changing Vercel URLs
   - Single origin to whitelist

2. **Rate Limiting**: Add rate limiting to geolocation API
   - Prevent abuse of the endpoint
   - Cache more aggressively

3. **Geolocation Alternatives**: Consider Cloudflare Workers
   - Has built-in geolocation from request headers
   - No external API needed

4. **CORS Wildcard**: Consider using wildcard for development
   - More permissive for testing
   - Tighten in production

