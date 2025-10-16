# HTTPS Development Setup

## Running with HTTPS

Your checkout now runs on **HTTPS** to enable:
- ✅ Credit card autofill
- ✅ Accept.js payment tokenization
- ✅ Apple Pay (requires HTTPS)
- ✅ Browser security features

---

## Start HTTPS Development Server

```bash
npm run dev:https
```

This will start:
- **HTTP**: http://localhost:3000 (Next.js)
- **HTTPS**: https://localhost:3443 (SSL Proxy)

**Use this URL**: https://localhost:3443

---

## Browser Security Warning

First time you visit https://localhost:3443, you'll see a security warning because it's a self-signed certificate.

### How to Proceed:

**Chrome/Brave:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Safari:**
1. Click "Show Details"
2. Click "visit this website"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

This is normal for local development.

---

## Accept the Certificate (One Time)

Once you accept the certificate, your browser will remember it for localhost.

Then you can:
- ✅ Use credit card autofill
- ✅ Test Accept.js payments
- ✅ Test Apple Pay (on Safari/iOS)

---

## Testing Payment Flow

1. Go to: https://localhost:3443
2. Add items to cart
3. Go to checkout: https://localhost:3443/checkout
4. Fill in billing info (autofill should work now)
5. Enter test card: 4007000000027
6. Submit payment

---

## Production

In production (floradistro.com), you'll have a real SSL certificate, so no warnings.

---

## Ports

- **3000** - HTTP (for API testing, backend)
- **3443** - HTTPS (for frontend, checkout, payments)

Always use port **3443** with HTTPS for testing payments.

