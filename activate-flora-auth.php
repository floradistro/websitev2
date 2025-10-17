<?php
// Simple plugin activator - Visit this file in browser to activate
// URL: https://api.floradistro.com/activate-flora-auth.php

require_once('wp-load.php');

// Security check
$secret = isset($_GET['secret']) ? $_GET['secret'] : '';
if ($secret !== 'flora2024') {
    die('Invalid access. Add ?secret=flora2024 to URL');
}

$plugin = 'flora-auth-endpoint.php';
$current_plugins = get_option('active_plugins', array());

if (!in_array($plugin, $current_plugins)) {
    $current_plugins[] = $plugin;
    update_option('active_plugins', $current_plugins);
    
    // Flush rewrite rules to register REST endpoint
    flush_rewrite_rules();
    
    echo '<h1>✅ Success!</h1>';
    echo '<p>Flora Customer Authentication plugin has been activated.</p>';
    echo '<p>Testing endpoint...</p>';
    
    // Test the endpoint
    $test_url = home_url('/wp-json/flora-auth/v1/login');
    echo "<p>Endpoint should be available at: <a href='$test_url'>$test_url</a></p>";
    echo '<p><strong>Delete this file now for security!</strong></p>';
    echo '<p>File to delete: activate-flora-auth.php</p>';
} else {
    echo '<h1>ℹ️ Already Active</h1>';
    echo '<p>Flora Customer Authentication plugin is already activated.</p>';
    echo '<p>Endpoint: ' . home_url('/wp-json/flora-auth/v1/login') . '</p>';
    echo '<p>You can delete this file now.</p>';
}
?>

