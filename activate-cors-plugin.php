<?php
/**
 * Activate Flora CORS Fix Plugin
 * Run this via: php activate-cors-plugin.php
 */

// Load WordPress
require_once('public_html/wp-load.php');

if (!function_exists('activate_plugin')) {
    require_once(ABSPATH . 'wp-admin/includes/plugin.php');
}

echo "🔧 Activating Flora CORS Fix Plugin...\n";
echo "========================================\n\n";

$plugin_file = 'flora-cors-fix.php';

// Check if plugin file exists
if (!file_exists(WP_PLUGIN_DIR . '/' . $plugin_file)) {
    echo "❌ ERROR: Plugin file not found at: " . WP_PLUGIN_DIR . '/' . $plugin_file . "\n";
    echo "Please upload flora-cors-fix.php to the plugins directory first.\n";
    exit(1);
}

// Activate the plugin
$result = activate_plugin($plugin_file);

if (is_wp_error($result)) {
    echo "❌ ERROR: Failed to activate plugin\n";
    echo "Error: " . $result->get_error_message() . "\n";
    exit(1);
}

echo "✅ SUCCESS: Flora CORS Fix plugin activated!\n\n";

// List all active plugins
$active_plugins = get_option('active_plugins');
echo "📋 Active Plugins:\n";
foreach ($active_plugins as $plugin) {
    echo "  - $plugin\n";
}

echo "\n✅ CORS fix is now active\n";
echo "🔗 Test at: https://websitev2-ashen.vercel.app/products/646\n\n";

