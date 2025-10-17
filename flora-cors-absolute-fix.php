<?php
/**
 * Flora CORS Absolute Fix
 * Must-Use Plugin - Runs FIRST, overrides EVERYTHING
 * Place in: wp-content/mu-plugins/
 */

// Run BEFORE any other plugins load
add_action('init', function() {
    // Set CORS headers immediately
    $allowed_origins = [
        'http://localhost:3000',
        'https://localhost:3000',
        'https://websitev2-ashen.vercel.app',
        'https://web2-seven-bice.vercel.app',
        'https://floradistro.com',
        'https://www.floradistro.com',
    ];
    
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Check if Vercel preview
    $is_vercel = (strpos($origin, 'vercel.app') !== false && 
                  strpos($origin, 'floradistros-projects') !== false);
    
    if ($origin && (in_array($origin, $allowed_origins) || $is_vercel)) {
        header('Access-Control-Allow-Origin: ' . $origin, true);
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH', true);
        header('Access-Control-Allow-Credentials: true', true);
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce, X-Requested-With', true);
        header('Access-Control-Max-Age: 86400', true);
    }
    
    // Handle OPTIONS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit;
    }
}, 1);

// Also hook into send_headers (WordPress action)
add_action('send_headers', function() {
    $allowed_origins = [
        'http://localhost:3000',
        'https://localhost:3000',
        'https://websitev2-ashen.vercel.app',
        'https://web2-seven-bice.vercel.app',
        'https://floradistro.com',
        'https://www.floradistro.com',
    ];
    
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    $is_vercel = (strpos($origin, 'vercel.app') !== false && 
                  strpos($origin, 'floradistros-projects') !== false);
    
    if ($origin && (in_array($origin, $allowed_origins) || $is_vercel)) {
        header('Access-Control-Allow-Origin: ' . $origin, true);
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE', true);
        header('Access-Control-Allow-Credentials: true', true);
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce', true);
    }
}, 1);

// Hook into REST API init with HIGHEST priority
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    add_filter('rest_pre_serve_request', function($served, $result, $request) {
        $allowed_origins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://websitev2-ashen.vercel.app',
            'https://web2-seven-bice.vercel.app',
            'https://floradistro.com',
            'https://www.floradistro.com',
        ];
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $is_vercel = (strpos($origin, 'vercel.app') !== false && 
                      strpos($origin, 'floradistros-projects') !== false);
        
        if ($origin && (in_array($origin, $allowed_origins) || $is_vercel)) {
            header('Access-Control-Allow-Origin: ' . $origin, true);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE', true);
            header('Access-Control-Allow-Credentials: true', true);
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce', true);
            header('Access-Control-Max-Age: 86400', true);
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
        
        return $served;
    }, PHP_INT_MAX, 3);
}, 1);

