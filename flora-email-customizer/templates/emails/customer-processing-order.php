<?php
/**
 * Customer processing order email
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/customer-processing-order.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

do_action('woocommerce_email_header', $email_heading, $email); ?>

<?php /* translators: %s: Customer first name */ ?>
<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('Hi %s,', 'woocommerce'), esc_html($order->get_billing_first_name())); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('Thank you for your order! We have received your payment and are now processing your order.', 'woocommerce'); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('Your order details are shown below for your reference:', 'woocommerce'); ?>
</p>

<?php
do_action('woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email);

echo '<h2 style="color:#000000;font-size:22px;font-weight:300;letter-spacing:0.02em;line-height:1.3;margin:30px 0 20px 0;">';
/* translators: %s: Order number */
echo esc_html(sprintf(__('Order #%s', 'woocommerce'), $order->get_order_number()));
echo '</h2>';

do_action('woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email);

echo '<table cellspacing="0" cellpadding="12" style="width:100%;border:1px solid rgba(0,0,0,0.1);border-collapse:collapse;margin:0 0 20px 0;" border="1">';
echo '<thead><tr>';
echo '<th style="text-align:left;padding:12px;background-color:#f5f5f5;color:#000000;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:1px solid rgba(0,0,0,0.1);">' . esc_html__('Product', 'woocommerce') . '</th>';
echo '<th style="text-align:left;padding:12px;background-color:#f5f5f5;color:#000000;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:1px solid rgba(0,0,0,0.1);">' . esc_html__('Quantity', 'woocommerce') . '</th>';
echo '<th style="text-align:right;padding:12px;background-color:#f5f5f5;color:#000000;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:1px solid rgba(0,0,0,0.1);">' . esc_html__('Price', 'woocommerce') . '</th>';
echo '</tr></thead>';
echo '<tbody>';

foreach ($order->get_items() as $item_id => $item) {
    $product = $item->get_product();
    echo '<tr>';
    echo '<td style="text-align:left;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;vertical-align:middle;">' . wp_kses_post(apply_filters('woocommerce_order_item_name', $item->get_name(), $item, false)) . '</td>';
    echo '<td style="text-align:left;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;vertical-align:middle;">' . esc_html($item->get_quantity()) . '</td>';
    echo '<td style="text-align:right;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;vertical-align:middle;">' . wp_kses_post($order->get_formatted_line_subtotal($item)) . '</td>';
    echo '</tr>';
}

echo '</tbody>';
echo '<tfoot>';

foreach ($order->get_order_item_totals() as $total) {
    echo '<tr>';
    echo '<th scope="row" colspan="2" style="text-align:left;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;font-weight:600;">' . wp_kses_post($total['label']) . '</th>';
    echo '<td style="text-align:right;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;font-weight:600;">' . wp_kses_post($total['value']) . '</td>';
    echo '</tr>';
}

echo '</tfoot>';
echo '</table>';

do_action('woocommerce_email_after_order_table', $order, $sent_to_admin, $plain_text, $email);
?>

<?php if ($order->get_customer_note()) : ?>
    <h3 style="color:#000000;font-size:18px;font-weight:300;letter-spacing:0.02em;margin:30px 0 15px 0;">
        <?php esc_html_e('Note:', 'woocommerce'); ?>
    </h3>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
        <?php echo wp_kses_post(nl2br(wptexturize($order->get_customer_note()))); ?>
    </p>
<?php endif; ?>

<?php do_action('woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email); ?>

<div class="addresses" style="margin:30px 0;">
    <table cellspacing="0" cellpadding="0" style="width:100%;vertical-align:top;margin-bottom:40px;" border="0">
        <tr>
            <td style="text-align:left;vertical-align:top;width:50%;padding:0 10px 0 0;">
                <h3 style="color:#000000;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:0 0 10px 0;text-transform:uppercase;">
                    <?php esc_html_e('Billing address', 'woocommerce'); ?>
                </h3>
                <address style="font-size:13px;line-height:1.6;font-style:normal;">
                    <?php echo wp_kses_post($order->get_formatted_billing_address()); ?>
                </address>
            </td>
            <?php if (!wc_ship_to_billing_address_only() && $order->needs_shipping_address()) : ?>
                <td style="text-align:left;vertical-align:top;width:50%;padding:0 0 0 10px;">
                    <h3 style="color:#000000;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:0 0 10px 0;text-transform:uppercase;">
                        <?php esc_html_e('Shipping address', 'woocommerce'); ?>
                    </h3>
                    <address style="font-size:13px;line-height:1.6;font-style:normal;">
                        <?php echo wp_kses_post($order->get_formatted_shipping_address()); ?>
                    </address>
                </td>
            <?php endif; ?>
        </tr>
    </table>
</div>

<p style="margin:30px 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('We will notify you when your order has been shipped.', 'woocommerce'); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('Thank you for choosing Flora Distro!', 'woocommerce'); ?>
</p>

<?php do_action('woocommerce_email_footer', $email); ?>

