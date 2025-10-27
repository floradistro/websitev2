# POS Quick Start Guide

**For:** Flora Distro Staff  
**Location:** Charlotte Central  
**Last Updated:** October 27, 2025

---

## 🚀 **Getting Started (60 Seconds)**

### **1. Open the POS**
```
Navigate to: http://localhost:3000/pos-register-test
(Production: whaletools.app/pos/register?location=charlotte-central)
```

### **2. Start Your Shift**
1. Click **"Open Session"**
2. Enter opening cash: `$200.00`
3. Session opens → You're ready!

### **3. Process Your First Sale**
1. Click a product (e.g., "Gelato $10.00")
2. Enter quantity: `2`
3. Product added to cart
4. Click **"Charge $21.60"**
5. Enter cash tendered: `$30.00`
6. Click **"Complete"**
7. Done! Change: `$8.40`

---

## 📦 **Fulfilling Pickup Orders**

### **1. Switch to Pickup Queue**
```
Navigate to: http://localhost:3000/pos-test
```

### **2. See Orders Waiting**
- Orders appear automatically (real-time)
- Shows customer name, items, total
- Payment status: "PREPAID ✓"

### **3. Fulfill an Order**
1. Customer arrives
2. Click **"Fulfill Order"**
3. Order disappears from queue
4. Inventory deducted automatically

---

## 💰 **Ending Your Shift**

### **1. Close Session**
1. Click **"End Session"** button
2. Count cash drawer
3. Enter closing amount: e.g., `$525.00`
4. System shows:
   - Expected: `$525.00`
   - Actual: `$525.00`
   - Difference: `$0.00` ✅ Balanced

### **2. Review Summary**
- Total Sales: `$450.00`
- Transactions: `15`
- Walk-In: `10`
- Pickups: `5`

---

## 🛒 **Walk-In Sale (Step-by-Step)**

### **Scenario: Customer Buys 3 Products**

**Step 1: Browse Products**
- 70 products displayed with images
- Use search bar: Type "Blue"
- Or filter by category

**Step 2: Add to Cart**
1. Click "Blue Dream $10.00"
2. Enter quantity: `3.5` (for 3.5g)
3. Product added: `$35.00`

4. Click "Gelato $10.00"
5. Enter quantity: `2`
6. Product added: `$20.00`

7. Click "Gg4 $10.00"
8. Enter quantity: `1`
9. Product added: `$10.00`

**Cart Now Shows:**
- Items: 3
- Subtotal: $65.00
- Tax (8%): $5.20
- **TOTAL: $70.20**

**Step 3: Adjust if Needed**
- Use `+` / `−` buttons to change quantity
- Click `✕` to remove item
- Click "Clear" to empty cart

**Step 4: Checkout**
1. Click **"Charge $70.20"**
2. Payment modal appears
3. Select **💵 Cash** (default)
4. Enter cash tendered: `$80.00`
5. Change Due shows: `$9.80` ✅
6. Click **"Complete"**

**Step 5: Complete!**
- Success message shows order number
- Cart clears
- Inventory deducts
- Session totals update
- Ready for next customer

---

## 🔍 **Finding Products**

### **Search:**
- Type product name in search bar
- Results filter instantly
- Example: "cherry" → shows all cherry products

### **Categories:**
- Use dropdown: "All Categories"
- Filter by type (when categories added)

### **Stock Levels:**
- Green: `28 in stock` (plenty)
- Yellow: `5 in stock` (low)
- Red: `Out of stock`

---

## 📱 **Using on iPad**

### **Install as App:**
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App appears on home screen
5. Launch like native app (fullscreen!)

### **Tips:**
- Works offline (after first load)
- Feels like native app
- No browser chrome
- Perfect for retail floor

---

## ⚡ **Quick Actions**

### **During Sale:**
- **Hold Transaction:** Click "Hold" (coming soon)
- **Clear Cart:** Click "Clear" button
- **Remove Item:** Click `✕` on item
- **Adjust Quantity:** Use `+` / `−` or type number

### **Between Sales:**
- **View Pickup Orders:** Click "Orders" in header
- **Check Session Stats:** Look at header (sales/transactions)
- **End Shift:** Click "End Session" when done

---

## 🆘 **Troubleshooting**

### **"No Active Session"**
**Fix:** Click "Open Session" button, enter opening cash.

### **Product Not Showing**
**Reason:** Out of stock at this location  
**Fix:** Check inventory in vendor dashboard or transfer stock.

### **"Error Loading Inventory"**
**Fix:** Click "Retry" button or refresh page.

### **Payment Not Processing**
**Check:** 
1. Session is open
2. Cash amount ≥ total
3. Internet connection

---

## 📞 **Support**

### **Technical Issues:**
- Check `/vendor/dashboard` for inventory issues
- Verify internet connection for real-time updates
- Refresh page if UI freezes

### **Training:**
- This guide: `/docs/POS_QUICK_START.md`
- Full docs: `/docs/architecture/POS_SYSTEM.md`
- API reference: `/docs/architecture/POS_API_REFERENCE.md`

---

## 🎯 **Best Practices**

### **Start of Shift:**
1. ✅ Open session with accurate opening cash
2. ✅ Check for pending pickup orders
3. ✅ Verify products are in stock
4. ✅ Keep iPad charged

### **During Shift:**
1. ✅ Process sales quickly (target <2 minutes)
2. ✅ Check pickup queue every 15-30 minutes
3. ✅ Keep cart clear between customers
4. ✅ Verify change before handing to customer

### **End of Shift:**
1. ✅ Complete all pending sales
2. ✅ Fulfill any waiting pickup orders
3. ✅ Count cash drawer carefully
4. ✅ Close session with accurate count
5. ✅ Review session summary

---

## ⏱️ **Speed Benchmarks**

**Target Times:**
- Walk-in sale: <2 minutes total
- Pickup fulfillment: <1 minute
- Session open: <30 seconds
- Session close: <2 minutes

**Current Average:**
- Walk-in sale: ~1-2 minutes ✅
- Pickup fulfillment: ~30 seconds ✅
- Session management: ~15 seconds ✅

---

**Questions? Ask your manager or check the full documentation.**

---

*WhaleTools POS - Simple, Fast, Reliable* 🐋

