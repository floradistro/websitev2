<?php
/**
 * AI Chat CORS Handler
 * Enables cross-origin requests for AI Chat API
 *
 * @package FloraInventoryMatrix
 * @subpackage AI
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_AI_CORS {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'add_cors_headers'));
    }
    
    /**
     * Add CORS headers to REST API responses
     */
    public function add_cors_headers() {
        // Allow requests from Next.js dev server AND production
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
            
            // Check if origin is in allowed list OR is a Vercel preview URL
            $is_vercel_preview = strpos($origin, 'vercel.app') !== false && 
                                 strpos($origin, 'floradistros-projects') !== false;
            
            if (in_array($origin, $allowed_origins) || $is_vercel_preview) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else if ($origin) {
                // Fallback: allow any HTTPS origin (safer than blocking all)
                header('Access-Control-Allow-Origin: ' . $origin);
            }
            
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
            header('Access-Control-Max-Age: 86400');
            
            // Handle preflight requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                status_header(200);
                exit;
            }
            
            return $served;
        }, 10, 3);
    }
}

// Initialize CORS handler
new Flora_AI_CORS();




