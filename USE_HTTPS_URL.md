# ⚠️ IMPORTANT: Use HTTPS URL

## You're seeing the "insecure connection" error because you're on HTTP

❌ **Don't use**: http://localhost:3000  
✅ **Use this**: https://localhost:3443

---

## How to Fix

1. **Close the current browser tab**
2. **Open a new tab**
3. **Go to**: https://localhost:3443/checkout
4. **Accept the security warning** (one time only)
   - Click "Advanced"
   - Click "Proceed to localhost (unsafe)"

---

## Why This Happens

- HTTP (port 3000) = ❌ No autofill, no Accept.js
- HTTPS (port 3443) = ✅ Autofill works, Accept.js works

The browser blocks payment features on HTTP for security.

---

## Check Your URL

Look at your browser address bar. It should show:
```
🔒 https://localhost:3443/checkout
```

NOT:
```
⚠️ http://localhost:3000/checkout
```

---

## Quick Test

Right now, open a new tab and paste this:

**https://localhost:3443/checkout**

(Accept the certificate warning when prompted)

Then try filling out the payment form - autofill should work!

