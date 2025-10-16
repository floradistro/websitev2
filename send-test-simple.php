<?php
/**
 * Simple Test Email Sender for Flora Distro
 */

define('WP_USE_THEMES', false);
require_once('./wp-load.php');

$test_email = 'fahad@cwscommercial.com';

echo "Sending test emails to: $test_email\n\n";

if (!class_exists('WooCommerce')) {
    die("WooCommerce not active\n");
}

// Get most recent order
$orders = wc_get_orders(array('limit' => 1, 'orderby' => 'date', 'order' => 'DESC'));
if (empty($orders)) {
    die("No orders found\n");
}

$order = $orders[0];
$order->set_billing_email($test_email);
$order->save();

echo "Using Order #" . $order->get_id() . "\n\n";

// Get mailer
$mailer = WC()->mailer();
$emails = $mailer->get_emails();

// Send Processing Order Email
echo "1. Processing Order Email... ";
if (isset($emails['WC_Email_Customer_Processing_Order'])) {
    $email = $emails['WC_Email_Customer_Processing_Order'];
    $result = $email->trigger($order->get_id());
    echo $result ? "✓ Sent\n" : "✗ Failed\n";
} else {
    echo "✗ Email class not found\n";
}

// Send Completed Order Email  
echo "2. Completed Order Email... ";
if (isset($emails['WC_Email_Customer_Completed_Order'])) {
    $email = $emails['WC_Email_Customer_Completed_Order'];
    $result = $email->trigger($order->get_id());
    echo $result ? "✓ Sent\n" : "✗ Failed\n";
} else {
    echo "✗ Email class not found\n";
}

// Send Invoice Email
echo "3. Customer Invoice Email... ";
if (isset($emails['WC_Email_Customer_Invoice'])) {
    $email = $emails['WC_Email_Customer_Invoice'];
    $result = $email->trigger($order->get_id());
    echo $result ? "✓ Sent\n" : "✗ Failed\n";
} else {
    echo "✗ Email class not found\n";
}

// Send Admin New Order
echo "4. Admin New Order Email... ";
if (isset($emails['WC_Email_New_Order'])) {
    $email = $emails['WC_Email_New_Order'];
    add_filter('woocommerce_email_recipient_new_order', function() use ($test_email) {
        return $test_email;
    });
    $result = $email->trigger($order->get_id());
    echo $result ? "✓ Sent\n" : "✗ Failed\n";
} else {
    echo "✗ Email class not found\n";
}

echo "\n✅ Complete! Check inbox: $test_email\n";
echo "Emails should show Flora Distro branding with logo, colors, and footer links.\n";

// Cleanup
@unlink(__FILE__);
?>

