<?php
/**
 * Create Flora Matrix Vendor - Direct Database Insert
 */

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

// Get POST data (handle both JSON and form data)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// If JSON decode failed, try parse_str for form data
if (!$data) {
    parse_str($input, $data);
}

// Also check $_POST
if (empty($data) && !empty($_POST)) {
    $data = $_POST;
}

if (!$data || !isset($data['user_id'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'user_id required',
        'debug' => [
            'input_received' => $input,
            'post_data' => $_POST,
            'parsed_data' => $data
        ]
    ]);
    exit;
}

$user_id = intval($data['user_id']);
$store_name = $data['store_name'] ?? '';
$email = $data['email'] ?? '';

// Get user data
$user = get_user_by('ID', $user_id);
if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

if (!$store_name) {
    $store_name = $user->first_name ?: $user->user_login;
}
if (!$email) {
    $email = $user->user_email;
}

$slug = sanitize_title($store_name);

// Add to Flora vendors table
global $wpdb;

// Check if already exists
$exists = $wpdb->get_var($wpdb->prepare(
    "SELECT id FROM {$wpdb->prefix}flora_vendors WHERE user_id = %d",
    $user_id
));

if ($exists) {
    // Update existing
    $wpdb->update(
        $wpdb->prefix . 'flora_vendors',
        [
            'store_name' => $store_name,
            'email' => $email,
            'slug' => $slug,
            'verified' => 1
        ],
        ['user_id' => $user_id],
        ['%s', '%s', '%s', '%d'],
        ['%d']
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Vendor updated in Flora Matrix',
        'vendor_id' => $exists
    ]);
} else {
    // Insert new
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
    
    echo json_encode([
        'success' => true,
        'message' => 'Vendor added to Flora Matrix',
        'vendor_id' => $vendor_id
    ]);
}

// Clear cache
wp_cache_flush();
if (function_exists('opcache_reset')) {
    opcache_reset();
}

