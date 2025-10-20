<?php
/**
 * Admin Script: Create/Activate Vendor Accounts
 * Run this via SSH or upload to WordPress root and access via browser
 * 
 * Usage: php activate-vendor-admin.php
 */

// Set to actual WordPress path
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$action = $input['action'] ?? '';
$store_name = $input['store_name'] ?? '';
$email = $input['email'] ?? '';
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';
$vendor_id = $input['vendor_id'] ?? 0;

// CREATE NEW VENDOR
if ($action === 'create_vendor') {
    if (empty($store_name) || empty($email) || empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'All fields are required'
        ]);
        exit;
    }

    // Check if username or email already exists
    if (username_exists($username) || email_exists($email)) {
        echo json_encode([
            'success' => false,
            'message' => 'Username or email already exists'
        ]);
        exit;
    }

    // Create user
    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        echo json_encode([
            'success' => false,
            'message' => $user_id->get_error_message()
        ]);
        exit;
    }

    // Update user metadata for vendor
    update_user_meta($user_id, 'store_name', $store_name);
    update_user_meta($user_id, 'first_name', $store_name);
    update_user_meta($user_id, 'nickname', $store_name);
    update_user_meta($user_id, '_wcfm_vendor', 'yes');
    update_user_meta($user_id, '_wcfm_vendor_status', 'approved');
    update_user_meta($user_id, 'wcfm_vendor_active', '1');
    update_user_meta($user_id, 'wc_product_vendors_admin_vendor', '1');
    update_user_meta($user_id, 'wcpv_product_vendors', '1');

    // Set user role to vendor
    $user = new WP_User($user_id);
    $user->set_role('wc_product_vendors_admin_vendor');

    // CRITICAL: Add to Flora Matrix vendors table
    global $wpdb;
    $slug = sanitize_title($store_name);
    
    // Check if vendor already exists in Flora table
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM {$wpdb->prefix}flora_vendors WHERE user_id = %d",
        $user_id
    ));
    
    if (!$exists) {
        $wpdb->insert(
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
        $vendor_id = $wpdb->insert_id;
    } else {
        $vendor_id = $exists;
    }

    // Clear cache
    wp_cache_flush();
    if (function_exists('opcache_reset')) {
        opcache_reset();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Vendor created successfully and added to Flora Matrix',
        'user_id' => $user_id,
        'username' => $username,
        'email' => $email,
        'store_name' => $store_name,
        'vendor_id' => $vendor_id,
        'flora_matrix_added' => true
    ]);
    exit;
}

// SUSPEND VENDOR
if ($action === 'suspend_vendor' && $vendor_id > 0) {
    update_user_meta($vendor_id, '_wcfm_vendor_status', 'suspended');
    update_user_meta($vendor_id, 'vendor_status', 'suspended');
    
    wp_cache_flush();
    
    echo json_encode([
        'success' => true,
        'message' => 'Vendor suspended successfully'
    ]);
    exit;
}

// ACTIVATE VENDOR
if ($action === 'activate_vendor' && $vendor_id > 0) {
    update_user_meta($vendor_id, '_wcfm_vendor_status', 'approved');
    update_user_meta($vendor_id, 'vendor_status', 'active');
    update_user_meta($vendor_id, '_wcfm_vendor', 'yes');
    
    wp_cache_flush();
    
    echo json_encode([
        'success' => true,
        'message' => 'Vendor activated successfully'
    ]);
    exit;
}

// DELETE VENDOR
if ($action === 'delete_vendor' && $vendor_id > 0) {
    require_once(ABSPATH . 'wp-admin/includes/user.php');
    
    $deleted = wp_delete_user($vendor_id, 1); // Reassign posts to admin (user ID 1)
    
    if ($deleted) {
        wp_cache_flush();
        echo json_encode([
            'success' => true,
            'message' => 'Vendor deleted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete vendor'
        ]);
    }
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Invalid action'
]);

