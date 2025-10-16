# WordPress/WooCommerce Email Templates Audit
**Date**: October 16, 2025  
**Site**: https://api.floradistro.com  
**Purpose**: Update all system emails to match Flora Distro website design

---

## Design Requirements
Based on the Flora Distro website at `/Users/whale/Desktop/Website`:

### Brand Colors
- **Primary Background**: `#b5b5b2` (warm gray)
- **Dark Sections**: `#1a1a1a` (near black)
- **Text Primary**: `#000000` (black)
- **Text Secondary**: `#6a6a6a` (gray)
- **Accent**: White with subtle shadows

### Typography
- **Logo Font**: DonGraffiti (custom)
- **Body Font**: Geist Sans / -apple-system fallback
- **Style**: Uppercase tracking for headings, clean minimalist design
- **Letter Spacing**: 0.02em for headings, -0.01em for body

### Design Elements
- Minimal, premium aesthetic
- Subtle shadows and borders
- Clean black & white contrast
- Modern, Apple-inspired UI

---

## WooCommerce Customer Emails

### Order Emails
1. **New Order** (`emails/customer-new-order.php`)
   - Sent to customer when order is placed
   - Contains: Order details, billing/shipping info, payment method

2. **Processing Order** (`emails/customer-processing-order.php`)
   - Order received and payment confirmed
   - Most common order confirmation email
   - Contains: Order summary, shipping details, download links (if applicable)

3. **Completed Order** (`emails/customer-completed-order.php`)
   - Order marked as complete/delivered
   - Contains: Final order confirmation, review request opportunity

4. **Refunded Order** (`emails/customer-refunded-order.php`)
   - Full or partial refund issued
   - Contains: Refund amount, original order details

5. **Invoice/Order Details** (`emails/customer-invoice.php`)
   - Pay for order link (for pending/failed payments)
   - Contains: Invoice details, payment link

6. **On-hold Order** (`emails/customer-on-hold-order.php`)
   - Order received, awaiting payment confirmation
   - Contains: Order details, payment instructions

7. **Failed Order** (`emails/customer-failed-order.php`)
   - Payment failed notification
   - Contains: Order details, retry payment link

### Account Emails
8. **New Account** (`emails/customer-new-account.php`)
   - Welcome email when customer registers
   - Contains: Username, password set link, account details

9. **Reset Password** (`emails/customer-reset-password.php`)
   - Password reset request
   - Contains: Reset link, expiration time

### Note Emails
10. **Customer Note** (`emails/customer-note.php`)
    - Admin adds note to order
    - Contains: Note content, order reference

---

## WooCommerce Admin Emails

### Order Notifications
11. **New Order (Admin)** (`emails/admin-new-order.php`)
    - Notify admin of new order
    - Contains: Full order details, customer info

12. **Cancelled Order** (`emails/admin-cancelled-order.php`)
    - Order cancelled notification
    - Contains: Cancelled order details, reason

13. **Failed Order (Admin)** (`emails/admin-failed-order.php`)
    - Payment failure notification
    - Contains: Failed order details, customer info

---

## WordPress Core Emails

### User Account
14. **New User Registration (Admin)**
    - Admin notification of new user
    - Function: `wp_new_user_notification()`

15. **New User Registration (User)**
    - Welcome email with login credentials
    - Function: `wp_new_user_notification()`

16. **Password Reset**
    - Core WordPress password reset
    - Function: `retrieve_password_message`

17. **Email Address Change**
    - Confirm email address change
    - Function: `new_user_email_admin_notice`

18. **Password Change Notification**
    - Alert when password changed
    - Function: `wp_password_change_notification()`

### Site Admin
19. **Auto Core Update Success**
    - WordPress auto-update completed
    - Function: `auto_core_update_email()`

20. **Auto Core Update Failed**
    - WordPress auto-update failed
    - Function: `auto_core_update_email()`

21. **Comment Moderation**
    - New comment awaiting approval
    - Function: `wp_notify_moderator()`

22. **New Comment**
    - New comment notification
    - Function: `wp_notify_postauthor()`

---

## WooCommerce Subscription Emails (if applicable)
23. **New Renewal Order**
24. **Subscription Switch Complete**
25. **Subscription Cancelled**
26. **Subscription Expired**
27. **Subscription On-hold**
28. **Subscription Renewal Reminder**

---

## Other Plugin Emails to Consider

### Flora-specific Plugins
29. **Flora Fields Plugin** - Check for custom notifications
30. **Flora Inventory Matrix** - Check for inventory alerts
31. **Shipping API Notifications** - Delivery updates

### Common WooCommerce Extensions
32. **Order tracking emails**
33. **Abandoned cart emails** (if using plugin)
34. **Back in stock notifications** (if using plugin)
35. **Wholesale pricing notifications** (if applicable)

---

## Email Template Files Location

### WooCommerce Default Templates
```
wp-content/plugins/woocommerce/templates/emails/
├── admin-cancelled-order.php
├── admin-failed-order.php
├── admin-new-order.php
├── customer-completed-order.php
├── customer-invoice.php
├── customer-new-account.php
├── customer-note.php
├── customer-on-hold-order.php
├── customer-processing-order.php
├── customer-refunded-order.php
├── customer-reset-password.php
├── email-addresses.php
├── email-customer-details.php
├── email-footer.php
├── email-header.php
├── email-order-details.php
├── email-order-items.php
└── plain/ (plain text versions)
```

### Custom Override Location
```
wp-content/themes/YOUR-THEME/woocommerce/emails/
```

---

## WordPress Core Email Functions
Located in `wp-includes/pluggable.php`:
- `wp_mail()`
- `wp_password_change_notification()`
- `wp_new_user_notification()`
- `wp_notify_moderator()`
- `wp_notify_postauthor()`

