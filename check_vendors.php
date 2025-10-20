<?php
define('WP_USE_THEMES', false);
require_once('./wp-load.php');
header('Content-Type: text/plain');

global $wpdb;

echo "=== EXISTING VENDORS (WORKING) ===\n\n";

// Check vendor IDs 2 and 3 (working vendors)
$working_vendor_ids = [2, 3];

foreach ($working_vendor_ids as $vendor_id) {
    $vendor = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}flora_vendors WHERE id = $vendor_id");
    if ($vendor) {
        echo "Vendor #{$vendor->id}: {$vendor->store_name}\n";
        echo "  User ID: {$vendor->user_id}\n";
        echo "  Email: {$vendor->email}\n";
        echo "  Verified: {$vendor->verified}\n\n";
        
        if ($vendor->user_id) {
            $user = get_user_by('ID', $vendor->user_id);
            if ($user) {
                echo "  User {$vendor->user_id} Details:\n";
                echo "    - Username: {$user->user_login}\n";
                echo "    - Email: {$user->user_email}\n";
                echo "    - Roles: " . implode(', ', $user->roles) . "\n";
                echo "    - Capabilities: " . get_user_meta($vendor->user_id, 'wp_capabilities', true) . "\n";
                echo "    - Store Name Meta: " . get_user_meta($vendor->user_id, 'store_name', true) . "\n";
                echo "    - Vendor Status: " . get_user_meta($vendor->user_id, '_wcfm_vendor_status', true) . "\n";
                echo "    - Vendor Active: " . get_user_meta($vendor->user_id, 'wcfm_vendor_active', true) . "\n\n";
            }
        }
    }
}

echo "\n=== MOONWATER (NEW - ID 140) ===\n\n";

// Check user 140
$user140 = get_user_by('ID', 140);
if ($user140) {
    echo "User 140:\n";
    echo "  - Username: {$user140->user_login}\n";
    echo "  - Email: {$user140->user_email}\n";
    echo "  - Roles: " . implode(', ', $user140->roles) . "\n";
    echo "  - Capabilities: " . get_user_meta(140, 'wp_capabilities', true) . "\n";
    echo "  - Store Name: " . get_user_meta(140, 'store_name', true) . "\n";
    echo "  - Vendor Status: " . get_user_meta(140, '_wcfm_vendor_status', true) . "\n";
    echo "  - Vendor Active: " . get_user_meta(140, 'wcfm_vendor_active', true) . "\n\n";
}

// Check if in flora_vendors
$vendor140 = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}flora_vendors WHERE user_id = 140");
if ($vendor140) {
    echo "In flora_vendors table:\n";
    echo "  - ID: {$vendor140->id}\n";
    echo "  - Store: {$vendor140->store_name}\n";
    echo "  - Verified: {$vendor140->verified}\n";
} else {
    echo "NOT in flora_vendors table\n";
}

echo "\n=== TABLE PREFIX ===\n";
echo $wpdb->prefix . "\n";
?>

