# How to View Moonwater Beverages Beautiful Vendor Profile

## Quick Access Links

### 🌐 Public Vendor Store Page
```
https://api.floradistro.com/vendors/moonwater
```
- Beautiful public-facing vendor page
- Shows logo, banner, about, products
- Displays with brand colors (#002928, #0D3635)

### 🔧 WordPress Admin - Edit Profile
```
https://api.floradistro.com/wp-admin/user-edit.php?user_id=140
```
1. Log into WordPress admin
2. Navigate to Users → All Users
3. Click on "moonwater" user
4. Scroll to **"Vendor Information"** section
5. See all populated fields with real data

### 📊 API Endpoint - JSON Data
```
https://api.floradistro.com/wp-json/flora/v1/vendors/moonwater
```
Returns complete vendor profile as JSON:
```json
{
  "id": 5,
  "user_id": 140,
  "company_name": "Moonwater Beverages",
  "store_name": "Moonwater Beverages",
  "slug": "moonwater",
  "email": "eli@moonwaterbeverages.com",
  "tagline": "Shoot for the moon",
  "about": "Moonwater is THC soda done right...",
  "primary_color": "#002928",
  "accent_color": "#0D3635",
  "logo_url": "https://trymoonwater.com/cdn/shop/files/wave_reversed.svg",
  "banner_url": "https://trymoonwater.com/cdn/shop/files/Artboard_2.png",
  "website": "https://trymoonwater.com",
  "instagram": "@moonwaterbeverages",
  "status": "active",
  "verified": true
}
```

### 👤 Vendor Dashboard (For Vendor User)
```
https://api.floradistro.com/vendor/dashboard
```
- Login as eli@moonwaterbeverages.com
- Manage products, orders, profile
- View analytics and payouts

---

## What You'll See

### In WordPress Admin Profile:
- ✅ **Store Information** section with all fields
- ✅ **Branding Colors** with color pickers showing #002928 & #0D3635
- ✅ **Logo Preview** showing Moonwater wave logo
- ✅ **Banner Preview** showing brand image
- ✅ **About Text** with full description
- ✅ **Tagline** "Shoot for the moon"
- ✅ **Social Links** Instagram @moonwaterbeverages
- ✅ **Website Link** with "Visit Site" button → trymoonwater.com
- ✅ **Status** showing **ACTIVE** in green
- ✅ **Verified Badge** showing checkmark

### All Fields are Editable:
Just click in any field, make changes, and click "Update Profile" button.

---

## Database Verification

### Check Real Data in Database:
```bash
mysql -h 127.0.0.1 -u unr9f5qnxgdfb -pcsh4jneuc074 dbpm1080lhrpq2 \
  -e "SELECT company_name, tagline, website, instagram, 
           primary_color, accent_color, logo_url, status 
      FROM avu_flora_vendors WHERE id=5;"
```

### Output Shows Real Data:
```
company_name: Moonwater Beverages
tagline: Shoot for the moon
website: https://trymoonwater.com
instagram: @moonwaterbeverages
primary_color: #002928
accent_color: #0D3635
logo_url: https://trymoonwater.com/cdn/shop/files/wave_reversed.svg
status: active
```

---

## Test Editability

### Try Editing in WordPress Admin:
1. Go to: https://api.floradistro.com/wp-admin/user-edit.php?user_id=140
2. Change tagline to: "Your New Tagline Here"
3. Click "Update Profile"
4. Refresh page
5. See your change saved ✅

### Try API Call:
```bash
curl https://api.floradistro.com/wp-json/flora/v1/vendors/moonwater
```

Returns updated data from database in real-time.

---

## Next Steps

### Add Products:
1. Go to Products → Add New in WordPress
2. Set product vendor to "Moonwater Beverages"
3. Add product details
4. Products will show on vendor page

### Update Branding:
1. Edit user profile
2. Click color pickers to change colors
3. Upload new logo/banner URLs
4. Changes reflect immediately

---

**Everything is LIVE, REAL DATA, and FULLY EDITABLE** ✨

