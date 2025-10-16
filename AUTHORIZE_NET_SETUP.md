# Authorize.net Payment Gateway Integration

## Overview
Complete Authorize.net payment integration with Apple Pay support for Flora Distro website.

## Features
✅ Accept.js tokenization (PCI compliant - no credit card data touches your server)
✅ Apple Pay support (where available)
✅ Full billing and shipping address collection
✅ WooCommerce order creation with proper payment processing
✅ Real-time payment status updates
✅ Secure payment token handling

---

## Installation Steps

### 1. WordPress Plugin Installation

Upload and activate the payment handler plugin on your WordPress site:

```bash
# From your local machine, upload the plugin file to WordPress
# Location: /Users/whale/Desktop/Website/authorize-net-api-payment.php

# Upload to: /wp-content/plugins/authorize-net-api-payment.php
```

**Via SSH:**
```bash
# SSH into your server
ssh u2736-pgt6vpiklij1@gvam1142.siteground.biz -p 18765

# Navigate to plugins directory
cd public_html/wp-content/plugins

# Create the plugin file
nano authorize-net-api-payment.php

# Paste the contents from authorize-net-api-payment.php
# Save and exit (Ctrl+X, then Y, then Enter)

# Set proper permissions
chmod 644 authorize-net-api-payment.php
```

**Then activate the plugin:**
- Go to WordPress Admin → Plugins
- Find "Authorize.net API Payment Handler"
- Click "Activate"

### 2. Configure Authorize.net Gateway in WooCommerce

Go to: **WooCommerce → Settings → Payments → Authorize.net CIM**

Required Settings:
- ✅ Enable/Disable: **Checked**
- **API Login ID**: Your Authorize.net API Login ID
- **Transaction Key**: Your Authorize.net Transaction Key  
- **Public Client Key**: Your Authorize.net Public Client Key
- **Environment**: Production (or Sandbox for testing)
- **Transaction Type**: Authorize and Capture
- ✅ Enable for Card Present: **Checked**

### 3. Environment Variables

The Next.js app already has the correct environment variables in `.env.local`:

```env
WORDPRESS_API_URL=https://api.floradistro.com
WORDPRESS_CONSUMER_KEY=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
WORDPRESS_CONSUMER_SECRET=cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```

### 4. Apple Pay Configuration (Optional)

To enable Apple Pay:

1. **Register your domain with Apple:**
   - Go to Apple Developer Portal
   - Register your domain: `floradistro.com`
   - Download the domain verification file
   - Upload to: `/.well-known/apple-developer-merchantid-domain-association`

2. **Configure in Authorize.net:**
   - Login to Authorize.net Merchant Interface
   - Go to Account → Payment Methods → Apple Pay
   - Add your domain
   - Enable Apple Pay

3. **SSL Required:**
   - Apple Pay only works on HTTPS domains
   - Your production domain must have a valid SSL certificate

---

## How It Works

### Payment Flow

1. **Customer enters payment info** on checkout page
2. **Accept.js tokenizes** the credit card (client-side, secure)
3. **Token sent to Next.js API** at `/api/payment`
4. **Next.js creates WooCommerce order** with payment token in meta data
5. **WordPress plugin detects order** and processes payment via Authorize.net
6. **Payment approved/declined** → Order status updated
7. **Customer redirected** to order confirmation page

### Security Features

- **No credit card data** stored on your server
- **PCI DSS compliant** via Accept.js tokenization
- **SSL encrypted** communication
- **WordPress REST API** authentication via OAuth

---

## API Endpoints

### GET `/api/authorize-keys`
Fetches Authorize.net public keys from WordPress

**Response:**
```json
{
  "success": true,
  "clientKey": "...",
  "apiLoginId": "...",
  "environment": "production"
}
```

### POST `/api/payment`
Processes payment and creates WooCommerce order

**Request:**
```json
{
  "payment_token": "token_from_accept_js",
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "city": "Asheville",
    "state": "NC",
    "zipCode": "28801",
    "country": "US"
  },
  "shipping": { /* optional, if different from billing */ },
  "items": [ /* cart items */ ],
  "shipping_method": { /* selected shipping method */ },
  "shipping_cost": 0,
  "total": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "order_id": 12345,
  "order_number": "12345",
  "order_key": "wc_order_...",
  "status": "processing",
  "total": "100.00"
}
```

---

## Testing

### Test Card Numbers (Sandbox Mode)

- **Visa**: 4007000000027
- **Mastercard**: 5424000000000015
- **Amex**: 370000000000002
- **Discover**: 6011000000000012

**Expiry**: Any future date  
**CVV**: Any 3-4 digits  
**ZIP**: Any 5 digits

### Test the Integration

1. Add products to cart
2. Go to checkout
3. Fill in billing information
4. Enter test card number
5. Submit payment
6. Verify order is created in WooCommerce
7. Check order notes for payment status

---

## Troubleshooting

### Payment Token Not Found
- Check that Accept.js script is loading (inspect Network tab)
- Verify Authorize.net credentials are correct in WooCommerce settings
- Check browser console for JavaScript errors

### Payment Declined
- Verify Authorize.net credentials (API Login ID, Transaction Key)
- Check Authorize.net dashboard for transaction details
- Ensure account is active and not in test mode (if using production)

### Order Created but Payment Not Processed
- Check WordPress error logs: `wp-content/debug.log`
- Verify plugin is activated
- Check WooCommerce → Status → Logs for authorize.net logs

### Apple Pay Not Showing
- Verify you're on HTTPS
- Check that domain is registered with Apple
- Ensure Apple Pay is enabled in Authorize.net merchant interface
- Test on Safari browser (Apple Pay only works on Safari/iOS)

---

## Production Deployment

### Build and Deploy

```bash
cd /Users/whale/Desktop/Website

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Vercel Deployment

If using Vercel:

1. Connect GitHub repository
2. Add environment variables in Vercel dashboard:
   - `WORDPRESS_API_URL`
   - `WORDPRESS_CONSUMER_KEY`
   - `WORDPRESS_CONSUMER_SECRET`
3. Deploy

---

## Support & Maintenance

### Logs to Monitor

- **WordPress**: `wp-content/debug.log`
- **Authorize.net**: Merchant Interface → Transaction Search
- **WooCommerce**: WooCommerce → Status → Logs
- **Next.js**: Server console output

### Regular Checks

- ✅ Test payments monthly
- ✅ Update Authorize.net plugin when available
- ✅ Monitor failed payment logs
- ✅ Verify SSL certificate validity
- ✅ Check Authorize.net account for holds/issues

---

## Files Modified/Created

### New Files
- `app/api/payment/route.ts` - Payment processing endpoint
- `app/api/authorize-keys/route.ts` - Authorize.net keys endpoint
- `authorize-net-api-payment.php` - WordPress payment handler plugin

### Modified Files
- `app/checkout/page.tsx` - Complete checkout page with Accept.js and Apple Pay
- `.env.local` - Environment variables

---

## Next Steps

1. ✅ Install WordPress plugin on production server
2. ✅ Configure Authorize.net in WooCommerce
3. ✅ Test with sandbox credentials
4. ✅ Switch to production credentials
5. ✅ Test live payment
6. ✅ Configure Apple Pay (optional)
7. ✅ Monitor first few orders

---

## Questions?

Check Authorize.net documentation:
- https://developer.authorize.net/api/reference/
- https://developer.authorize.net/api/reference/features/acceptjs.html
- https://developer.authorize.net/api/reference/features/in-app.html (Apple Pay)

