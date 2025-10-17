<?php
/**
 * Direct CORS Test - Bypasses all caching
 */

$allowed_origins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://websitev2-ashen.vercel.app',
    'https://web2-seven-bice.vercel.app',
    'https://floradistro.com',
    'https://www.floradistro.com',
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Check if origin is in allowed list OR is a Vercel preview URL
$is_vercel_preview = strpos($origin, 'vercel.app') !== false && 
                     strpos($origin, 'floradistros-projects') !== false;

if (in_array($origin, $allowed_origins) || $is_vercel_preview) {
    header('Access-Control-Allow-Origin: ' . $origin);
    echo "✅ CORS Fixed! Origin: $origin\n";
} else {
    header('Access-Control-Allow-Origin: ' . $origin);
    echo "⚠️ Unknown origin allowed: $origin\n";
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo "Origin detected: $origin\n";
echo "Is Vercel preview: " . ($is_vercel_preview ? 'YES' : 'NO') . "\n";
echo "In allowed list: " . (in_array($origin, $allowed_origins) ? 'YES' : 'NO') . "\n";
echo "\nShould work now!\n";

