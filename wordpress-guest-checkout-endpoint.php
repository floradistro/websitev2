<?php
/**
 * Add this to wp-content/mu-plugins/flora-guest-checkout.php
 * 
 * Creates a public endpoint for guest checkout without requiring REST API authentication
 */

add_action('rest_api_init', function () {
    register_rest_route('flora/v1', '/checkout/create-order', array(
        'methods' => 'POST',
        'callback' => 'flora_create_guest_order',
        'permission_callback' => '__return_true' // Allow public access
    ));
});

function flora_create_guest_order($request) {
    try {
        $params = $request->get_json_params();
        
        // Validate required fields
        if (empty($params['billing_email']) || empty($params['order_items'])) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Missing required fields'
            ), 400);
        }
        
        // Create order
        $order = wc_create_order(array(
            'customer_id' => 0, // Guest checkout
            'status' => 'pending'
        ));
        
        if (is_wp_error($order)) {
            throw new Exception('Failed to create order: ' . $order->get_error_message());
        }
        
        // Set billing address
        $order->set_billing_first_name($params['billing_first_name']);
        $order->set_billing_last_name($params['billing_last_name']);
        $order->set_billing_email($params['billing_email']);
        $order->set_billing_phone($params['billing_phone']);
        $order->set_billing_address_1($params['billing_address_1']);
        $order->set_billing_address_2($params['billing_address_2']);
        $order->set_billing_city($params['billing_city']);
        $order->set_billing_state($params['billing_state']);
        $order->set_billing_postcode($params['billing_postcode']);
        $order->set_billing_country($params['billing_country']);
        
        // Set shipping address
        $order->set_shipping_first_name($params['shipping_first_name']);
        $order->set_shipping_last_name($params['shipping_last_name']);
        $order->set_shipping_address_1($params['shipping_address_1']);
        $order->set_shipping_address_2($params['shipping_address_2']);
        $order->set_shipping_city($params['shipping_city']);
        $order->set_shipping_state($params['shipping_state']);
        $order->set_shipping_postcode($params['shipping_postcode']);
        $order->set_shipping_country($params['shipping_country']);
        
        // Add line items
        foreach ($params['order_items'] as $item_data) {
            $product = wc_get_product($item_data['product_id']);
            if (!$product) {
                continue;
            }
            
            $item = new WC_Order_Item_Product();
            $item->set_product($product);
            $item->set_quantity($item_data['quantity']);
            $item->set_subtotal($product->get_price() * $item_data['quantity']);
            $item->set_total($product->get_price() * $item_data['quantity']);
            
            // Add meta data
            if (!empty($item_data['tier_name'])) {
                $item->add_meta_data('tier_name', $item_data['tier_name']);
            }
            if (!empty($item_data['order_type'])) {
                $item->add_meta_data('order_type', $item_data['order_type']);
            }
            if (!empty($item_data['location_id'])) {
                $item->add_meta_data('pickup_location_id', $item_data['location_id']);
            }
            if (!empty($item_data['location_name'])) {
                $item->add_meta_data('pickup_location_name', $item_data['location_name']);
            }
            
            $order->add_item($item);
        }
        
        // Add shipping
        if (!empty($params['shipping_cost']) && $params['shipping_cost'] > 0) {
            $shipping = new WC_Order_Item_Shipping();
            $shipping->set_method_title($params['shipping_method'] ?? 'Shipping');
            $shipping->set_total($params['shipping_cost']);
            $order->add_item($shipping);
        }
        
        // Set payment method
        $order->set_payment_method('authorize_net_cim');
        $order->set_payment_method_title('Credit Card (Authorize.net)');
        
        // Store payment token
        if (!empty($params['payment_token'])) {
            $order->update_meta_data('_wc_authorize_net_cim_payment_nonce', $params['payment_token']);
            $order->update_meta_data('_authorize_net_cim_payment_token', $params['payment_token']);
        }
        
        // Calculate totals
        $order->calculate_totals();
        $order->save();
        
        // Trigger payment processing hook
        do_action('woocommerce_checkout_order_created', $order);
        
        return new WP_REST_Response(array(
            'success' => true,
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'order_key' => $order->get_order_key(),
            'status' => $order->get_status(),
            'total' => $order->get_total()
        ), 200);
        
    } catch (Exception $e) {
        error_log('Flora guest checkout error: ' . $e->getMessage());
        return new WP_REST_Response(array(
            'success' => false,
            'message' => $e->getMessage()
        ), 500);
    }
}

