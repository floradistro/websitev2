# Manual CORS Fix - Copy & Paste Solution

## 🔥 FASTEST FIX (2 minutes)

### Step 1: Log into WordPress Admin
- URL: https://api.floradistro.com/wp-admin
- Go to: **Appearance → Theme File Editor**

### Step 2: Edit functions.php
- On the right sidebar, click: **Theme Functions (functions.php)**
- Scroll to the **very bottom** of the file

### Step 3: Paste This Code
Add this at the end of functions.php (after the last `?>` or at the end):

```php
// FLORA CORS FIX - Allow all Vercel domains
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $is_allowed = strpos($origin, 'localhost') !== false ||
                      strpos($origin, 'vercel.app') !== false ||
                      strpos($origin, 'floradistro.com') !== false;
        
        if ($is_allowed && $origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
        
        return $value;
    }, 15);
}, 15);
```

### Step 4: Save
- Click **"Update File"** button at the bottom

### Step 5: Test
Run this command to verify:
```bash
cd /Users/f/Desktop/web2 && ./verify-cors.sh
```

**Expected: All green checkmarks ✅**

---

## 🎯 Alternative: File Manager Plugin

If Theme Editor doesn't work:

1. **Install File Manager**:
   - WordPress Admin → Plugins → Add New
   - Search: "File Manager"
   - Install & Activate

2. **Edit functions.php**:
   - WordPress Admin → File Manager
   - Navigate to: `wp-content/themes/YOUR-THEME/functions.php`
   - Right-click → Edit
   - Paste the code from Step 3 above
   - Save

---

## ✅ How to Verify It's Working

### Test 1: Browser Console
1. Go to: https://websitev2-ashen.vercel.app
2. Open DevTools (F12)
3. Go to Console tab
4. Should see NO CORS errors
5. Shipping calculator should work

### Test 2: Command Line
```bash
curl -I -H "Origin: https://websitev2-ashen.vercel.app" \
     https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
     | grep -i "access-control-allow-origin"

# Should return:
# access-control-allow-origin: https://websitev2-ashen.vercel.app
```

---

## 🚨 Troubleshooting

### Error: "You don't have permission to edit this file"
**Solution**: Contact your WordPress admin or use File Manager plugin

### Error: "Parse error" after saving
**Solution**: You pasted the code in the wrong place. Remove it and paste at the very end of the file.

### Still seeing CORS errors?
**Solution**: Clear WordPress cache:
1. If using a cache plugin (WP Super Cache, W3 Total Cache):
   - Go to plugin settings
   - Click "Clear All Cache"
2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

---

## 📞 Need Help?

Take a screenshot of:
1. Your browser console (F12 → Console tab)
2. The error message
3. The functions.php file showing where you pasted the code

The fix should work immediately - no server restart needed!

