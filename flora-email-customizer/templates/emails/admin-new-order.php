<?php
/**
 * Admin new order email
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/admin-new-order.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

do_action('woocommerce_email_header', $email_heading, $email); ?>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('You have received an order from %s. The order details are as follows:', 'woocommerce'), esc_html($order->get_billing_first_name() . ' ' . $order->get_billing_last_name())); ?>
</p>

<?php
do_action('woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email);

echo '<h2 style="color:#000000;font-size:22px;font-weight:300;letter-spacing:0.02em;line-height:1.3;margin:30px 0 20px 0;">';
/* translators: %s: Order number */
echo esc_html(sprintf(__('Order #%s', 'woocommerce'), $order->get_order_number()));
echo '<span style="font-size:16px;font-weight:300;color:#6a6a6a;margin-left:10px;">(' . esc_html(wc_format_datetime($order->get_date_created())) . ')</span>';
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
    echo '<td style="text-align:left;padding:12px;border:1px solid rgba(0,0,0,0.1);font-size:13px;vertical-align:middle;">';
    echo wp_kses_post(apply_filters('woocommerce_order_item_name', $item->get_name(), $item, false));
    if ($product && $product->get_sku()) {
        echo '<br><small style="color:#6a6a6a;">SKU: ' . esc_html($product->get_sku()) . '</small>';
    }
    echo '</td>';
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
        <?php esc_html_e('Customer Note:', 'woocommerce'); ?>
    </h3>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;background-color:#f5f5f5;padding:15px;border-left:3px solid #000000;">
        <?php echo wp_kses_post(nl2br(wptexturize($order->get_customer_note()))); ?>
    </p>
<?php endif; ?>

<div class="addresses" style="margin:30px 0;">
    <table cellspacing="0" cellpadding="0" style="width:100%;vertical-align:top;margin-bottom:40px;" border="0">
        <tr>
            <td style="text-align:left;vertical-align:top;width:50%;padding:0 10px 0 0;">
                <h3 style="color:#000000;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:0 0 10px 0;text-transform:uppercase;">
                    <?php esc_html_e('Billing address', 'woocommerce'); ?>
                </h3>
                <address style="font-size:13px;line-height:1.6;font-style:normal;">
                    <?php echo wp_kses_post($order->get_formatted_billing_address()); ?>
                    <?php if ($order->get_billing_phone()) : ?>
                        <br><?php echo esc_html($order->get_billing_phone()); ?>
                    <?php endif; ?>
                    <?php if ($order->get_billing_email()) : ?>
                        <br><?php echo esc_html($order->get_billing_email()); ?>
                    <?php endif; ?>
                </address>
            </td>
            <?php if (!wc_ship_to_billing_address_only() && $order->needs_shipping_address()) : ?>
                <td style="text-align:left;vertical-align:top;width:50%;padding:0 0 0 10px;">
                    <h3 style="color:#000000;font-size:13px;font-weight:600;letter-spacing:0.05em;margin:0 0 10px 0;text-transform:uppercase;">
                        <?php esc_html_e('Shipping address', 'woocommerce'); ?>
                    </h3>
                    <address style="font-size:13px;line-height:1.6;font-style:normal;">
                        <?php echo wp_kses_post($order->get_formatted_shipping_address()); ?>
                        <?php if ($order->get_shipping_phone()) : ?>
                            <br><?php echo esc_html($order->get_shipping_phone()); ?>
                        <?php endif; ?>
                    </address>
                </td>
            <?php endif; ?>
        </tr>
    </table>
</div>

<p style="margin:20px 0 16px 0;text-align:center;">
    <a href="<?php echo esc_url(admin_url('post.php?post=' . absint($order->get_id()) . '&action=edit')); ?>" 
       style="display:inline-block;background-color:#000000;border:1px solid rgba(255,255,255,0.2);color:#ffffff !important;font-size:12px;font-weight:400;letter-spacing:0.1em;padding:14px 30px;text-align:center;text-decoration:none !important;text-transform:uppercase;">
        <?php esc_html_e('View Order in Admin', 'woocommerce'); ?>
    </a>
</p>

<?php do_action('woocommerce_email_footer', $email); ?>

