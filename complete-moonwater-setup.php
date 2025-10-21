<?php
// BYPASS CACHE - Direct activation script
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

// Clear all caches first
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}

$user_id = 140;

// Activate vendor
$user = get_user_by('ID', $user_id);
$user->remove_role('customer');
$user->add_role('wc_product_vendors_admin_vendor');

// Set ALL necessary meta
update_user_meta($user_id, 'store_name', 'Moonwater');
update_user_meta($user_id, '_wcfm_vendor', 'yes');
update_user_meta($user_id, '_wcfm_vendor_status', 'approved');
update_user_meta($user_id, 'wcfm_vendor_active', '1');
update_user_meta($user_id, 'wc_product_vendors_admin_vendor', '1');

// Add to vendor table
global $wpdb;
$wpdb->query("INSERT INTO {$wpdb->prefix}flora_vendors (user_id, store_name, slug, email, verified, featured, created_at) VALUES (140, 'Moonwater', 'moonwater', 'eli@moonwaterbeverages.com', 1, 0, NOW()) ON DUPLICATE KEY UPDATE verified = 1, store_name = 'Moonwater'");

// Clear opcache
if (function_exists('opcache_reset')) {
    opcache_reset();
}

echo "DONE\n";
echo "Test: curl -X POST 'https://api.floradistro.com/wp-json/flora-vendors/v1/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"eli@moonwaterbeverages.com\",\"password\":\"jew123\"}'";
?>



