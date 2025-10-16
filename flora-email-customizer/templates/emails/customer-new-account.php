<?php
/**
 * Customer new account email
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/customer-new-account.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

do_action('woocommerce_email_header', $email_heading, $email); ?>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('Hi %s,', 'woocommerce'), esc_html($user_login)); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('Welcome to Flora Distro! Your account has been created successfully on %s.', 'woocommerce'), esc_html($blogname)); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('Your login credentials are as follows:', 'woocommerce'); ?>
</p>

<div style="background-color:#f5f5f5;border:1px solid rgba(0,0,0,0.1);padding:20px;margin:20px 0;">
    <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#000000;">
        <strong><?php esc_html_e('Username:', 'woocommerce'); ?></strong> <?php echo esc_html($user_login); ?>
    </p>
    
    <?php if ('yes' === $set_password_email) : ?>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#000000;">
            <strong><?php esc_html_e('Set your password:', 'woocommerce'); ?></strong>
        </p>
    <?php else : ?>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#000000;">
            <?php printf(esc_html__('Your password has been automatically generated: %s', 'woocommerce'), '<strong>' . esc_html($user_pass) . '</strong>'); ?>
        </p>
    <?php endif; ?>
</div>

<?php if ('yes' === $set_password_email) : ?>
    <p style="margin:20px 0 16px 0;text-align:center;">
        <a href="<?php echo esc_url(add_query_arg(array('key' => $reset_key, 'id' => $user_id), wc_get_endpoint_url('lost-password', '', wc_get_page_permalink('myaccount')))); ?>" 
           style="display:inline-block;background-color:#000000;border:1px solid rgba(255,255,255,0.2);color:#ffffff !important;font-size:12px;font-weight:400;letter-spacing:0.1em;padding:14px 30px;text-align:center;text-decoration:none !important;text-transform:uppercase;">
            <?php esc_html_e('Set Your Password', 'woocommerce'); ?>
        </a>
    </p>
<?php endif; ?>

<p style="margin:20px 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php printf(esc_html__('You can access your account area to view orders, change your password, and more at: %s', 'woocommerce'), '<a href="' . esc_url(wc_get_page_permalink('myaccount')) . '" style="color:#000000;">' . esc_url(wc_get_page_permalink('myaccount')) . '</a>'); ?>
</p>

<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#000000;">
    <?php esc_html_e('We look forward to serving you with premium quality products.', 'woocommerce'); ?>
</p>

<?php do_action('woocommerce_email_footer', $email); ?>

