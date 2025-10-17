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
        // PRIORITY 999 to run LAST and override any other CORS headers
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
            
            // Remove any existing Access-Control-Allow-Origin headers first
            header_remove('Access-Control-Allow-Origin');
            
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
        }, 999, 3);
    }
}

// Initialize CORS handler
new Flora_AI_CORS();

/**
 * Flora Customer Authentication Endpoint
 * Secure authentication using WordPress credentials via AJAX
 */

// Handle AJAX login for both logged in and non-logged in users
add_action('wp_ajax_flora_customer_login', 'flora_customer_login_handler');
add_action('wp_ajax_nopriv_flora_customer_login', 'flora_customer_login_handler');

function flora_customer_login_handler() {
    header('Content-Type: application/json');
    
    $email = sanitize_email($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        wp_send_json_error(['error' => 'Email and password are required'], 400);
        return;
    }

    $user = wp_authenticate($email, $password);

    if (is_wp_error($user)) {
        wp_send_json_error(['error' => 'Invalid email or password'], 401);
        return;
    }

    $customer = new WC_Customer($user->ID);

    if (!$customer || !$customer->get_id()) {
        wp_send_json_error(['error' => 'Customer account not found'], 404);
        return;
    }

    wp_send_json_success([
        'user' => [
            'id' => $customer->get_id(),
            'email' => $customer->get_email(),
            'firstName' => $customer->get_first_name(),
            'lastName' => $customer->get_last_name(),
            'username' => $user->user_login,
            'billing' => [
                'first_name' => $customer->get_billing_first_name(),
                'last_name' => $customer->get_billing_last_name(),
                'company' => $customer->get_billing_company(),
                'address_1' => $customer->get_billing_address_1(),
                'address_2' => $customer->get_billing_address_2(),
                'city' => $customer->get_billing_city(),
                'state' => $customer->get_billing_state(),
                'postcode' => $customer->get_billing_postcode(),
                'country' => $customer->get_billing_country(),
                'email' => $customer->get_billing_email(),
                'phone' => $customer->get_billing_phone(),
            ],
            'shipping' => [
                'first_name' => $customer->get_shipping_first_name(),
                'last_name' => $customer->get_shipping_last_name(),
                'company' => $customer->get_shipping_company(),
                'address_1' => $customer->get_shipping_address_1(),
                'address_2' => $customer->get_shipping_address_2(),
                'city' => $customer->get_shipping_city(),
                'state' => $customer->get_shipping_state(),
                'postcode' => $customer->get_shipping_postcode(),
                'country' => $customer->get_shipping_country(),
            ],
            'avatar_url' => get_avatar_url($user->ID),
        ],
        'message' => 'Authentication successful'
    ]);
}
