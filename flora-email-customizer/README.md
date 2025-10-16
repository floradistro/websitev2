# Flora Email Customizer

Custom WordPress/WooCommerce email templates matching Flora Distro website design.

## Overview

This plugin customizes all WordPress and WooCommerce email templates to match the Flora Distro brand:
- Colors: #b5b5b2 background, #1a1a1a header/footer
- Typography: Clean, modern fonts with proper letter spacing
- Branding: Flora Distro logo, social links, legal compliance
- Mobile-responsive design
- Email client compatibility

## Features

### WooCommerce Emails
- ✅ Order Processing
- ✅ Order Completed
- ✅ Order Refunded
- ✅ Order On-hold
- ✅ Order Failed
- ✅ Customer Invoice
- ✅ Customer Note
- ✅ New Account Welcome
- ✅ Password Reset

### WordPress Core Emails
- ✅ Password Reset
- ✅ New User Notification
- ✅ Email Change Confirmation

### Design Elements
- Flora Distro logo
- Custom colors matching website
- Social media links (Facebook, Instagram, Twitter, YouTube)
- Legal links (Privacy, Terms, Shipping, Returns)
- Farm Bill compliance notice
- Mobile-responsive tables

## Installation

### Method 1: Upload via WordPress Admin
1. Zip the `flora-email-customizer` folder
2. Go to WordPress Admin > Plugins > Add New
3. Click "Upload Plugin"
4. Choose the zip file
5. Click "Install Now"
6. Activate the plugin

### Method 2: FTP/SFTP Upload
1. Upload the `flora-email-customizer` folder to `/wp-content/plugins/`
2. Go to WordPress Admin > Plugins
3. Activate "Flora Email Customizer"

### Method 3: SSH (Recommended for Production)
```bash
# Connect to SiteGround
ssh u2736-pgt6vpiklij1@gvam1142.siteground.biz -p 18765

# Navigate to plugins directory
cd public_html/wp-content/plugins/

# Create plugin directory
mkdir flora-email-customizer
cd flora-email-customizer

# Upload files (use scp or git)
# Or create files directly using nano/vim

# Set proper permissions
chmod 755 /path/to/wp-content/plugins/flora-email-customizer
chmod 644 /path/to/wp-content/plugins/flora-email-customizer/*.php

# Activate via WP-CLI
wp plugin activate flora-email-customizer
```

## Configuration

### After Activation

1. **Verify Installation**
   - Go to WooCommerce > Email Customizer
   - Check that all templates are listed as active

2. **Test Emails**
   - Go to WooCommerce > Settings > Emails
   - Click on any email type
   - Scroll to bottom and use "Send a test email" button
   - Check your inbox for properly branded email

3. **Upload Logo**
   - Make sure `/wp-content/uploads/logoprint.png` exists
   - If not, upload Flora Distro logo to this location
   - Logo should be 200x200px or similar square format

4. **Verify Links**
   - Check that all footer links work:
     - /privacy (Privacy Policy)
     - /terms (Terms of Service)
     - /shipping (Shipping Policy)
     - /returns (Return Policy)
   - Update social media links if needed in `flora-email-customizer.php`

## Customization

### Change Colors

Edit `flora-email-customizer.php`, function `custom_email_styles()`:

```php
background-color: #b5b5b2;  // Main background
background-color: #1a1a1a;  // Header/footer
color: #000000;             // Text color
```

### Change Logo

Update logo path in `templates/emails/email-header.php`:

```php
<img src="<?php echo esc_url(get_site_url() . '/wp-content/uploads/YOUR-LOGO.png'); ?>" />
```

### Change Social Links

Edit `templates/emails/email-footer.php`:

```php
<a href="https://www.facebook.com/YOUR-PAGE">Facebook</a>
<a href="https://www.instagram.com/YOUR-HANDLE">Instagram</a>
```

### Change Email Text

Each email template can be customized in `templates/emails/`:
- `customer-processing-order.php` - Order confirmation
- `customer-completed-order.php` - Order complete
- `customer-new-account.php` - Welcome email
- etc.

