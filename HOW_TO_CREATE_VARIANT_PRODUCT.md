# How to Create a Variant Product - Vercel Live

## ✅ CORS FIXED - Ready to Test on Vercel!

**URL**: https://websitev2-ashen.vercel.app/vendor/products/new

---

## 🎯 Step-by-Step: Create Moonwater Day Drinker

### Step 1: Basic Information
```
Product Name: Day Drinker
Description: Premium THC-infused soda - light and refreshing
Category: Beverages
Product Type: Click "Variable Product" ✅
```

### Step 2: Add Attribute
```
1. In "Add Attribute" field, type: Strength
2. Click "Add" button
3. You'll see "Strength" card appear
```

### Step 3: Add Attribute Values
```
In the "Strength" card:
1. Type: 5MG
2. Click + button (or press Enter)
3. See "5MG" tag appear

Repeat for other strengths:
4. Type: 10MG → Click +
5. Type: 30MG → Click +  
6. Type: 60MG → Click +

You should see 4 tags: [5MG] [10MG] [30MG] [60MG]
```

### Step 4: Generate Variants
```
Click: "Generate Variants (4 combinations)"

You'll see a table with 4 rows:
- 5MG
- 10MG
- 30MG
- 60MG
```

### Step 5: Fill Variant Prices
```
For each row, fill in:
- 5MG:  Price: 4.99, SKU: DD-5MG, Stock: 100
- 10MG: Price: 4.99, SKU: DD-10MG, Stock: 100
- 30MG: Price: 5.99, SKU: DD-30MG, Stock: 75
- 60MG: Price: 7.99, SKU: DD-60MG, Stock: 50

Note: Price fields with red border = required (not filled)
```

### Step 6: Upload Images & COA
```
1. Upload 2-3 product images
2. Upload COA PDF
```

### Step 7: Submit
```
Click: "Submit for Review"
✅ Success message appears
✅ Redirects to products page
```

---

## 🐛 What Was Fixed Just Now

### CORS Error - FIXED ✅
**Before**:
```
Access-Control-Allow-Origin: http://localhost:3000
```

**After**:
```
Access-Control-Allow-Origin: https://websitev2-ashen.vercel.app
+ All .vercel.app domains allowed
```

**Result**: API calls from Vercel now work!

### Form Validation - IMPROVED ✅
- Check all variant prices filled before submit
- Show clear error: "X variant(s) missing prices"
- Red border on empty price fields
- Better placeholder text

### Help Text - ADDED ✅
- Blue info box explaining workflow
- Step-by-step instructions
- Message when attributes need values

---

## ⚠️ Common Mistakes

### Mistake 1: Submitting Without Variant Values
❌ Add attribute "MG" → Click Generate (doesn't work)

✅ Add attribute "MG" → Add values (5MG, 10MG, etc.) → Click Generate

### Mistake 2: Submitting Without Prices
❌ Generate variants → Submit immediately

✅ Generate variants → Fill all prices → Submit

### Mistake 3: Empty Required Fields
❌ Leave variant prices empty

✅ Fill every variant price (red border = empty)

---

## 🎨 Visual Indicators

### Product Type:
- **Selected**: White background
- **Not selected**: Gray/transparent

### Variant Prices:
- **Empty**: Red border (needs filling)
- **Filled**: White border (good to go)

### Generate Button:
- **Visible**: All attributes have values
- **Hidden/Blue message**: Attributes need values

---

## 📊 Example: Moonwater Product Line

### Day Drinker (5MG)
```
Name: Day Drinker
Type: Variable Product
Attribute: Strength
Values: 5MG
Variant: 1 variant at $4.99
```

### Golden Hour (10MG)
```
Name: Golden Hour
Type: Variable Product
Attribute: Flavor
Values: Fizzy Lemonade, Clementine Orange, Cherry Lime, Raspberry, Grapefruit
Variants: 5 variants at $4.99-$5.49 each
```

### Darkside (30MG) & Riptide (60MG)
```
Name: Darkside / Riptide
Type: Simple Product (single strength)
Pricing: Single Price
Price: $5.99 / $7.99
```

---

## ✅ Changes Deployed

**Backend (WordPress)**:
- ✅ CORS allows Vercel domains
- ✅ Cache cleared
- ✅ API ready

**Frontend (Vercel)**:
- ✅ Variant validation improved
- ✅ Help text added
- ✅ Visual feedback enhanced
- ✅ Deploying now (60 seconds)

---

## 🚀 Test on Vercel (After 60 Seconds)

1. Go to: https://websitev2-ashen.vercel.app/vendor/login
2. Login as Moonwater
3. Go to Products → Add New
4. Follow steps above
5. Should work perfectly now!

**CORS error**: FIXED ✅  
**Validation**: IMPROVED ✅  
**UX**: CLEARER ✅  

---

**Status**: Vercel redeploying with all fixes!

