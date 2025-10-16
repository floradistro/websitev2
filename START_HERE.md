# 🚀 Quick Start

## Start Development Server with HTTPS

```bash
cd /Users/whale/Desktop/Website
npm run dev:https
```

## Access Your Site

**HTTPS (Use This for Checkout)**: https://localhost:3443  
**HTTP (API only)**: http://localhost:3000

⚠️ **IMPORTANT**: Always use **https://localhost:3443** for testing checkout and payments.

---

## First Time Setup

1. Visit: https://localhost:3443
2. You'll see a security warning (normal for local dev)
3. Click "Advanced" → "Proceed to localhost"
4. Browser will remember this for future visits

---

## What's Working

✅ **Products Page** - Browse products with real WooCommerce data  
✅ **Pricing Tiers** - Dynamic pricing from Flora Fields plugin  
✅ **Add to Cart** - Working with proper tier selection  
✅ **Checkout** - Full billing/shipping address collection  
✅ **Accept.js** - Secure credit card tokenization  
✅ **Apple Pay** - Shows on compatible devices  
✅ **Shipping Calculator** - Real shipping costs  

---

## Testing Payment

1. Add products to cart
2. Go to: https://localhost:3443/checkout
3. Fill in details (autofill works on HTTPS)
4. Test card: **4007000000027**
5. Expiry: Any future date
6. CVV: Any 3 digits

⚠️ **Before live payments work**, you need to:
1. Install WordPress plugin: `authorize-net-api-payment.php`
2. Configure Authorize.net in WooCommerce
3. Add your Authorize.net credentials

See: `AUTHORIZE_NET_SETUP.md` for full instructions.

---

## Files Reference

📄 **AUTHORIZE_NET_COMPLETE.md** - Payment integration overview  
📄 **AUTHORIZE_NET_SETUP.md** - Detailed setup instructions  
📄 **HTTPS_SETUP.md** - HTTPS configuration  
📄 **authorize-net-api-payment.php** - WordPress plugin to install  

---

## Quick Commands

```bash
# Start with HTTPS (recommended)
npm run dev:https

# Start HTTP only
npm run dev

# Build for production
npm run build

# Production server
npm start
```

---

## Support

If you see errors:
1. Check that both ports 3000 and 3443 are free
2. Restart with `npm run dev:https`
3. Accept the SSL certificate in browser
4. Check browser console for errors

---

🎉 **You're all set!** Visit https://localhost:3443 to see your site.