## Testing

### Test in Multiple Email Clients

1. **Gmail** (web, iOS, Android)
2. **Apple Mail** (macOS, iOS)
3. **Outlook** (Windows, Mac, web)
4. **Yahoo Mail**
5. **Mobile devices**

### Testing Tools

- [Litmus](https://litmus.com/) - Email testing platform
- [Email on Acid](https://www.emailonacid.com/) - Cross-client testing
- [PutsMail](https://putsmail.com/) - Free test email sender

### Manual Testing

Send test orders through WooCommerce:
1. Create test product
2. Place test order
3. Process order (triggers processing email)
4. Complete order (triggers completed email)
5. Check all emails received

## Troubleshooting

### Emails Not Sending

1. Check SMTP configuration
2. Verify WooCommerce email settings
3. Test with WP Mail SMTP plugin
4. Check server email logs

### Emails Not Branded

1. Clear WooCommerce cache
2. Verify plugin is activated
3. Check template file paths
4. Ensure no theme override conflicts

### Logo Not Showing

1. Verify logo file exists at `/wp-content/uploads/logoprint.png`
2. Check file permissions (644)
3. Test logo URL directly in browser
4. Use absolute URL if relative fails

### Styling Issues

1. Email clients strip external CSS
2. All styles must be inline
3. Use table-based layouts
4. Test across multiple clients
5. Avoid complex CSS3 features

## File Structure

```
flora-email-customizer/
├── flora-email-customizer.php      # Main plugin file
├── README.md                       # This file
└── templates/
    └── emails/
        ├── email-header.php               # Email header template
        ├── email-footer.php               # Email footer template
        ├── customer-processing-order.php  # Processing order email
        ├── customer-completed-order.php   # Completed order email
        └── customer-new-account.php       # Welcome email
```

## API Credentials

**WordPress Production**
- URL: https://api.floradistro.com
- Consumer Key: `ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5`
- Consumer Secret: `cs_38194e74c7ddc5d72b6c32c70485728e7e529678`

**SiteGround SSH**
- Hostname: `gvam1142.siteground.biz`
- Username: `u2736-pgt6vpiklij1`
- Port: `18765`

## Support

For issues or questions:
1. Check WordPress error logs
2. Enable WP_DEBUG in wp-config.php
3. Review WooCommerce system status
4. Contact Flora Distro development team

## Changelog

### Version 1.0.0
- Initial release
- Custom email templates for WooCommerce
- Custom WordPress core email filters
- Flora Distro branding
- Mobile-responsive design
- Email client compatibility

## License

Proprietary - Flora Distro
All rights reserved.

## Credits

Developed for Flora Distro
Based on WooCommerce email template system

---

## Next Steps

1. ✅ Complete audit of all email types
2. ✅ Design matching Flora Distro website
3. ✅ Build custom plugin with templates
4. ⏳ Upload to WordPress production
5. ⏳ Test all email types
6. ⏳ Verify cross-client compatibility
7. ⏳ Deploy to production
8. ⏳ Monitor email delivery rates

## Production Deployment Checklist

- [ ] Backup WordPress site
- [ ] Upload plugin via SFTP/SSH
- [ ] Upload logo to `/wp-content/uploads/logoprint.png`
- [ ] Activate plugin in WordPress admin
- [ ] Test each email type
- [ ] Verify logo displays correctly
- [ ] Check all links in footer
- [ ] Test on mobile devices
- [ ] Verify social links work
- [ ] Check legal compliance text
- [ ] Test password reset email
- [ ] Test new account email
- [ ] Test order emails (processing, completed)
- [ ] Monitor email delivery rates
- [ ] Get customer feedback

## Email Testing Matrix

| Email Type | Desktop | Mobile | Gmail | Outlook | Apple Mail | Tested |
|------------|---------|--------|-------|---------|------------|--------|
| Processing Order | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| Completed Order | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| New Account | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| Password Reset | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| Order Refunded | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| Order Failed | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |
| Customer Note | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ❌ |

Fill in with ✅ (passed) or ❌ (failed) after testing.

