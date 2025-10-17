<?php
/**
 * Clear OPcache and Object Cache
 */

// Clear opcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache cleared\n";
} else {
    echo "⚠️ OPcache not available\n";
}

// Clear APCu if available
if (function_exists('apcu_clear_cache')) {
    apcu_clear_cache();
    echo "✅ APCu cache cleared\n";
}

// Load WordPress to clear object cache
if (file_exists('public_html/wp-load.php')) {
    require_once('public_html/wp-load.php');
    
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
        echo "✅ WordPress object cache cleared\n";
    }
    
    echo "\n🔄 All caches cleared!\n";
    echo "🧪 Test CORS now\n\n";
} else {
    echo "WordPress not found\n";
}

phpinfo(INFO_GENERAL);

