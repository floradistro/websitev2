<?php
/**
 * Plugin Name: Flora Email Customizer
 * Plugin URI: https://floradistro.com
 * Description: Custom email templates matching Flora Distro website design
 * Version: 1.0.0
 * Author: Flora Distro
 * Author URI: https://floradistro.com
 * Text Domain: flora-email
 * Domain Path: /languages
 * Requires at least: 5.9
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 * WC tested up to: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('FLORA_EMAIL_VERSION')) {
    define('FLORA_EMAIL_VERSION', '1.0.0');
}

if (!defined('FLORA_EMAIL_PLUGIN_DIR')) {
    define('FLORA_EMAIL_PLUGIN_DIR', plugin_dir_path(__FILE__));
}

if (!defined('FLORA_EMAIL_PLUGIN_URL')) {
    define('FLORA_EMAIL_PLUGIN_URL', plugin_dir_url(__FILE__));
}

class Flora_Email_Customizer {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
    }
    
    public function init() {
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }
        
        // Override WooCommerce email templates
        add_filter('woocommerce_locate_template', array($this, 'locate_template'), 10, 3);
        
        // Customize email styles
        add_filter('woocommerce_email_styles', array($this, 'custom_email_styles'), 10, 2);
        
        // Customize WordPress core emails
        add_filter('wp_mail_from_name', array($this, 'custom_email_from_name'));
        add_filter('retrieve_password_message', array($this, 'custom_password_reset_email'), 10, 4);
        add_filter('wp_new_user_notification_email', array($this, 'custom_new_user_email'), 10, 3);
        
        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    public function woocommerce_missing_notice() {
        ?>
        <div class="error">
            <p><?php esc_html_e('Flora Email Customizer requires WooCommerce to be installed and active.', 'flora-email'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Locate custom email templates
     */
    public function locate_template($template, $template_name, $template_path) {
        $plugin_template_path = FLORA_EMAIL_PLUGIN_DIR . 'templates/';
        
        if (file_exists($plugin_template_path . $template_name)) {
            return $plugin_template_path . $template_name;
        }
        
        return $template;
    }
    
    /**
     * Custom email styles matching Flora Distro design
     */
    public function custom_email_styles($css, $email) {
        $custom_css = "
            /* Flora Distro Email Styles */
            body {
                background-color: #b5b5b2;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                color: #000000;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            #wrapper {
                background-color: #b5b5b2;
                margin: 0;
                padding: 40px 0;
                width: 100%;
            }
            
            #template_container {
                background-color: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.05);
                border-radius: 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                max-width: 600px;
                margin: 0 auto;
            }
            
            #template_header {
                background-color: #1a1a1a;
                color: #ffffff;
                padding: 30px 40px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            #template_header h1 {
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 28px;
                font-weight: 300;
                letter-spacing: 0.02em;
                margin: 10px 0 0 0;
                text-align: center;
            }
            
            #template_body {
                background-color: #ffffff;
                padding: 40px;
            }
            
            #template_footer {
                background-color: #1a1a1a;
                color: rgba(255, 255, 255, 0.6);
                padding: 30px 40px;
                text-align: center;
            }
            
            #template_footer p {
                color: rgba(255, 255, 255, 0.6);
                font-size: 11px;
                line-height: 1.6;
                margin: 0 0 10px 0;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            h1, h2, h3, h4, h5, h6 {
                color: #000000;
                font-weight: 300;
                letter-spacing: 0.02em;
                margin: 0 0 20px 0;
            }
            
            h2 {
                font-size: 22px;
                line-height: 1.3;
            }
            
            p {
                color: #000000;
                font-size: 14px;
                line-height: 1.6;
                margin: 0 0 16px 0;
            }
            
            a {
                color: #000000;
                text-decoration: underline;
            }
            
            a:hover {
                color: #1a1a1a;
            }
            
            .button {
                background-color: #000000;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff !important;
                display: inline-block;
                font-size: 12px;
                font-weight: 400;
                letter-spacing: 0.1em;
                padding: 14px 30px;
                text-align: center;
                text-decoration: none !important;
                text-transform: uppercase;
                transition: all 0.3s ease;
            }
            
            .button:hover {
                background-color: #1a1a1a;
            }
            
            /* Order details table */
            table.td {
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-collapse: collapse;
                width: 100%;
            }
            
            table.td th,
            table.td td {
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 12px;
                text-align: left;
                vertical-align: middle;
            }
            
            table.td th {
                background-color: #f5f5f5;
                color: #000000;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.05em;
                text-transform: uppercase;
            }
            
            table.td td {
                font-size: 13px;
            }
            
            /* Addresses */
            .addresses {
                margin-bottom: 30px;
            }
            
            .addresses table {
                width: 100%;
            }
            
            .addresses td {
                padding: 0 0 15px 0;
                vertical-align: top;
                width: 50%;
            }
            
            .addresses h3 {
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.05em;
                margin: 0 0 10px 0;
                text-transform: uppercase;
            }
            
            .addresses address {
                font-size: 13px;
                font-style: normal;
                line-height: 1.6;
            }
            
            /* Social icons */
            .social-links {
                margin: 20px 0 0 0;
                text-align: center;
            }
            
            .social-links a {
                color: rgba(255, 255, 255, 0.6);
                display: inline-block;
                margin: 0 8px;
                text-decoration: none;
            }
            
            .social-links a:hover {
                color: #ffffff;
            }
            
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
                #template_container {
                    width: 100% !important;
                }
                
                #template_header,
                #template_body,
                #template_footer {
                    padding: 20px !important;
                }
                
                h1 {
                    font-size: 24px !important;
                }
                
                h2 {
                    font-size: 18px !important;
                }
                
                .addresses td {
                    display: block;
                    width: 100% !important;
                }
            }
        ";
        
        return $css . $custom_css;
    }
    
    /**
     * Custom email header
     */
    public function custom_email_header($email_heading, $email) {
        ?>
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="<?php echo esc_url(get_site_url() . '/wp-content/uploads/logoprint.png'); ?>" 
                 alt="Flora Distro" 
                 style="width: 50px; height: auto; margin: 0 auto 15px auto; display: block;" />
        </div>
        <?php
    }
    
    /**
     * Custom email footer
     */
    public function custom_email_footer($email_footer, $email) {
        ?>
        <div class="social-links">
            <a href="https://www.facebook.com/floradistro" target="_blank" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; margin: 0 8px; display: inline-block;">Facebook</a>
            <a href="https://www.instagram.com/floradistro" target="_blank" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; margin: 0 8px; display: inline-block;">Instagram</a>
            <a href="https://twitter.com/floradistro" target="_blank" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; margin: 0 8px; display: inline-block;">Twitter</a>
            <a href="https://www.youtube.com/@floradistro" target="_blank" style="color: rgba(255, 255, 255, 0.6); text-decoration: none; margin: 0 8px; display: inline-block;">YouTube</a>
        </div>
        <div style="margin-top: 20px;">
            <p style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin: 5px 0;">
                <a href="<?php echo esc_url(get_site_url() . '/privacy'); ?>" style="color: rgba(255, 255, 255, 0.4); text-decoration: none;">Privacy Policy</a> | 
                <a href="<?php echo esc_url(get_site_url() . '/terms'); ?>" style="color: rgba(255, 255, 255, 0.4); text-decoration: none;">Terms</a> | 
                <a href="<?php echo esc_url(get_site_url() . '/shipping'); ?>" style="color: rgba(255, 255, 255, 0.4); text-decoration: none;">Shipping</a> | 
                <a href="<?php echo esc_url(get_site_url() . '/returns'); ?>" style="color: rgba(255, 255, 255, 0.4); text-decoration: none;">Returns</a>
            </p>
            <p style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin: 15px 0 5px 0; text-transform: none; letter-spacing: normal; line-height: 1.6;">
                All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.
            </p>
        </div>
        <?php
    }
    
    /**
     * Custom email from name
     */
    public function custom_email_from_name($from_name) {
        return 'Flora Distro';
    }
    
    /**
     * Custom email from address based on email type
     */
    public function custom_email_from_address($from_email, $email = null) {
        // Order-related emails
        $order_emails = array(
            'customer_processing_order',
            'customer_completed_order',
            'customer_on_hold_order',
            'customer_invoice',
            'new_order',
            'cancelled_order',
            'failed_order',
            'customer_pos_completed_order',
            'customer_pos_refunded_order',
        );
        
        // Support-related emails
        $support_emails = array(
            'customer_refunded_order',
            'customer_note',
            'customer_reset_password',
            'customer_new_account',
            'customer_failed_order',
            'customer_cancelled_order',
        );
        
        // Get email ID if available
        $email_id = '';
        if (is_object($email) && isset($email->id)) {
            $email_id = $email->id;
        }
        
        // Determine which email to use
        if (in_array($email_id, $order_emails)) {
            return 'orders@floradistro.com';
        } elseif (in_array($email_id, $support_emails)) {
            return 'support@floradistro.com';
        }
        
        // Default to sales
        return 'sales@floradistro.com';
    }
    
    /**
     * Custom password reset email
     */
    public function custom_password_reset_email($message, $key, $user_login, $user_data) {
        $reset_url = network_site_url("wp-login.php?action=rp&key=$key&login=" . rawurlencode($user_login), 'login');
        
        $message = '<p>Hello,</p>';
        $message .= '<p>Someone has requested a password reset for the following account:</p>';
        $message .= '<p><strong>' . network_home_url('/') . '</strong></p>';
        $message .= '<p>Username: <strong>' . $user_login . '</strong></p>';
        $message .= '<p>If this was a mistake, please ignore this email and nothing will happen.</p>';
        $message .= '<p>To reset your password, visit the following address:</p>';
        $message .= '<p><a href="' . esc_url($reset_url) . '" class="button">Reset Password</a></p>';
        $message .= '<p>Or copy and paste this link into your browser:</p>';
        $message .= '<p>' . esc_url($reset_url) . '</p>';
        
        return $message;
    }
    
    /**
     * Custom new user email
     */
    public function custom_new_user_email($wp_new_user_notification_email, $user, $blogname) {
        $message = '<p>Welcome to Flora Distro!</p>';
        $message .= '<p>Your account has been created successfully.</p>';
        $message .= '<p><strong>Username:</strong> ' . $user->user_login . '</p>';
        $message .= '<p>To set your password, visit the following address:</p>';
        $message .= '<p><a href="' . esc_url(wp_login_url()) . '" class="button">Set Password</a></p>';
        $message .= '<p>We look forward to serving you.</p>';
        
        $wp_new_user_notification_email['message'] = $message;
        return $wp_new_user_notification_email;
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            __('Flora Email Customizer', 'flora-email'),
            __('Email Customizer', 'flora-email'),
            'manage_woocommerce',
            'flora-email-customizer',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('Flora Email Customizer', 'flora-email'); ?></h1>
            
            <div class="card">
                <h2><?php esc_html_e('Email Templates Status', 'flora-email'); ?></h2>
                <p><?php esc_html_e('All email templates are now using Flora Distro branding and design.', 'flora-email'); ?></p>
                
                <h3><?php esc_html_e('Customized Templates:', 'flora-email'); ?></h3>
                <ul>
                    <li>✅ WooCommerce Order Emails (Processing, Completed, Refunded, etc.)</li>
                    <li>✅ WooCommerce Account Emails (Welcome, Password Reset)</li>
                    <li>✅ WordPress Core Emails (Password Reset, New User)</li>
                    <li>✅ Custom Email Header & Footer</li>
                    <li>✅ Flora Distro Branding & Colors</li>
                </ul>
                
                <h3><?php esc_html_e('Design Elements:', 'flora-email'); ?></h3>
                <ul>
                    <li>Background Color: #b5b5b2</li>
                    <li>Header/Footer: #1a1a1a</li>
                    <li>Logo: Flora Distro</li>
                    <li>Social Links: Facebook, Instagram, Twitter, YouTube</li>
                    <li>Legal Compliance: Farm Bill Notice</li>
                </ul>
                
                <h3><?php esc_html_e('Test Emails:', 'flora-email'); ?></h3>
                <p>
                    <?php esc_html_e('To test email templates, go to:', 'flora-email'); ?>
                    <a href="<?php echo admin_url('admin.php?page=wc-settings&tab=email'); ?>">
                        <?php esc_html_e('WooCommerce > Settings > Emails', 'flora-email'); ?>
                    </a>
                </p>
            </div>
        </div>
        <?php
    }
}

// Initialize plugin
Flora_Email_Customizer::get_instance();

