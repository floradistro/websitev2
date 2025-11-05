# 🎯 How to Use Apple Wallet - Simple Guide

## I'm Confused - How Do Customers Get Their Wallet Pass?

Great question! Here are **3 simple ways** customers can get their loyalty card:

---

## ✅ Method 1: Button on Website (Easiest)

Add this button to your customer profile or loyalty page:

```tsx
import AddToWalletButton from '@/components/customer/AddToWalletButton';

<AddToWalletButton
  customerId={customer.id}
  vendorId={vendor.id}
/>
```

**What the customer sees:**
1. A big "Add to Apple Wallet" button
2. They click it
3. `.pkpass` file downloads
4. They tap the file
5. iOS shows "Add to Apple Wallet"
6. Done! Card is in their wallet

---

## ✅ Method 2: Direct Download Link (Simplest)

Just give customers this URL (you can put it anywhere):

```
https://yachtclub.vip/api/customer/wallet-pass?customer_id=THEIR_ID&vendor_id=VENDOR_ID
```

**Where to use it:**
- 📧 **Email**: "Click here to add your loyalty card"
- 💬 **SMS**: Send them the link
- 📱 **App**: Deep link from your mobile app
- 🌐 **Website**: Regular `<a>` link

**What happens:**
- Customer clicks link
- Pass downloads automatically
- They tap it to add to Wallet

---

## ✅ Method 3: QR Code (Best for In-Store)

Generate a QR code for this URL:
```
https://yachtclub.vip/api/customer/wallet-pass?customer_id=THEIR_ID&vendor_id=VENDOR_ID
```

**How it works:**
1. Show QR code at checkout/receipt
2. Customer scans with phone camera
3. Pass downloads
4. Add to Wallet

**Tools to generate QR codes:**
- https://www.qr-code-generator.com/
- Or use API: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=YOUR_URL`

---

## 🧪 Test It Right Now!

I've created a test page for you. Open this in your browser:

```
http://localhost:3000/test-wallet
```

**What you'll see:**
1. Dropdown to select a customer
2. Dropdown to select a vendor
3. **3 different ways to test** the wallet pass:
   - Click the component button
   - Download directly via link
   - Copy the cURL command

**Try all 3 methods!** They all work.

---

## 📱 Real Customer Flow (Step by Step)

Let's say you have a customer named "John" who wants their loyalty card:

### Step 1: Customer Visits Your Site
- John logs into his account
- Goes to "My Profile" or "Loyalty" page

### Step 2: Sees the Button
```
┌──────────────────────────────────────┐
│  🎫 Digital Loyalty Card             │
│                                      │
│  Add your loyalty card to Apple      │
│  Wallet for easy access             │
│                                      │
│  [📥 Add to Apple Wallet]            │
└──────────────────────────────────────┘
```

### Step 3: Clicks Button
- Browser downloads `loyalty-pass.pkpass`
- Usually goes to Downloads folder

### Step 4: Taps the File
- iOS recognizes it as a wallet pass
- Shows preview with:
  - Store logo
  - Customer name
  - Points balance
  - Loyalty tier

### Step 5: Adds to Wallet
- Taps "Add" button
- Pass appears in Apple Wallet
- Can access from lock screen!

### Step 6: Automatic Updates
- When John earns points
- His pass updates automatically
- Gets push notification
- New balance shows instantly

---

## 🎨 Where to Add the Button

### Option A: Customer Profile Page
```tsx
// app/customer/profile/page.tsx
export default function CustomerProfile() {
  return (
    <div>
      <h1>My Profile</h1>

      {/* Loyalty Section */}
      <div className="loyalty-section">
        <h2>Loyalty Card</h2>
        <p>Points: {customer.loyalty_points}</p>

        <AddToWalletButton
          customerId={customer.id}
          vendorId={vendor.id}
        />
      </div>
    </div>
  );
}
```

### Option B: Loyalty Page
```tsx
// app/customer/loyalty/page.tsx
export default function LoyaltyPage() {
  return (
    <div>
      <h1>Your Rewards</h1>
      <div>Points: {customer.loyalty_points}</div>
      <div>Tier: {customer.loyalty_tier}</div>

      <AddToWalletButton
        customerId={customer.id}
        vendorId={vendor.id}
      />
    </div>
  );
}
```

### Option C: After Purchase
```tsx
// app/checkout/success/page.tsx
export default function OrderSuccess() {
  return (
    <div>
      <h1>Order Confirmed! 🎉</h1>
      <p>You earned 50 points!</p>

      {/* Suggest adding to wallet */}
      <div className="bg-blue-100 p-4 rounded">
        <p>💡 Add your loyalty card to Apple Wallet</p>
        <p>Your points will update automatically!</p>

        <AddToWalletButton
          customerId={customer.id}
          vendorId={vendor.id}
        />
      </div>
    </div>
  );
}
```

---

## 📧 Email Template Example

```html
<!DOCTYPE html>
<html>
<body>
  <h2>Hi {{customer_name}}! 👋</h2>

  <p>Add your loyalty card to Apple Wallet for instant access:</p>

  <a href="https://yachtclub.vip/api/customer/wallet-pass?customer_id={{customer_id}}&vendor_id={{vendor_id}}"
     style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">
    📥 Add to Apple Wallet
  </a>

  <p><strong>Benefits:</strong></p>
  <ul>
    <li>✅ Quick access from your iPhone lock screen</li>
    <li>✅ Automatic updates when you earn points</li>
    <li>✅ Push notifications for special offers</li>
    <li>✅ Works on Apple Watch too!</li>
  </ul>

  <p>Questions? Just reply to this email.</p>