---

## Customization Approach

### Option 1: Custom Plugin
Create `flora-email-templates` plugin to override all email templates

### Option 2: Theme Overrides
Add templates to theme's `woocommerce/emails/` directory

### Option 3: Email Customizer Plugin
Use with custom CSS/HTML:
- WooCommerce Email Customizer
- Kadence Email Designer
- Custom SMTP plugins

### Option 4: Custom Code (Recommended)
Build custom email templates matching website design:
- Use WordPress hooks: `woocommerce_email_header`, `woocommerce_email_footer`
- Filter: `woocommerce_email_styles`
- Custom HTML templates with inline CSS
- Match Flora Distro branding exactly

---

## Required Assets for Email Templates

### Images
- Flora Distro logo (`/logoprint.png`)
- Social media icons (Facebook, Instagram, Twitter, YouTube)

### Fonts
- DonGraffiti (use web-safe fallback for email compatibility)
- System fonts: -apple-system, BlinkMacSystemFont, "Segoe UI"

### Colors (Email-safe hex)
- `#b5b5b2` - Background
- `#1a1a1a` - Header/Footer
- `#000000` - Text
- `#6a6a6a` - Secondary text
- `#ffffff` - Accent/borders

### Email CSS Constraints
- Inline CSS only (email clients strip `<style>` tags)
- Table-based layouts for compatibility
- Web-safe fonts with fallbacks
- No external stylesheets
- No JavaScript
- Limited CSS3 support

---

## Next Steps

1. **Audit Current Emails**
   - Log into https://api.floradistro.com/wp-admin
   - Navigate to WooCommerce > Settings > Emails
   - Review each email template
   - Take screenshots of current state

2. **Design Email Templates**
   - Create HTML email templates matching website
   - Use table-based layout for email compatibility
   - Include Flora Distro branding (logo, colors, fonts)
   - Add social media links in footer
   - Ensure mobile responsiveness

3. **Build Custom Plugin**
   - Create `flora-email-customizer` plugin
   - Override WooCommerce email templates
   - Add custom WordPress email filters
   - Include email preview functionality

4. **Test All Emails**
   - Test each email type
   - Check rendering across email clients:
     - Gmail (web, iOS, Android)
     - Apple Mail
     - Outlook (Windows, Mac, web)
     - Yahoo Mail
     - Mobile devices

5. **Deploy & Monitor**
   - Upload to production
   - Monitor delivery rates
   - Track customer feedback
   - A/B test if needed

---

## Priority Order

### High Priority (Customer-facing)
1. ✅ Processing Order (most common)
2. ✅ New Account Welcome
3. ✅ Password Reset
4. ✅ Completed Order
5. ✅ Invoice/Payment Link

### Medium Priority
6. ✅ Refunded Order
7. ✅ On-hold Order
8. ✅ Failed Order
9. ✅ Customer Note
10. ✅ Order Tracking Updates

### Low Priority (Admin-only)
11. ✅ Admin New Order
12. ✅ Admin Cancelled Order
13. ✅ Core Update Notifications

---

## Technical Specifications

### Email Template Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flora Distro</title>
</head>
<body style="margin:0;padding:0;background-color:#b5b5b2;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <!-- Header -->
    <tr>
      <td style="background-color:#1a1a1a;padding:20px;text-align:center;">
        <img src="https://api.floradistro.com/wp-content/uploads/logoprint.png" alt="Flora Distro" width="50">
        <h1 style="color:#ffffff;font-family:-apple-system,sans-serif;">Flora Distro</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:40px 20px;background-color:#ffffff;">
        <!-- Email content here -->
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:#1a1a1a;padding:30px;text-align:center;color:#ffffff;">
        <!-- Footer content -->
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Email Compliance Requirements

### CAN-SPAM Act
- ✅ Include physical mailing address
- ✅ Clear unsubscribe link (for marketing emails)
- ✅ Accurate "From" name and email
- ✅ Clear subject lines

### GDPR
- ✅ Data processing disclosure
- ✅ Opt-in confirmation for marketing
- ✅ Privacy policy link
- ✅ Right to unsubscribe

### Accessibility
- ✅ Alt text for all images
- ✅ Semantic HTML structure
- ✅ Sufficient color contrast
- ✅ Plain text alternative version

---

## Contact Information to Include

**Flora Distro**  
Email: support@floradistro.com  
Website: https://floradistro.com  
API: https://api.floradistro.com

**Social Media**
- Facebook: /floradistro
- Instagram: @floradistro
- Twitter: @floradistro
- YouTube: @floradistro

**Legal Pages**
- Privacy Policy: /privacy
- Terms of Service: /terms
- Shipping Policy: /shipping
- Return Policy: /returns
- Cookie Policy: /cookies

---

## Estimated Timeline

- **Discovery & Audit**: 1-2 days
- **Design Email Templates**: 3-4 days
- **Development**: 5-7 days
- **Testing**: 2-3 days
- **Deployment**: 1 day
- **Total**: ~2 weeks

---

## Budget Considerations

### Resources Needed
- Email template designer
- WordPress/WooCommerce developer
- QA tester (email clients)
- Email deliverability monitoring tools

### Tools/Services
- Email testing service (Litmus, Email on Acid)
- SMTP service (if not already using)
- Analytics/tracking integration

---

## Success Metrics

- ✅ All emails match website branding
- ✅ Mobile responsive design
- ✅ 95%+ email client compatibility
- ✅ Improved open rates
- ✅ Reduced customer support tickets
- ✅ Positive customer feedback
- ✅ Maintains deliverability rates


