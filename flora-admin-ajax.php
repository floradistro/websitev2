<?php
/**
 * WordPress Admin Ajax Handler for Flora Matrix Vendor Creation
 * Upload this to: public_html/wp-content/plugins/flora-matrix/
 * Or add to your theme's functions.php
 */

add_action('wp_ajax_flora_create_vendor_entry', 'flora_create_vendor_entry');
add_action('wp_ajax_nopriv_flora_create_vendor_entry', 'flora_create_vendor_entry');

function flora_create_vendor_entry() {
    global $wpdb;
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Also try $_POST
    if (!$data) {
        $data = $_POST;
    }
    
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $store_name = isset($data['store_name']) ? sanitize_text_field($data['store_name']) : '';
    $email = isset($data['email']) ? sanitize_email($data['email']) : '';
    
    if (!$user_id || !$store_name || !$email) {
        wp_send_json_error(['message' => 'user_id, store_name, and email required']);
        return;
    }
    
    $slug = sanitize_title($store_name);
    
    // Check if exists
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}flora_vendors WHERE user_id = %d",
        $user_id
    ));
    
    if ($exists) {
        wp_send_json_success([
            'message' => 'Vendor already in Flora Matrix',
            'vendor_id' => $exists
        ]);
        return;
    }
    
    // Insert into Flora Matrix table
    $result = $wpdb->insert(
        $wpdb->prefix . 'flora_vendors',
        [
            'user_id' => $user_id,
            'store_name' => $store_name,
            'slug' => $slug,
            'email' => $email,
            'verified' => 1,
            'featured' => 0,
            'created_at' => current_time('mysql')
        ],
        ['%d', '%s', '%s', '%s', '%d', '%d', '%s']
    );
    
    if ($result) {
        wp_cache_flush();
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }
        
        wp_send_json_success([
            'message' => 'Vendor added to Flora Matrix successfully',
            'vendor_id' => $wpdb->insert_id,
            'user_id' => $user_id
        ]);
    } else {
        wp_send_json_error([
            'message' => 'Failed to insert vendor',
            'error' => $wpdb->last_error
        ]);
    }
}

