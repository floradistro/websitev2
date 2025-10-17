<?php
/**
 * Plugin Name: Flora CORS Fix
 * Plugin URI: https://floradistro.com
 * Description: Fixes CORS issues for Vercel production domains on shipping API
 * Version: 1.0.0
 * Author: Flora Distro
 * Author URI: https://floradistro.com
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add CORS headers to REST API responses
 */
add_action('rest_api_init', function() {
    // Remove default CORS headers
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    // Add custom CORS headers
    add_filter('rest_pre_serve_request', function($value) {
        // Allowed origins
        $allowed_origins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://websitev2-ashen.vercel.app',
            'https://web2-seven-bice.vercel.app',
            'https://web2-ml23ngnkq-floradistros-projects.vercel.app',
            'https://web2-iaa1jeuol-floradistros-projects.vercel.app',
            'https://floradistro.com',
            'https://www.floradistro.com',
            // Add any other Vercel preview URLs as needed
        ];
        
        // Get the origin
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        // Check if origin is in allowed list OR is a Vercel preview URL
        $is_allowed = in_array($origin, $allowed_origins) || 
                      (strpos($origin, 'vercel.app') !== false && strpos($origin, 'floradistros-projects') !== false);
        
        if ($is_allowed) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
            header('Access-Control-Max-Age: 86400'); // 24 hours cache for preflight
        }
        
        // Handle preflight OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit;
        }
        
        return $value;
    }, 15);
}, 15);

/**
 * Add CORS headers specifically for shipping endpoint
 */
add_filter('rest_request_before_callbacks', function($response, $handler, $request) {
    // Check if this is a shipping calculate request
    $route = $request->get_route();
    
    if (strpos($route, '/flora/v1/shipping/calculate') !== false) {
        $allowed_origins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://websitev2-ashen.vercel.app',
            'https://web2-seven-bice.vercel.app',
            'https://web2-ml23ngnkq-floradistros-projects.vercel.app',
            'https://web2-iaa1jeuol-floradistros-projects.vercel.app',
            'https://floradistro.com',
            'https://www.floradistro.com',
        ];
        
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $is_allowed = in_array($origin, $allowed_origins) || 
                      (strpos($origin, 'vercel.app') !== false && strpos($origin, 'floradistros-projects') !== false);
        
        if ($is_allowed) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept');
            header('Access-Control-Allow-Credentials: true');
        }
    }
    
    return $response;
}, 10, 3);

/**
 * Log CORS requests for debugging
 */
add_action('rest_api_init', function() {
    add_filter('rest_pre_dispatch', function($result, $server, $request) {
        $route = $request->get_route();
        
        // Only log shipping requests
        if (strpos($route, '/shipping/calculate') !== false) {
            $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'none';
            error_log('🚚 Shipping API Request from origin: ' . $origin);
            error_log('🚚 Request method: ' . $_SERVER['REQUEST_METHOD']);
            error_log('🚚 Route: ' . $route);
        }
        
        return $result;
    }, 10, 3);
});

