<?php
/**
 * Activate Flora Email Customizer Plugin
 * Upload this file to WordPress root and access via browser
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

// Check if user is logged in as admin
if (!current_user_can('activate_plugins')) {
    die('You must be logged in as an administrator to activate plugins.');
}

// Plugin slug
$plugin = 'flora-email-customizer/flora-email-customizer.php';

// Check if plugin exists
if (!file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
    die('Plugin file not found: ' . WP_PLUGIN_DIR . '/' . $plugin);
}

// Activate plugin
$result = activate_plugin($plugin);

if (is_wp_error($result)) {
    echo '<h1>Plugin Activation Failed</h1>';
    echo '<p>Error: ' . $result->get_error_message() . '</p>';
} else {
    echo '<h1>✓ Plugin Activated Successfully!</h1>';
    echo '<p>Flora Email Customizer has been activated.</p>';
    echo '<p><a href="/wp-admin/plugins.php">View Plugins</a></p>';
    echo '<p><a href="/wp-admin/admin.php?page=wc-settings&tab=email">View Email Settings</a></p>';
}

// Clean up - delete this file
@unlink(__FILE__);
?>

