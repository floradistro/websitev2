# 🚨 CRITICAL: WordPress CORS Plugin Installation Required

## ❌ Current Issue

**Shipping rates fail on production** with error:
```
Access-Control-Allow-Origin header has value 'http://localhost:3000' 
that is not equal to the supplied origin
```

**Root Cause:** WordPress server is blocking all Vercel domains

---

## ✅ THE FIX

I've created a WordPress plugin: **`flora-cors-fix.php`**

This plugin:
- ✅ Allows all your Vercel production domains
- ✅ Allows localhost for development
- ✅ Auto-detects Vercel preview URLs
- ✅ Handles preflight OPTIONS requests
- ✅ Logs requests for debugging

---

## 📦 Installation Steps

### Step 1: Upload Plugin to WordPress

**Option A: Via WordPress Admin (Easiest)**
1. Go to: https://api.floradistro.com/wp-admin/plugins.php
2. Click "Add New Plugin" → "Upload Plugin"
3. Upload `flora-cors-fix.php`
4. Click "Activate"

**Option B: Via FTP/SSH**
```bash
# Upload to WordPress plugins directory
scp flora-cors-fix.php user@api.floradistro.com:/path/to/wordpress/wp-content/plugins/

# Then activate via wp-cli or WordPress admin
```

**Option C: Copy/Paste to functions.php**
1. Go to: Appearance → Theme File Editor
2. Select `functions.php`
3. Copy the entire contents of `flora-cors-fix.php` (excluding the plugin header)
4. Paste at the bottom of functions.php
5. Save

---

## 🧪 Test After Installation

### Test CORS Preflight:
```bash
curl -X OPTIONS https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
  -H "Origin: https://websitev2-ashen.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### Expected Response:
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: https://websitev2-ashen.vercel.app
< Access-Control-Allow-Methods: POST, GET, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Accept
```

### Test Actual Request:
```bash
curl -X POST https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
  -H "Origin: https://websitev2-ashen.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":646,"quantity":1}],"destination":{"postcode":"28605","country":"US"}}' \
  -v | grep -i "access-control"
```

---

## 🎯 What the Plugin Does

### Allowed Origins:
```
✅ http://localhost:3000                      (Development)
✅ https://websitev2-ashen.vercel.app         (Production)
✅ https://web2-seven-bice.vercel.app         (Production)
✅ https://web2-ml23ngnkq-...vercel.app       (Latest Deploy)
✅ All *-floradistros-projects.vercel.app     (Auto-detect)
✅ https://floradistro.com                    (Custom domain)
✅ https://www.floradistro.com                (Custom domain)
```

### Headers Added:
```php
Access-Control-Allow-Origin: <requesting-origin>
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type, Accept, Authorization
Access-Control-Max-Age: 86400
```

### Special Features:
- **Auto-detects Vercel preview URLs** (any `*-floradistros-projects.vercel.app`)
- **Handles OPTIONS preflight** automatically
- **Logs shipping requests** to WordPress error log
- **24-hour cache** for preflight requests (faster)

---

## 🔍 Debugging

### Check if Plugin is Active:
```bash
# Via wp-cli
wp plugin list | grep cors

# Or check WordPress admin
# Plugins → Installed Plugins → Look for "Flora CORS Fix"
```

### Check WordPress Error Logs:
After activation, the plugin logs all shipping API requests:
```
🚚 Shipping API Request from origin: https://websitev2-ashen.vercel.app
🚚 Request method: POST
🚚 Route: /flora/v1/shipping/calculate
```

**Log Location:** Usually at `/wp-content/debug.log`

To enable logging, add to `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

---

## ⚡ Quick Test (After Plugin Install)

1. Go to: **https://websitev2-ashen.vercel.app/products/646**
2. Enter ZIP: `28605`
3. Click "Get Rates"
4. **Should work!** ✅

---

## 🚨 If Still Not Working

### Check Plugin is Actually Active:
```bash
# SSH into WordPress server
ssh user@api.floradistro.com

# Check if plugin file exists
ls -la /path/to/wordpress/wp-content/plugins/ | grep cors

# Check WordPress error logs
tail -f /path/to/wordpress/wp-content/debug.log
```

### Verify CORS Headers:
```bash
# Test from command line
curl -I -X OPTIONS https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
  -H "Origin: https://websitev2-ashen.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

Look for `Access-Control-Allow-Origin` in response headers.

---

## 📋 File Location

**Plugin File:** `/Users/f/Desktop/web2/flora-cors-fix.php`

**WordPress Destination:** 
```
/wp-content/plugins/flora-cors-fix.php
```

OR paste into:
```
/wp-content/themes/your-theme/functions.php
```

---

## ⚠️ IMPORTANT

**This plugin MUST be installed on the WordPress server** at:
```
https://api.floradistro.com
```

The Next.js site CANNOT fix CORS - it's a **server-side WordPress issue**.

---

## ✅ Status

- [x] Plugin created: `flora-cors-fix.php`
- [ ] Plugin uploaded to WordPress
- [ ] Plugin activated
- [ ] Tested on production
- [ ] Shipping rates working

---

**Next Step:** Upload and activate `flora-cors-fix.php` on your WordPress server!

