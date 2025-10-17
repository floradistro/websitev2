<?php
/**
 * Force reload PHP files by touching main plugin files
 * This forces SiteGround to recompile the plugins
 */

$files_to_touch = [
    'public_html/wp-content/plugins/flora-inventory-matrix/flora-inventory-matrix.php',
    'public_html/wp-content/plugins/Magic2/magic2.php',
    'public_html/wp-content/mu-plugins/flora-order-ajax.php',
];

foreach ($files_to_touch as $file) {
    if (file_exists($file)) {
        touch($file);
        echo "✅ Touched: $file\n";
    } else {
        echo "❌ Not found: $file\n";
    }
}

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "\n✅ OPcache reset\n";
}

echo "\n🔄 All files touched - PHP will recompile on next request\n";
echo "⏱️ Test CORS in 5 seconds...\n";

