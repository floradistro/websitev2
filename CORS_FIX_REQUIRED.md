# 🚨 CORS FIX REQUIRED ON WORDPRESS

## ❌ Current Error

```
Access to fetch at 'https://api.floradistro.com/wp-json/flora/v1/shipping/calculate' 
from origin 'https://websitev2-ashen.vercel.app' has been blocked by CORS policy: 

The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' 
that is not equal to the supplied origin.
```

---

## 🎯 The Problem

The WordPress API **shipping endpoint** is configured to **ONLY allow** `http://localhost:3000` as the origin.

Production domains like:
- `https://websitev2-ashen.vercel.app`
- `https://web2-seven-bice.vercel.app`
- `https://floradistro.com` (if you add custom domain)

Are all **BLOCKED** by CORS.

---

## ✅ The Fix (WordPress Side)

You need to update the CORS headers in the WordPress shipping API plugin/code.

### Location: WordPress Server
**File:** Likely in your shipping plugin or functions.php

### Current Code (Wrong):
```php
header('Access-Control-Allow-Origin: http://localhost:3000');
```

### Fixed Code (Correct):
```php
// Allow multiple origins
$allowed_origins = [
    'http://localhost:3000',
    'https://websitev2-ashen.vercel.app',
    'https://web2-seven-bice.vercel.app',
    'https://floradistro.com',
    'https://www.floradistro.com'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

### OR Use Wildcard (Less Secure but Works):
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
```

---

## 🔍 Where to Add This

### Option 1: In Your Shipping Plugin
Find the file that handles `/wp-json/flora/v1/shipping/calculate`

Look for:
```php
register_rest_route('flora/v1', '/shipping/calculate', [
    'methods' => 'POST',
    'callback' => 'calculate_shipping_callback',
    'permission_callback' => '__return_true'
]);
```

Add CORS headers in the callback:
```php
function calculate_shipping_callback($request) {
    // ADD CORS HEADERS HERE
    $allowed_origins = [
        'http://localhost:3000',
        'https://websitev2-ashen.vercel.app',
        'https://web2-seven-bice.vercel.app'
    ];
    
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    
    // Your existing shipping calculation code...
}
```

### Option 2: In functions.php (Global Fix)
```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    add_filter('rest_pre_serve_request', function($value) {
        $allowed_origins = [
            'http://localhost:3000',
            'https://websitev2-ashen.vercel.app',
            'https://web2-seven-bice.vercel.app',
            'https://floradistro.com',
            'https://www.floradistro.com'
        ];
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
        }
        
        return $value;
    });
}, 15);
```

### Option 3: .htaccess (Apache)
```apache
<IfModule mod_headers.c>
    SetEnvIf Origin "^http(s)?://(localhost:3000|websitev2-ashen\.vercel\.app|web2-seven-bice\.vercel\.app|floradistro\.com|www\.floradistro\.com)$" AccessControlAllowOrigin=$0
    Header set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header set Access-Control-Allow-Methods "POST, GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Accept"
</IfModule>
```

---

## 🧪 Test After Fix

### Test Command:
```bash
curl -X OPTIONS https://api.floradistro.com/wp-json/flora/v1/shipping/calculate \
  -H "Origin: https://web2-seven-bice.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Expected Response Headers:
```
Access-Control-Allow-Origin: https://web2-seven-bice.vercel.app
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

---

## 🚀 Quick WordPress Admin Fix

1. **Log into WordPress:** https://api.floradistro.com/wp-admin
2. **Go to:** Plugins → Flora Shipping Plugin (or wherever your shipping endpoint is)
3. **Find:** The file that registers `/flora/v1/shipping/calculate`
4. **Add:** CORS headers to allow your Vercel domains
5. **Save** and test

---

## 📋 Domains to Whitelist

```
http://localhost:3000                    ← Development
https://websitev2-ashen.vercel.app       ← Production
https://web2-seven-bice.vercel.app       ← Production  
https://floradistro.com                  ← Custom domain (future)
https://www.floradistro.com              ← Custom domain (future)
```

---

## ⚡ Temporary Workaround (Testing Only)

**NOT RECOMMENDED FOR PRODUCTION** - But if you just want to test:

```php
header('Access-Control-Allow-Origin: *');
```

This allows **ALL** origins. Use only for testing, then implement proper whitelist.

---

## 🔍 What I Fixed on Frontend

✅ Stopped geolocation spam (100+ failed requests)
- Added sessionStorage cache to prevent retries
- Silently fails after first attempt
- No more console spam

✅ Mobile zoom fixed
- 16px font on all inputs
- Viewport meta tag configured
- No zoom on tap

✅ Environment variables added
- All WordPress API keys in Vercel
- Build successful
- Site deployed

---

## ❗ Action Required

**You need to fix the CORS headers on the WordPress server.**

The shipping rates endpoint `/wp-json/flora/v1/shipping/calculate` must allow:
- Your Vercel production domains
- Your custom domain (if applicable)

Without this fix, shipping rates **will NOT work** on the live site.

---

**Status:** ⏳ WAITING FOR WORDPRESS CORS FIX
**Last Updated:** October 17, 2025

