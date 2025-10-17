<?php
// Temporary activation script - delete after use
require_once('wp-load.php');

$plugin = 'flora-auth-endpoint.php';
$current = get_option('active_plugins', array());

if (!in_array($plugin, $current)) {
    $current[] = $plugin;
    update_option('active_plugins', $current);
    echo '✅ Flora Auth Plugin Activated Successfully!<br>';
    echo 'Plugin is now active. You can delete this file.';
} else {
    echo '✅ Plugin Already Active';
}

