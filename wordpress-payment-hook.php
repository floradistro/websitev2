<?php
/**
 * Add this code to your theme's functions.php or create a simple must-use plugin
 * Location: wp-content/mu-plugins/authorize-net-api-hook.php
 * 
 * This hooks into WooCommerce orders created via REST API and triggers
 * the existing Authorize.net gateway to process the payment token
 */

add_action('woocommerce_rest_insert_shop_order_object', 'process_authorize_net_payment_token', 10, 3);

function process_authorize_net_payment_token($order, $request, $creating) {
    // Only process for new orders with Authorize.net payment method
    if (!$creating || $order->get_payment_method() !== 'authorize_net_cim') {
        return;
    }
    
    // Get the payment token from order meta
    $payment_token = $order->get_meta('_wc_authorize_net_cim_payment_nonce');
    
    if (empty($payment_token)) {
        $payment_token = $order->get_meta('_authorize_net_cim_payment_token');
    }
    
    if (empty($payment_token)) {
        error_log('Authorize.net: No payment token found for order ' . $order->get_id());
        return;
    }
    
    // Get the Authorize.net gateway
    $gateways = WC()->payment_gateways()->payment_gateways();
    
    if (!isset($gateways['authorize_net_cim'])) {
        error_log('Authorize.net: Gateway not found');
        return;
    }
    
    $gateway = $gateways['authorize_net_cim'];
    
    if (!$gateway || !method_exists($gateway, 'process_payment')) {
        error_log('Authorize.net: Gateway does not have process_payment method');
        return;
    }
    
    try {
        // Store the payment token in the session/globals for the gateway to use
        $_POST['wc-authorize-net-cim-payment-nonce'] = $payment_token;
        $_POST['payment_method'] = 'authorize_net_cim';
        
        // Process the payment through the gateway
        $result = $gateway->process_payment($order->get_id());
        
        if ($result && isset($result['result']) && $result['result'] === 'success') {
            error_log('Authorize.net: Payment processed successfully for order ' . $order->get_id());
            $order->payment_complete();
        } else {
            error_log('Authorize.net: Payment processing failed for order ' . $order->get_id());
            $order->update_status('failed', 'Payment processing failed');
        }
        
    } catch (Exception $e) {
        error_log('Authorize.net: Exception processing payment for order ' . $order->get_id() . ': ' . $e->getMessage());
        $order->update_status('failed', 'Payment exception: ' . $e->getMessage());
    }
}

