<?php
/**
 * Plugin Name: Flora CORS Fix (Must Use)
 * Description: Emergency CORS fix for all Vercel domains
 * Version: 1.0.0
 */

// This runs before all other plugins
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    add_filter('rest_pre_serve_request', function($value) {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        // Allow localhost, all Vercel domains, and floradistro.com
        $is_allowed = 
            strpos($origin, 'localhost') !== false ||
            strpos($origin, 'vercel.app') !== false ||
            strpos($origin, 'floradistro.com') !== false;
        
        if ($is_allowed && $origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With, X-WP-Nonce');
            header('Access-Control-Max-Age: 86400');
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
        
        return $value;
    }, 15);
}, 15);

