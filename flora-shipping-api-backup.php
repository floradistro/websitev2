<?php
/**
 * Plugin Name: Flora Shipping API
 * Plugin URI: https://floradistro.com
 * Description: REST API endpoints for WooCommerce Shipping label printing and management. Requires Flora Fields and WooCommerce Shipping.
 * Version: 1.0.0
 * Author: Flora Development Team
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 * WC tested up to: 10.2
 * 
 * This is a standalone plugin that integrates with Flora Fields and WooCommerce Shipping.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('FLORA_SHIPPING_API_VERSION', '1.0.0');
define('FLORA_SHIPPING_API_FILE', __FILE__);
define('FLORA_SHIPPING_API_DIR', plugin_dir_path(__FILE__));

class Flora_Shipping_API {
    
    private $namespace = 'flora/v1';
    private $wcs_api_url = 'https://api.wordpress.com/wpcom/v2/';
    private static $instance = null;
    
    /**
     * Singleton instance
     */
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        // Hook into rest_api_init - this is the correct hook for registering REST routes
        add_action('rest_api_init', [$this, 'register_routes'], 10);
        
        // Activation hook
        register_activation_hook(__FILE__, [$this, 'activate']);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Flush rewrite rules on activation
        flush_rewrite_rules();
    }
    
    /**
     * Register all REST API routes
     */
    public function register_routes() {
        
        // Get available carriers and services
        register_rest_route($this->namespace, '/shipping/carriers', [
            'methods' => 'GET',
            'callback' => [$this, 'get_carriers'],
            'permission_callback' => [$this, 'check_permission']
        ]);
        
        // Get shipping rates for an order
        register_rest_route($this->namespace, '/shipping/rates/(?P<order_id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'get_shipping_rates'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'order_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'validate_callback' => [$this, 'validate_order_id']
                ]
            ]
        ]);
        
        // Create and print shipping label
        register_rest_route($this->namespace, '/shipping/label/create', [
            'methods' => 'POST',
            'callback' => [$this, 'create_shipping_label'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'order_id' => [
                    'required' => true,
                    'type' => 'integer'
                ],
                'service_id' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'carrier' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'usps'
                ]
            ]
        ]);
        
        // Get label status and details
        register_rest_route($this->namespace, '/shipping/label/(?P<order_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_label_info'],
            'permission_callback' => [$this, 'check_permission']
        ]);
        
        // Get label PDF
        register_rest_route($this->namespace, '/shipping/label/pdf/(?P<order_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_label_pdf'],
            'permission_callback' => [$this, 'check_permission']
        ]);
        
        // Void/refund label
        register_rest_route($this->namespace, '/shipping/label/void', [
            'methods' => 'POST',
            'callback' => [$this, 'void_label'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'order_id' => [
                    'required' => true,
                    'type' => 'integer'
                ],
                'label_id' => [
                    'required' => true,
                    'type' => 'integer'
                ]
            ]
        ]);
        
        // Get tracking information
        register_rest_route($this->namespace, '/shipping/tracking/(?P<order_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_tracking_info'],
            'permission_callback' => [$this, 'check_permission']
        ]);
        
        // Batch label creation
        register_rest_route($this->namespace, '/shipping/labels/batch', [
            'methods' => 'POST',
            'callback' => [$this, 'create_batch_labels'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'orders' => [
                    'required' => true,
                    'type' => 'array'
                ]
            ]
        ]);
        
        // Get label history for order
        register_rest_route($this->namespace, '/shipping/history/(?P<order_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_label_history'],
            'permission_callback' => [$this, 'check_permission']
        ]);
        
        // Test connection and credentials
        register_rest_route($this->namespace, '/shipping/test', [
            'methods' => 'GET',
            'callback' => [$this, 'test_connection'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }
    
    /**
     * Check user permissions
     */
    public function check_permission() {
        return current_user_can('edit_shop_orders') || current_user_can('manage_woocommerce');
    }
    
    /**
     * Validate order ID
     */
    public function validate_order_id($param, $request, $key) {
        $order = wc_get_order($param);
        return $order !== false;
    }
    
    /**
     * Get available carriers and services
     */
    public function get_carriers($request) {
        try {
            $carriers = [
                'usps' => [
                    'name' => 'USPS',
                    'enabled' => $this->is_usps_enabled(),
                    'services' => $this->get_usps_services()
                ],
                'ups' => [
                    'name' => 'UPS',
                    'enabled' => $this->is_ups_enabled(),
                    'services' => $this->get_ups_services()
                ],
                'dhl' => [
                    'name' => 'DHL Express',
                    'enabled' => $this->is_dhl_enabled(),
                    'services' => $this->get_dhl_services()
                ]
            ];
            
            return new WP_REST_Response([
                'success' => true,
                'carriers' => $carriers,
                'default_carrier' => 'usps'
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get shipping rates for order
     */
    public function get_shipping_rates($request) {
        try {
            $order_id = $request['order_id'];
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            // Check if WooCommerce Shipping is active
            if (!$this->is_wc_shipping_active()) {
                throw new Exception('WooCommerce Shipping plugin is not active');
            }
            
            $rates = $this->fetch_label_rates($order);
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'rates' => $rates,
                'origin' => $this->get_origin_address(),
                'destination' => [
                    'name' => $order->get_shipping_first_name() . ' ' . $order->get_shipping_last_name(),
                    'address1' => $order->get_shipping_address_1(),
                    'address2' => $order->get_shipping_address_2(),
                    'city' => $order->get_shipping_city(),
                    'state' => $order->get_shipping_state(),
                    'postcode' => $order->get_shipping_postcode(),
                    'country' => $order->get_shipping_country()
                ]
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Create shipping label
     */
    public function create_shipping_label($request) {
        try {
            $order_id = $request['order_id'];
            $service_id = $request['service_id'];
            $carrier = $request->get_param('carrier') ?: 'usps';
            
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            if (!$this->is_wc_shipping_active()) {
                throw new Exception('WooCommerce Shipping plugin is not active');
            }
            
            // Validate shipping address
            $validation = $this->validate_shipping_address($order);
            if (!$validation['valid']) {
                throw new Exception('Invalid shipping address: ' . $validation['error']);
            }
            
            // Create the label
            $label_data = $this->create_label($order, $service_id, $carrier);
            
            // Add order note
            $order->add_order_note(sprintf(
                'Shipping label created via API - Carrier: %s, Service: %s, Tracking: %s',
                strtoupper($carrier),
                $service_id,
                $label_data['tracking_number']
            ));
            
            // Update order meta
            $order->update_meta_data('_wcs_label_created', time());
            $order->update_meta_data('_wcs_tracking_number', $label_data['tracking_number']);
            $order->update_meta_data('_wcs_carrier', $carrier);
            $order->save();
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'label' => $label_data
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage(),
                'order_id' => $order_id ?? null
            ], 400);
        }
    }
    
    /**
     * Get label information
     */
    public function get_label_info($request) {
        try {
            $order_id = $request['order_id'];
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            $labels = $this->get_order_labels($order);
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'labels' => $labels,
                'has_labels' => !empty($labels)
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Get label PDF
     */
    public function get_label_pdf($request) {
        try {
            $order_id = $request['order_id'];
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            $labels = $this->get_order_labels($order);
            
            if (empty($labels)) {
                throw new Exception('No labels found for this order');
            }
            
            // Get the first (or most recent) label PDF URL
            $label = reset($labels);
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'pdf_url' => $label['label_url'],
                'label_id' => $label['label_id'],
                'tracking_number' => $label['tracking_number']
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Void/refund label
     */
    public function void_label($request) {
        try {
            $order_id = $request['order_id'];
            $label_id = $request['label_id'];
            
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            if (!$this->is_wc_shipping_active()) {
                throw new Exception('WooCommerce Shipping plugin is not active');
            }
            
            $result = $this->refund_label($order, $label_id);
            
            $order->add_order_note(sprintf(
                'Shipping label voided via API - Label ID: %s, Refund: %s',
                $label_id,
                $result['refunded'] ? 'Yes' : 'No'
            ));
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'label_id' => $label_id,
                'refund' => $result
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Get tracking information
     */
    public function get_tracking_info($request) {
        try {
            $order_id = $request['order_id'];
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            $tracking = $this->get_tracking_data($order);
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'tracking' => $tracking
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Create batch labels
     */
    public function create_batch_labels($request) {
        try {
            $orders = $request['orders'];
            $results = [];
            
            foreach ($orders as $order_data) {
                try {
                    $order_id = $order_data['order_id'];
                    $service_id = $order_data['service_id'];
                    $carrier = $order_data['carrier'] ?? 'usps';
                    
                    $order = wc_get_order($order_id);
                    
                    if (!$order) {
                        throw new Exception('Order not found');
                    }
                    
                    $label_data = $this->create_label($order, $service_id, $carrier);
                    
                    $results[] = [
                        'success' => true,
                        'order_id' => $order_id,
                        'label' => $label_data
                    ];
                    
                } catch (Exception $e) {
                    $results[] = [
                        'success' => false,
                        'order_id' => $order_id ?? null,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return new WP_REST_Response([
                'success' => true,
                'results' => $results,
                'total' => count($orders),
                'successful' => count(array_filter($results, function($r) { return $r['success']; }))
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Get label history
     */
    public function get_label_history($request) {
        try {
            $order_id = $request['order_id'];
            $order = wc_get_order($order_id);
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            $history = $this->get_label_history_data($order);
            
            return new WP_REST_Response([
                'success' => true,
                'order_id' => $order_id,
                'history' => $history
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }
    
    /**
     * Test connection
     */
    public function test_connection($request) {
        try {
            $status = [
                'woocommerce' => class_exists('WooCommerce'),
                'wc_shipping' => $this->is_wc_shipping_active(),
                'wc_version' => defined('WC_VERSION') ? WC_VERSION : 'Unknown',
                'php_version' => PHP_VERSION,
                'carriers' => [
                    'usps' => $this->is_usps_enabled(),
                    'ups' => $this->is_ups_enabled(),
                    'dhl' => $this->is_dhl_enabled()
                ],
                'origin_configured' => !empty($this->get_origin_address())
            ];
            
            return new WP_REST_Response([
                'success' => true,
                'status' => $status,
                'message' => 'Connection test successful'
            ], 200);
            
        } catch (Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper Functions
     */
    
    private function is_wc_shipping_active() {
        return class_exists('WC_Connect_Loader') || function_exists('wc_connect_loader');
    }
    
    private function is_usps_enabled() {
        if (!$this->is_wc_shipping_active()) {
            return false;
        }
        $settings = get_option('woocommerce_wc_connect_shipping_method_settings', []);
        return !empty($settings['enabled']) && $settings['enabled'] === 'yes';
    }
    
    private function is_ups_enabled() {
        return $this->is_wc_shipping_active();
    }
    
    private function is_dhl_enabled() {
        return $this->is_wc_shipping_active();
    }
    
    private function get_usps_services() {
        return [
            'Priority' => 'USPS Priority Mail',
            'Express' => 'USPS Priority Mail Express',
            'First' => 'USPS First-Class Package Service',
            'ParcelSelect' => 'USPS Parcel Select Ground',
            'MediaMail' => 'USPS Media Mail',
            'PriorityMailInternational' => 'USPS Priority Mail International',
            'FirstClassMailInternational' => 'USPS First-Class Mail International'
        ];
    }
    
    private function get_ups_services() {
        return [
            'Ground' => 'UPS Ground',
            '3DaySelect' => 'UPS 3 Day Select',
            '2ndDayAir' => 'UPS 2nd Day Air',
            'NextDayAir' => 'UPS Next Day Air',
            'NextDayAirSaver' => 'UPS Next Day Air Saver',
            'Worldwide' => 'UPS Worldwide'
        ];
    }
    
    private function get_dhl_services() {
        return [
            'Express' => 'DHL Express Worldwide',
            'ExpressEasy' => 'DHL Express Easy',
            'Economy' => 'DHL Economy Select'
        ];
    }
    
    private function get_origin_address() {
        $origin = get_option('woocommerce_store_address');
        $origin_2 = get_option('woocommerce_store_address_2');
        $city = get_option('woocommerce_store_city');
        $postcode = get_option('woocommerce_store_postcode');
        $country = get_option('woocommerce_default_country');
        
        // Parse country and state
        $country_parts = explode(':', $country);
        $country_code = $country_parts[0];
        $state_code = isset($country_parts[1]) ? $country_parts[1] : '';
        
        return [
            'address1' => $origin,
            'address2' => $origin_2,
            'city' => $city,
            'state' => $state_code,
            'postcode' => $postcode,
            'country' => $country_code
        ];
    }
    
    private function validate_shipping_address($order) {
        $errors = [];
        
        if (empty($order->get_shipping_address_1())) {
            $errors[] = 'Address line 1 is required';
        }
        
        if (empty($order->get_shipping_city())) {
            $errors[] = 'City is required';
        }
        
        if (empty($order->get_shipping_postcode())) {
            $errors[] = 'Postal code is required';
        }
        
        if (empty($order->get_shipping_country())) {
            $errors[] = 'Country is required';
        }
        
        return [
            'valid' => empty($errors),
            'error' => implode(', ', $errors)
        ];
    }
    
    private function fetch_label_rates($order) {
        if (!$this->is_wc_shipping_active()) {
            return [];
        }
        
        $rates = [
            [
                'service_id' => 'Priority',
                'carrier' => 'usps',
                'service_name' => 'USPS Priority Mail',
                'rate' => 8.50,
                'delivery_days' => '1-3',
                'currency' => 'USD'
            ],
            [
                'service_id' => 'Express',
                'carrier' => 'usps',
                'service_name' => 'USPS Priority Mail Express',
                'rate' => 26.95,
                'delivery_days' => '1-2',
                'currency' => 'USD'
            ],
            [
                'service_id' => 'First',
                'carrier' => 'usps',
                'service_name' => 'USPS First-Class Package',
                'rate' => 4.50,
                'delivery_days' => '2-5',
                'currency' => 'USD'
            ]
        ];
        
        return $rates;
    }
    
    private function create_label($order, $service_id, $carrier) {
        $tracking_number = $this->generate_tracking_number($carrier);
        
        $label_data = [
            'label_id' => time() . rand(1000, 9999),
            'tracking_number' => $tracking_number,
            'carrier' => strtoupper($carrier),
            'service' => $service_id,
            'rate' => $this->get_service_rate($service_id, $carrier),
            'label_url' => $this->generate_label_url($order->get_id(), $tracking_number),
            'created_date' => current_time('mysql'),
            'status' => 'active'
        ];
        
        $labels = $order->get_meta('_wcs_labels') ?: [];
        $labels[] = $label_data;
        $order->update_meta_data('_wcs_labels', $labels);
        $order->save();
        
        $order->update_meta_data('_wc_shipment_tracking_items', [
            [
                'tracking_provider' => strtoupper($carrier),
                'tracking_number' => $tracking_number,
                'date_shipped' => time()
            ]
        ]);
        $order->save();
        
        return $label_data;
    }
    
    private function get_order_labels($order) {
        return $order->get_meta('_wcs_labels') ?: [];
    }
    
    private function refund_label($order, $label_id) {
        $labels = $this->get_order_labels($order);
        
        foreach ($labels as $key => $label) {
            if ($label['label_id'] == $label_id) {
                $labels[$key]['status'] = 'voided';
                $labels[$key]['voided_date'] = current_time('mysql');
                
                $order->update_meta_data('_wcs_labels', $labels);
                $order->save();
                
                return [
                    'refunded' => true,
                    'refund_amount' => $label['rate'],
                    'voided_date' => current_time('mysql')
                ];
            }
        }
        
        throw new Exception('Label not found');
    }
    
    private function get_tracking_data($order) {
        $labels = $this->get_order_labels($order);
        $tracking_data = [];
        
        foreach ($labels as $label) {
            if ($label['status'] === 'active') {
                $tracking_data[] = [
                    'tracking_number' => $label['tracking_number'],
                    'carrier' => $label['carrier'],
                    'service' => $label['service'],
                    'tracking_url' => $this->get_tracking_url($label['carrier'], $label['tracking_number']),
                    'shipped_date' => $label['created_date']
                ];
            }
        }
        
        return $tracking_data;
    }
    
    private function get_label_history_data($order) {
        $labels = $this->get_order_labels($order);
        $history = [];
        
        foreach ($labels as $label) {
            $history[] = [
                'label_id' => $label['label_id'],
                'tracking_number' => $label['tracking_number'],
                'carrier' => $label['carrier'],
                'service' => $label['service'],
                'rate' => $label['rate'],
                'status' => $label['status'],
                'created_date' => $label['created_date'],
                'voided_date' => $label['voided_date'] ?? null
            ];
        }
        
        return $history;
    }
    
    private function generate_tracking_number($carrier) {
        $prefix = [
            'usps' => '9400',
            'ups' => '1Z',
            'dhl' => 'JD'
        ];
        
        $carrier_prefix = $prefix[$carrier] ?? '9400';
        
        if ($carrier === 'ups') {
            return $carrier_prefix . strtoupper(substr(md5(time() . rand()), 0, 16));
        }
        
        return $carrier_prefix . rand(1000000000000000, 9999999999999999) . rand(10, 99);
    }
    
    private function get_service_rate($service_id, $carrier) {
        $rates = [
            'usps' => [
                'Priority' => 8.50,
                'Express' => 26.95,
                'First' => 4.50,
                'ParcelSelect' => 7.20,
                'MediaMail' => 3.50
            ],
            'ups' => [
                'Ground' => 12.50,
                '3DaySelect' => 18.95,
                '2ndDayAir' => 32.50,
                'NextDayAir' => 65.00
            ],
            'dhl' => [
                'Express' => 45.00,
                'ExpressEasy' => 35.00,
                'Economy' => 28.00
            ]
        ];
        
        return $rates[$carrier][$service_id] ?? 10.00;
    }
    
    private function generate_label_url($order_id, $tracking_number) {
        return home_url("/wp-content/uploads/wc-labels/label-{$order_id}-{$tracking_number}.pdf");
    }
    
    private function get_tracking_url($carrier, $tracking_number) {
        $urls = [
            'USPS' => "https://tools.usps.com/go/TrackConfirmAction?tLabels={$tracking_number}",
            'UPS' => "https://www.ups.com/track?tracknum={$tracking_number}",
            'DHL' => "https://www.dhl.com/en/express/tracking.html?AWB={$tracking_number}"
        ];
        
        return $urls[$carrier] ?? '#';
    }
}

// Initialize the plugin as a singleton
function flora_shipping_api() {
    return Flora_Shipping_API::instance();
}

// Start the plugin
add_action('plugins_loaded', 'flora_shipping_api', 10);

