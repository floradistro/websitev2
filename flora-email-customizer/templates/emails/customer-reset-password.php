<?php
/**
 * Customer reset password email
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/customer-reset-password.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

do_action('woocommerce_email_header', $email_heading, $email); ?>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('Hi %s,', 'woocommerce'), esc_html($user_login)); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('Someone has requested a password reset for your account. If this was a mistake, just ignore this email and nothing will happen.', 'woocommerce'); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('To reset your password, visit the following address:', 'woocommerce'); ?>
</p>

<p style="margin:20px 0 16px 0;text-align:center;">
    <a href="<?php echo esc_url(add_query_arg(array('key' => $reset_key, 'id' => $user_id), wc_get_endpoint_url('lost-password', '', wc_get_page_permalink('myaccount')))); ?>" 
       style="display:inline-block;background-color:#000000;border:1px solid rgba(255,255,255,0.2);color:#ffffff !important;font-size:12px;font-weight:400;letter-spacing:0.1em;padding:14px 30px;text-align:center;text-decoration:none !important;text-transform:uppercase;">
        <?php esc_html_e('Reset Password', 'woocommerce'); ?>
    </a>
</p>

<p style="margin:20px 0 16px 0;font-size:12px;line-height:1.6;color:#6a6a6a;text-align:center;">
    <?php esc_html_e('Or copy and paste this link into your browser:', 'woocommerce'); ?>
</p>

<p style="margin:0 0 16px 0;font-size:11px;line-height:1.6;color:#6a6a6a;word-break:break-all;text-align:center;">
    <?php echo esc_url(add_query_arg(array('key' => $reset_key, 'id' => $user_id), wc_get_endpoint_url('lost-password', '', wc_get_page_permalink('myaccount')))); ?>
</p>

<p style="margin:30px 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('This link will expire in 24 hours for security reasons.', 'woocommerce'); ?>
</p>

<?php do_action('woocommerce_email_footer', $email); ?>