</body>
</html>
```

---

## 🔧 Troubleshooting

### "Nothing happens when I click the button"
1. Open browser console (F12)
2. Look for errors
3. Check if API is responding: `curl http://localhost:3000/api/customer/wallet-pass?customer_id=xxx`

### "File downloads but won't open"
- ✅ Certificate password correct in `.env.local`
- ✅ Certificate files exist
- ✅ Try on actual iPhone (not simulator initially)

### "Pass opens but looks wrong"
- Check vendor has `logo_url` in database
- Check vendor has `brand_colors` in database
- Verify customer data is correct

### "Updates don't work"
- This requires device registration
- Only works after pass is added to iPhone
- Device must have push notifications enabled
- Check `wallet_passes.devices` array in database

---

## 🎯 Quick Start Checklist

To get customers using wallet passes:

- [ ] Add `AddToWalletButton` to your customer profile page
- [ ] Or send customers direct download links via email
- [ ] Or generate QR codes for in-store signage
- [ ] Test with yourself first (use test page)
- [ ] Roll out to customers gradually

---

## 💡 Pro Tips

### 1. **Promote It!**
Don't just add the button and hope customers find it. Actively promote:
- Email blast: "New! Add your loyalty card to Apple Wallet"
- In-store signage: QR codes at checkout
- After purchase: Remind them to add card
- Social media: Show how easy it is

### 2. **Make It Obvious**
- Big button on profile page
- Highlight with colors/animation
- Show benefits (automatic updates, lock screen access)
- Show preview screenshot

### 3. **Track Adoption**
Check dashboard to see:
- How many passes generated
- How many active (added to wallet)
- How many devices registered

### 4. **Encourage Adding**
Offer incentive:
- "Add to wallet and get 50 bonus points!"
- "Exclusive wallet-only offers"
- "Easier checkout with wallet pass"

---

## 🚀 Next Steps

1. **Test it yourself:**
   ```
   http://localhost:3000/test-wallet
   ```

2. **Add button to your UI:**
   - Customer profile page
   - Loyalty rewards page
   - Post-purchase confirmation

3. **Send to a few test customers:**
   - Email them the direct link
   - Get feedback

4. **Roll out to everyone:**
   - Announce via email
   - Add prominent button to site
   - Monitor dashboard for adoption

---

## 🆘 Still Confused?

**Test Page**: http://localhost:3000/test-wallet
- Shows 3 working examples
- Pick a customer and vendor
- Try all 3 methods

**Check if it's working:**
```bash
# This should download a .pkpass file
curl "http://localhost:3000/api/customer/wallet-pass?customer_id=7a863793-3cd8-45cf-a67c-ea0f7172b208&vendor_id=17de99c6-4323-41a9-aca8-5f5bbf1f3562" -o test.pkpass

# Then:
open test.pkpass
```

**If that works**, you're ready to add it to your customer pages!

---

## 📊 Summary

**3 Ways Customers Get Pass:**

1. **Button**: `<AddToWalletButton customerId={id} vendorId={id} />`
2. **Link**: `https://yachtclub.vip/api/customer/wallet-pass?customer_id=X&vendor_id=Y`
3. **QR Code**: Generate QR for above URL

**All 3 do the same thing:**
- Download .pkpass file
- Customer taps it
- Add to Apple Wallet
- Done!

**Test now:** http://localhost:3000/test-wallet

Got it? 🎯
