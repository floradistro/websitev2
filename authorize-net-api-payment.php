<?php
/**
 * Plugin Name: Authorize.net API Payment Handler
 * Description: Handles Authorize.net payment processing for orders created via REST API
 * Version: 1.0.0
 * Author: Flora Distro
 */

if (!defined('ABSPATH')) {
    exit;
}

class Flora_AuthorizeNet_API_Payment {
    
    private static $instance = null;
    
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        // Hook into order creation
        add_action('woocommerce_new_order', array($this, 'process_api_payment'), 10, 2);
        add_action('woocommerce_api_create_order', array($this, 'process_api_payment'), 10, 2);
    }
    
    /**
     * Process payment for orders created via API
     */
    public function process_api_payment($order_id, $order = null) {
        if (!$order) {
            $order = wc_get_order($order_id);
        }
        
        if (!$order) {
            return;
        }
        
        // Check if this is an Authorize.net payment
        if ($order->get_payment_method() !== 'authorize_net_cim') {
            return;
        }
        
        // Check if payment token exists
        $payment_token = $order->get_meta('_authorize_net_cim_payment_token');
        if (!$payment_token) {
            $payment_token = $order->get_meta('_wc_authorize_net_cim_payment_token');
        }
        if (!$payment_token) {
            $payment_token = $order->get_meta('opaqueDataValue');
        }
        
        if (!$payment_token) {
            error_log('Authorize.net: No payment token found for order ' . $order_id);
            return;
        }
        
        // Get the Authorize.net gateway
        $gateways = WC()->payment_gateways->payment_gateways();
        
        if (!isset($gateways['authorize_net_cim'])) {
            error_log('Authorize.net: Gateway not found');
            $order->add_order_note('Authorize.net gateway not available.');
            return;
        }
        
        $gateway = $gateways['authorize_net_cim'];
        
        if (!$gateway || !$gateway->is_available()) {
            error_log('Authorize.net: Gateway not available');
            $order->add_order_note('Authorize.net gateway not available.');
            return;
        }
        
        // Process the payment
        try {
            error_log('Authorize.net: Processing payment for order ' . $order_id);
            
            // Get gateway settings
            $api_login_id = $gateway->get_option('api_login_id');
            $transaction_key = $gateway->get_option('transaction_key');
            $environment = $gateway->get_option('environment', 'production');
            
            if (empty($api_login_id) || empty($transaction_key)) {
                throw new Exception('Authorize.net credentials not configured');
            }
            
            // Set API endpoint
            if ($environment === 'production') {
                $api_url = 'https://api.authorize.net/xml/v1/request.api';
            } else {
                $api_url = 'https://apitest.authorize.net/xml/v1/request.api';
            }
            
            // Build transaction request
            $transaction_request = array(
                'createTransactionRequest' => array(
                    'merchantAuthentication' => array(
                        'name' => $api_login_id,
                        'transactionKey' => $transaction_key
                    ),
                    'transactionRequest' => array(
                        'transactionType' => 'authCaptureTransaction',
                        'amount' => $order->get_total(),
                        'payment' => array(
                            'opaqueData' => array(
                                'dataDescriptor' => 'COMMON.ACCEPT.INAPP.PAYMENT',
                                'dataValue' => $payment_token
                            )
                        ),
                        'order' => array(
                            'invoiceNumber' => $order->get_order_number(),
                            'description' => 'Order #' . $order->get_order_number()
                        ),
                        'billTo' => array(
                            'firstName' => $order->get_billing_first_name(),
                            'lastName' => $order->get_billing_last_name(),
                            'address' => $order->get_billing_address_1(),
                            'city' => $order->get_billing_city(),
                            'state' => $order->get_billing_state(),
                            'zip' => $order->get_billing_postcode(),
                            'country' => $order->get_billing_country()
                        ),
                        'customerIP' => $order->get_customer_ip_address()
                    )
                )
            );
            
            // Make API request
            $response = wp_remote_post($api_url, array(
                'headers' => array(
                    'Content-Type' => 'application/json'
                ),
                'body' => json_encode($transaction_request),
                'timeout' => 30
            ));
            
            if (is_wp_error($response)) {
                throw new Exception('API request failed: ' . $response->get_error_message());
            }
            
            $response_body = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!isset($response_body['transactionResponse'])) {
                throw new Exception('Invalid API response');
            }
            
            $transaction_response = $response_body['transactionResponse'];
            
            // Check response code
            if ($transaction_response['responseCode'] == '1') {
                // Approved
                $transaction_id = $transaction_response['transId'];
                
                $order->payment_complete($transaction_id);
                $order->add_order_note(
                    sprintf(
                        'Authorize.net payment approved (Transaction ID: %s)',
                        $transaction_id
                    )
                );
                
                error_log('Authorize.net: Payment approved for order ' . $order_id . ' (Transaction: ' . $transaction_id . ')');
                
            } elseif ($transaction_response['responseCode'] == '2') {
                // Declined
                throw new Exception('Payment declined: ' . (isset($transaction_response['errors'][0]['errorText']) ? $transaction_response['errors'][0]['errorText'] : 'Unknown error'));
                
            } elseif ($transaction_response['responseCode'] == '3') {
                // Error
                throw new Exception('Payment error: ' . (isset($transaction_response['errors'][0]['errorText']) ? $transaction_response['errors'][0]['errorText'] : 'Unknown error'));
                
            } else {
                // Held for review
                $order->update_status('on-hold');
                $order->add_order_note('Payment held for review by Authorize.net');
            }
            
        } catch (Exception $e) {
            error_log('Authorize.net error for order ' . $order_id . ': ' . $e->getMessage());
            $order->update_status('failed');
            $order->add_order_note('Payment failed: ' . $e->getMessage());
        }
    }
}

// Initialize the plugin
function flora_authorize_net_api_payment() {
    return Flora_AuthorizeNet_API_Payment::instance();
}

add_action('plugins_loaded', 'flora_authorize_net_api_payment', 20);

