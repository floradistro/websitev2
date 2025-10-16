<?php
/**
 * Send Test Emails to fahad@cwscommercial.com
 * Upload to WordPress root and run via browser or CLI
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

// Test email recipient
$test_email = 'fahad@cwscommercial.com';

echo '<h1>Sending Flora Distro Test Emails</h1>';
echo '<p>Recipient: ' . esc_html($test_email) . '</p>';
echo '<hr>';

// Check if WooCommerce is active
if (!class_exists('WooCommerce')) {
    die('WooCommerce is not active!');
}

// Get WooCommerce mailer
$mailer = WC()->mailer();

// Get a recent order for testing (or create a test order)
$orders = wc_get_orders(array(
    'limit' => 1,
    'orderby' => 'date',
    'order' => 'DESC',
));

if (empty($orders)) {
    echo '<p style="color: orange;">⚠️ No orders found. Creating test order...</p>';
    
    // Create a test order
    $order = wc_create_order();
    $order->set_billing_first_name('Fahad');
    $order->set_billing_last_name('Test');
    $order->set_billing_email($test_email);
    $order->set_billing_phone('555-1234');
    $order->set_billing_address_1('123 Test Street');
    $order->set_billing_city('Los Angeles');
    $order->set_billing_state('CA');
    $order->set_billing_postcode('90001');
    $order->set_billing_country('US');
    
    // Add a test product
    $products = wc_get_products(array('limit' => 1));
    if (!empty($products)) {
        $order->add_product($products[0], 2);
    } else {
        // Create dummy line item
        $item = new WC_Order_Item_Product();
        $item->set_name('Flora Test Product');
        $item->set_quantity(2);
        $item->set_subtotal(99.99);
        $item->set_total(99.99);
        $order->add_item($item);
    }
    
    $order->calculate_totals();
    $order->save();
    
    echo '<p style="color: green;">✓ Test order created: #' . $order->get_id() . '</p>';
} else {
    $order = $orders[0];
    echo '<p style="color: green;">✓ Using existing order: #' . $order->get_id() . '</p>';
}

// Update order email to test recipient
$order->set_billing_email($test_email);
$order->save();

echo '<hr>';
echo '<h2>Sending Test Emails...</h2>';

// 1. Processing Order Email
echo '<p><strong>1. Processing Order Email</strong><br>';
try {
    $emails = $mailer->get_emails();
    if (isset($emails['WC_Email_Customer_Processing_Order'])) {
        $email = $emails['WC_Email_Customer_Processing_Order'];
        $email->trigger($order->get_id());
        echo '✅ Processing Order email sent!</p>';
    }
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . '</p>';
}

// 2. Completed Order Email
echo '<p><strong>2. Completed Order Email</strong><br>';
try {
    if (isset($emails['WC_Email_Customer_Completed_Order'])) {
        $email = $emails['WC_Email_Customer_Completed_Order'];
        $email->trigger($order->get_id());
        echo '✅ Completed Order email sent!</p>';
    }
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . '</p>';
}

// 3. Invoice Email
echo '<p><strong>3. Customer Invoice Email</strong><br>';
try {
    if (isset($emails['WC_Email_Customer_Invoice'])) {
        $email = $emails['WC_Email_Customer_Invoice'];
        $email->trigger($order->get_id());
        echo '✅ Invoice email sent!</p>';
    }
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . '</p>';
}

// 4. New Account Email (simulate)
echo '<p><strong>4. New Account Welcome Email</strong><br>';
try {
    // Check if user exists
    $user = get_user_by('email', $test_email);
    if (!$user) {
        // Create test user
        $user_id = wp_create_user('fahad_test_' . time(), wp_generate_password(), $test_email);
        if (!is_wp_error($user_id)) {
            $user = get_user_by('id', $user_id);
        }
    }
    
    if ($user && isset($emails['WC_Email_Customer_New_Account'])) {
        $email = $emails['WC_Email_Customer_New_Account'];
        $email->trigger($user->ID, wp_generate_password(), true);
        echo '✅ Welcome email sent!</p>';
    }
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . '</p>';
}

// 5. Admin New Order Email
echo '<p><strong>5. Admin New Order Notification</strong><br>';
try {
    if (isset($emails['WC_Email_New_Order'])) {
        $email = $emails['WC_Email_New_Order'];
        // Override recipient to test email
        add_filter('woocommerce_email_recipient_new_order', function($recipient) use ($test_email) {
            return $test_email;
        });
        $email->trigger($order->get_id());
        echo '✅ Admin notification sent!</p>';
    }
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . '</p>';
}

echo '<hr>';
echo '<h2>✅ Test Complete!</h2>';
echo '<p>Check the inbox for: <strong>' . esc_html($test_email) . '</strong></p>';
echo '<p>You should receive 5 emails with Flora Distro branding:</p>';
echo '<ul>';
echo '<li>✉️ Processing Order Confirmation</li>';
echo '<li>✉️ Completed Order Notification</li>';
echo '<li>✉️ Customer Invoice</li>';
echo '<li>✉️ Welcome to Flora Distro</li>';
echo '<li>✉️ Admin New Order Alert</li>';
echo '</ul>';

echo '<p><a href="/wp-admin/admin.php?page=wc-settings&tab=email">View Email Settings</a></p>';

// Clean up - delete this file
@unlink(__FILE__);
?>

