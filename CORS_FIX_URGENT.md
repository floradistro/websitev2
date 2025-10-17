# URGENT: WordPress CORS Plugin Update Required

## 🔴 Problem Identified

Your WordPress server is returning:
```
access-control-allow-origin: http://localhost:3000
```

But your production site needs:
```
access-control-allow-origin: https://websitev2-ashen.vercel.app
```

**The updated plugin file exists in your repo but hasn't been uploaded to WordPress server.**

---

## ✅ Quick Fix (Choose ONE method)

### Method 1: Direct File Upload (FASTEST - 2 minutes)

1. **Get the file ready**:
   - Location: `/Users/f/Desktop/web2/flora-cors-fix.php`

2. **Option A - If you have SSH access**:
   ```bash
   cd /Users/f/Desktop/web2
   
   # Edit upload-cors-plugin.sh and set your SSH username
   nano upload-cors-plugin.sh
   # Change: SERVER_USER="your-username"
   # To: SERVER_USER="actual-username"
   
   # Run upload script
   ./upload-cors-plugin.sh
   ```

3. **Option B - Using WordPress File Manager**:
   - Install plugin: "File Manager" by Aftabul Islam
   - Navigate to: `/wp-content/plugins/flora-cors-fix/`
   - Upload `flora-cors-fix.php` (overwrite existing)

4. **Option C - Using FTP/SFTP** (FileZilla, Cyberduck, etc.):
   - Connect to `api.floradistro.com`
   - Navigate to: `/wp-content/plugins/flora-cors-fix/`
   - Upload `flora-cors-fix.php` (overwrite existing)

5. **Reactivate plugin**:
   - WordPress Admin → Plugins
   - Deactivate "Flora CORS Fix"
   - Activate "Flora CORS Fix"

6. **Verify**:
   ```bash
   cd /Users/f/Desktop/web2
   ./verify-cors.sh
   ```

---

### Method 2: Quick PHP Code (TEMPORARY - 30 seconds)

Add this to your theme's `functions.php` (via WordPress Admin → Appearance → Theme Editor):

```php
// TEMPORARY CORS FIX - Add at the end of functions.php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $is_allowed = strpos($origin, 'localhost') !== false ||
                      strpos($origin, 'vercel.app') !== false ||
                      strpos($origin, 'floradistro.com') !== false;
        
        if ($is_allowed) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept');
            header('Access-Control-Allow-Credentials: true');
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
        
        return $value;
    }, 15);
}, 15);
```

**This will immediately fix CORS for all Vercel domains.**

---

### Method 3: WP-CLI (If you have shell access)

```bash
# SSH into server
ssh your-user@api.floradistro.com

# Navigate to WordPress
cd /var/www/html

# Deactivate plugin
wp plugin deactivate flora-cors-fix --allow-root

# Remove old plugin
rm -rf wp-content/plugins/flora-cors-fix

# Upload new plugin (from your local machine)
# Then:

# Activate plugin
wp plugin activate flora-cors-fix --allow-root

# Clear cache
wp cache flush --allow-root
```

---

## 🧪 Verification Steps

After updating, test with this command:

```bash
cd /Users/f/Desktop/web2
./verify-cors.sh
```

**Expected output**:
```
Testing: https://websitev2-ashen.vercel.app
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CORS header correct: https://websitev2-ashen.vercel.app
```

---

## 🔍 Why This Happened

1. ✅ We updated the CORS plugin file locally
2. ✅ We committed it to Git
3. ✅ We deployed Next.js to Vercel
4. ❌ We didn't upload the PHP file to WordPress server

**WordPress plugins are PHP files that run on the WordPress server, not in your Next.js app.**

---

## 🎯 What The Updated Plugin Does

### Old Plugin (Currently on Server):
```php
$allowed_origins = [
    'http://localhost:3000',  // ← Only localhost
];
```

### New Plugin (In Your Repo):
```php
$allowed_origins = [
    'http://localhost:3000',
    'https://websitev2-ashen.vercel.app',
    'https://web2-*-floradistros-projects.vercel.app',
    // ... plus smart pattern matching
];

// Auto-allows ANY Vercel deployment URL:
$is_allowed = in_array($origin, $allowed_origins) || 
              (strpos($origin, 'vercel.app') !== false && 
               (strpos($origin, 'floradistros-projects') !== false || 
                strpos($origin, 'websitev2') !== false));
```

---

## 📝 Current Status

| Component | Status | Location |
|-----------|--------|----------|
| Next.js App | ✅ Deployed | Vercel (working) |
| Geolocation API | ✅ Fixed | `/api/geolocation` (working) |
| WordPress CORS | ❌ **Needs Update** | WordPress Server |

---

## 🆘 If You Can't Access WordPress

If you don't have access to update the WordPress plugin, you have two options:

1. **Contact your WordPress host/admin** and send them:
   - File: `/Users/f/Desktop/web2/flora-cors-fix.php`
   - Instructions: "Replace this file at `/wp-content/plugins/flora-cors-fix/flora-cors-fix.php`"

2. **Use our API proxy** (temporary workaround):
   - I can create a Vercel API route that proxies WordPress requests
   - This bypasses CORS by making requests server-side
   - Not ideal but works immediately

---

## 🚀 Next Steps

**RIGHT NOW:**
1. Choose a method above
2. Upload the plugin file
3. Reactivate plugin
4. Run `./verify-cors.sh`
5. Refresh your website

**Time Required:** 2-5 minutes

Let me know if you need help with any step!

