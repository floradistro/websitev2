# WordPress CORS Plugin Update Instructions

## Issue
The WordPress API is still blocking requests from Vercel domains because the CORS plugin on the server has the old configuration.

**Current Error**:
```
Access-Control-Allow-Origin: http://localhost:3000
```

**Needed**: Allow all Vercel domains (websitev2-ashen.vercel.app, etc.)

---

## Quick Fix - Upload Updated Plugin

### Option 1: Using SSH/SCP (Recommended)

```bash
# From your local machine (in the web2 directory)
cd /Users/f/Desktop/web2

# Upload the plugin file to WordPress
# Replace with your actual SSH credentials:
scp flora-cors-fix.php your-user@api.floradistro.com:/var/www/html/wp-content/plugins/flora-cors-fix/flora-cors-fix.php
```

### Option 2: Using WordPress Admin Panel

1. **Download the plugin file** from your local repo:
   - File: `/Users/f/Desktop/web2/flora-cors-fix.php`

2. **Log in to WordPress Admin**:
   - URL: `https://api.floradistro.com/wp-admin`

3. **Deactivate current plugin**:
   - Go to Plugins → Installed Plugins
   - Find "Flora CORS Fix"
   - Click "Deactivate"

4. **Delete old plugin**:
   - Click "Delete" on the deactivated plugin

5. **Upload new version**:
   - Go to Plugins → Add New Plugin
   - Click "Upload Plugin"
   - Choose `flora-cors-fix.php`
   - Click "Install Now"

6. **Activate the plugin**:
   - Click "Activate Plugin"

### Option 3: Using FTP/SFTP

1. Connect to your WordPress server via FTP/SFTP
2. Navigate to: `/wp-content/plugins/flora-cors-fix/`
3. Upload `flora-cors-fix.php` (overwrite existing file)
4. In WordPress admin, deactivate then reactivate the plugin

---

## Verify CORS is Working

### Test 1: Check CORS Headers
```bash
curl -I -H "Origin: https://websitev2-ashen.vercel.app" \
     https://api.floradistro.com/wp-json/flora/v1/shipping/calculate

# Expected output should include:
# Access-Control-Allow-Origin: https://websitev2-ashen.vercel.app
```

### Test 2: Test OPTIONS Preflight
```bash
curl -X OPTIONS \
     -H "Origin: https://websitev2-ashen.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -v \
     https://api.floradistro.com/wp-json/flora/v1/shipping/calculate

# Should return 200 OK with CORS headers
```

### Test 3: Test from Browser
1. Go to your Vercel deployment
2. Open DevTools Console
3. Try to calculate shipping
4. Should see no CORS errors

---

## What Changed in the Plugin

### Before (Old Plugin)
```php
$allowed_origins = [
    'http://localhost:3000',  // ← Only allowed localhost
];
```

### After (New Plugin)
```php
$allowed_origins = [
    'http://localhost:3000',
    'https://websitev2-ashen.vercel.app',
    'https://web2-jz3v3b4ji-floradistros-projects.vercel.app',
    // ... plus wildcard pattern matching for ALL Vercel URLs
];

// Automatic wildcard matching:
$is_allowed = in_array($origin, $allowed_origins) || 
              (strpos($origin, 'vercel.app') !== false && 
               (strpos($origin, 'floradistros-projects') !== false || 
                strpos($origin, 'websitev2') !== false ||
                strpos($origin, 'web2-') !== false));
```

**Key Feature**: Any new Vercel deployment URL will automatically work!

---

## Troubleshooting

### Still Seeing CORS Errors?

1. **Clear WordPress Cache**:
   ```bash
   # SSH into server
   ssh your-user@api.floradistro.com
   
   # Clear WordPress cache
   cd /var/www/html
   wp cache flush --allow-root
   ```

2. **Clear PHP OpCache**:
   ```bash
   # SSH into server
   php -r "opcache_reset();"
   # or restart PHP-FPM
   sudo systemctl restart php8.1-fpm  # adjust PHP version as needed
   ```

3. **Check Plugin is Active**:
   ```bash
   wp plugin list --allow-root
   # Flora CORS Fix should show "active"
   ```

4. **Check WordPress Error Log**:
   ```bash
   tail -f /var/www/html/wp-content/debug.log
   # Should see: 🚚 Shipping API Request from origin: ...
   ```

### WordPress Debug Mode

Enable debugging to see what's happening:

Edit `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

---

## Alternative: Quick PHP Snippet

If you can't upload the plugin, add this to your theme's `functions.php`:

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $is_allowed = strpos($origin, 'localhost:3000') !== false ||
                      strpos($origin, 'vercel.app') !== false ||
                      strpos($origin, 'floradistro.com') !== false;
        
        if ($is_allowed) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
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

---

## Success Checklist

- [ ] Plugin uploaded to WordPress server
- [ ] Plugin activated in WordPress admin
- [ ] WordPress cache cleared
- [ ] PHP OpCache cleared/restarted
- [ ] Tested with `curl` - seeing correct CORS headers
- [ ] Tested from browser - no CORS errors
- [ ] Shipping calculator works on live site

---

## Need Help?

If you're still having issues:

1. **Check the origin in browser**:
   - Open DevTools → Network tab
   - Look at the request to shipping API
   - Check what origin is being sent

2. **Check WordPress logs**:
   - The plugin logs every request
   - Look for: `🚚 Shipping API Request from origin: ...`

3. **Test with simple API**:
   ```bash
   curl https://api.floradistro.com/wp-json/
   # Should return WordPress REST API info
   ```

---

## Contact

If you need SSH access or WordPress admin credentials, the user should provide them separately (not in this file for security).

