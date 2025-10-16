<?php
/**
 * Email Header
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/email-header.php.
 */

if (!defined('ABSPATH')) {
    exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=<?php bloginfo('charset'); ?>" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title><?php echo get_bloginfo('name', 'display'); ?></title>
</head>
<body <?php echo is_rtl() ? 'rightmargin' : 'leftmargin'; ?>="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin:0;padding:0;background-color:#b5b5b2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div id="wrapper" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>" style="background-color:#b5b5b2;margin:0;padding:40px 0;width:100%;">
        <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="background-color:#b5b5b2;">
            <tr>
                <td align="center" valign="top">
                    <div id="template_header_image">
                        <?php
                        $img = get_option('woocommerce_email_header_image');
                        if ($img) {
                            echo '<p style="margin-top:0;"><img src="' . esc_url($img) . '" alt="' . get_bloginfo('name', 'display') . '" /></p>';
                        }
                        ?>
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="600" id="template_container" style="background-color:#ffffff;border:1px solid rgba(0,0,0,0.05);box-shadow:0 2px 4px rgba(0,0,0,0.05);max-width:600px;">
                        <tr>
                            <td align="center" valign="top">
                                <!-- Header -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_header" style="background-color:#1a1a1a;color:#ffffff;border-bottom:1px solid rgba(255,255,255,0.1);">
                                    <tr>
                                        <td align="center" valign="middle" style="padding:30px 40px;text-align:center;">
                                            <img src="<?php echo esc_url(get_site_url() . '/wp-content/uploads/logoprint.png'); ?>" 
                                                 alt="Flora Distro" 
                                                 style="width:50px;height:auto;margin:0 auto 15px auto;display:block;border:none;" />
                                            <h1 style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:28px;font-weight:300;letter-spacing:0.02em;margin:10px 0 0 0;text-align:center;line-height:1.2;">
                                                <?php echo esc_html($email_heading); ?>
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                                <!-- End Header -->
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top">
                                <!-- Body -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" id="template_body">
                                    <tr>
                                        <td valign="top" id="body_content" style="background-color:#ffffff;padding:40px;">
                                            <!-- Content -->
                                            <table border="0" cellpadding="20" cellspacing="0" width="100%">
                                                <tr>
                                                    <td valign="top" style="padding:0;">
                                                        <div id="body_content_inner" style="color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;text-align:left;">

