<?php
/**
 * Plugin Name: Flora Customer Authentication
 * Description: Secure customer authentication endpoint for Flora Distro
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('flora-auth/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'flora_authenticate_customer',
        'permission_callback' => '__return_true'
    ));
});

function flora_authenticate_customer($request) {
    $params = $request->get_json_params();
    $email = sanitize_email($params['email'] ?? '');
    $password = $params['password'] ?? '';

    if (empty($email) || empty($password)) {
        return new WP_Error('missing_credentials', 'Email and password are required', array('status' => 400));
    }

    // Authenticate user with WordPress
    $user = wp_authenticate($email, $password);

    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Invalid email or password', array('status' => 401));
    }

    // Get WooCommerce customer data
    $customer = new WC_Customer($user->ID);

    if (!$customer || !$customer->get_id()) {
        return new WP_Error('customer_not_found', 'Customer account not found', array('status' => 404));
    }

    // Return customer data (same format as WooCommerce API)
    return rest_ensure_response(array(
        'success' => true,
        'user' => array(
            'id' => $customer->get_id(),
            'email' => $customer->get_email(),
            'firstName' => $customer->get_first_name(),
            'lastName' => $customer->get_last_name(),
            'username' => $user->user_login,
            'billing' => array(
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
            ),
            'shipping' => array(
                'first_name' => $customer->get_shipping_first_name(),
                'last_name' => $customer->get_shipping_last_name(),
                'company' => $customer->get_shipping_company(),
                'address_1' => $customer->get_shipping_address_1(),
                'address_2' => $customer->get_shipping_address_2(),
                'city' => $customer->get_shipping_city(),
                'state' => $customer->get_shipping_state(),
                'postcode' => $customer->get_shipping_postcode(),
                'country' => $customer->get_shipping_country(),
            ),
            'avatar_url' => get_avatar_url($user->ID),
        ),
        'message' => 'Authentication successful'
    ));
}

