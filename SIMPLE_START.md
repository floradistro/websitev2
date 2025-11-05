# 🚀 Apple Wallet - Simple Start Guide

## The Confusion Explained

You asked: **"How do customers get wallet passes?"**

Let me make this super simple with a **working example**.

---

## 📱 Step-by-Step Customer Flow

### What the Customer Sees:

1. **Customer visits your site** (logged in)
2. **Sees this button:**
   ```
   ┌───────────────────────────────┐
   │  🎫 Add to Apple Wallet       │
   │                               │
   │  [Download Pass] button       │
   └───────────────────────────────┘
   ```

3. **Clicks the button**
   - Browser downloads `loyalty-pass.pkpass` file
   - Usually saves to Downloads folder

4. **Customer taps/opens the downloaded file**
   - iPhone recognizes it's a wallet pass
   - Shows preview screen
   - Big "Add" button appears

5. **Customer taps "Add"**
   - Pass is now in Apple Wallet!
   - Done!

---

## 🧪 Test It Right Now

### Open This Page:
```
http://localhost:3000/test-wallet
```

**What you'll see:**
- Dropdown to select a test customer
- Dropdown to select a vendor
- **3 working examples** to test

**Just click the button and it should download a file!**

---

## ⚠️ Current Status

The system has a few issues we need to fix:

### Issue 1: Import Error ✅ FIXED
- `passkit-generator` module import was wrong
- Fixed in `lib/wallet/pass-generator.ts`

### Issue 2: Database Column Mismatch ✅ FIXED
- Missing `pass_type` field
- Fixed in `app/api/customer/wallet-pass/route.ts`

### Issue 3: Certificate Loading (Testing Now)
- Need to verify certificates are loading correctly
- This is what might be causing the delay

---

## 🔧 Quick Fix

Let me create a simpler version that shows you exactly what's happening. Run this:

```bash
# Kill any stuck processes
pkill -f "next-server"

# Start fresh
npm run dev
```

Then visit:
```
http://localhost:3000/test-wallet
```

---

## 💡 The Simple Answer

**Where do you put the "Add to Wallet" button?**

### Option 1: Customer Profile Page
```tsx
// app/customer/[id]/page.tsx
import AddToWalletButton from '@/components/customer/AddToWalletButton';

export default function CustomerProfile({ params }) {
  return (
    <div>
      <h1>Your Profile</h1>

      {/* Add this! */}
      <AddToWalletButton
        customerId={params.id}
        vendorId={vendor.id}
      />
    </div>
  );
}
```

### Option 2: Loyalty Dashboard
```tsx
// app/customer/loyalty/page.tsx
<div className="loyalty-section">
  <h2>Your Loyalty Card</h2>
  <p>Points: {customer.points}</p>

  {/* Button here */}
  <AddToWalletButton
    customerId={customer.id}
    vendorId={vendor.id}
  />
</div>
```

### Option 3: Just a Link
```tsx
<a href={`/api/customer/wallet-pass?customer_id=${id}&vendor_id=${vendorId}`}>
  📥 Download Wallet Pass
</a>
```

**All three do the same thing:** Download a .pkpass file!

---

## 🎯 Next Steps

1. **Fix the current API** (I'm working on it)
2. **Test on the test page** (http://localhost:3000/test-wallet)
3. **Add button to your customer pages**
4. **Done!**

---

## 🆘 Still Not Working?

The issue is likely the certificate loading. Let me create a simpler test that doesn't need certificates first, just to show you how the flow works.

Check: `http://localhost:3000/test-wallet`

That page shows you exactly where to put the button and how it works!
