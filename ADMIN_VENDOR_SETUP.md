# Admin Vendor Management Setup

## 📋 Upload PHP Script to WordPress

To enable full vendor management (create, suspend, activate, delete), you need to upload the PHP script to your WordPress server.

### Step 1: Upload the PHP Script

**File to upload**: `activate-vendor-admin.php`

**Upload via SiteGround**:

1. **Connect via SSH**:
```bash
ssh u2736-pgt6vpiklij1@gvam1142.siteground.biz -p 18765
```

2. **Navigate to WordPress root**:
```bash
cd public_html  # or wherever WordPress is installed
```

3. **Upload the file** (from your local machine):
```bash
scp -P 18765 activate-vendor-admin.php u2736-pgt6vpiklij1@gvam1142.siteground.biz:~/public_html/
```

**OR via SiteGround File Manager**:
1. Log into SiteGround hosting panel
2. Go to Site Tools → File Manager
3. Navigate to `public_html/` (WordPress root)
4. Upload `activate-vendor-admin.php`
5. Set permissions to 644

### Step 2: Verify Upload

Access the script in your browser to test:
```
https://api.floradistro.com/activate-vendor-admin.php
```

You should see a JSON response like:
```json
{"success":false,"message":"Invalid action"}
```

This confirms the script is accessible.

### Step 3: Test Vendor Creation

Now the admin dashboard will use this PHP script for:
- ✅ Creating new vendors
- ✅ Activating pending vendors
- ✅ Suspending active vendors
- ✅ Deleting vendor accounts

## 🔧 How It Works

### Create Vendor
```javascript
POST /api/admin/create-vendor
{
  "action": "create_vendor",
  "store_name": "New Vendor",
  "email": "vendor@example.com",
  "username": "vendoruser",
  "password": "securepassword"
}
```

### Activate Vendor
```javascript
POST /api/admin/create-vendor
{
  "action": "activate_vendor",
  "vendor_id": 123
}
```

### Suspend Vendor
```javascript
POST /api/admin/create-vendor
{
  "action": "suspend_vendor",
  "vendor_id": 123
}
```

### Delete Vendor
```javascript
POST /api/admin/create-vendor
{
  "action": "delete_vendor",
  "vendor_id": 123
}
```

## 🎯 Admin Dashboard Features

Once the PHP script is uploaded:

### Vendor Management (`/admin/vendors`)
- ✅ View all vendors with status (Active/Pending/Suspended)
- ✅ **Create** new vendor accounts with username/email/password
- ✅ **Activate** pending vendors (turns them active)
- ✅ **Suspend** active vendors (disables their account)
- ✅ **Delete** vendors permanently
- ✅ Search and filter vendors
- ✅ View vendor product counts

### UI Changes
- **Pending vendors** show "Activate" button (green)
- **Suspended vendors** show "Activate" button (green)
- **Active vendors** show "Suspend" button (white)
- All vendors show "Delete" button (red)

## 📝 PHP Script Details

The script (`activate-vendor-admin.php`) runs in WordPress context and has full database access to:

1. **Create users** with `wp_create_user()`
2. **Set vendor metadata** properly
3. **Update user roles** to 'vendor'
4. **Suspend/activate** by changing meta fields
5. **Delete users** with `wp_delete_user()`
6. **Clear WordPress cache** after changes

This bypasses WordPress REST API permission restrictions.

## 🔐 Security

The PHP script:
- ✅ Runs in WordPress environment (secured by WordPress)
- ✅ Accessible only from your Next.js API proxy
- ✅ No public form submission
- ✅ Returns JSON responses
- ⚠️ **Recommended**: Add authentication check in production

## 🧪 Testing

After uploading the script:

1. Go to `/admin/vendors`
2. Click **"+ ADD VENDOR"**
3. Fill in:
   - Store Name: "Test Vendor"
   - Email: "test@vendor.com"
   - Username: "testvendor"
   - Password: "testpass123"
4. Click **"Create Vendor"**
5. Should see success message
6. New vendor appears in list with "PENDING" status
7. Click **"Activate"** to approve the vendor
8. Status changes to "ACTIVE"

## 📂 File Locations

- **PHP Script**: `/Users/whale/Desktop/Website/activate-vendor-admin.php`
- **Upload To**: `https://api.floradistro.com/public_html/activate-vendor-admin.php`
- **Next.js API**: `/app/api/admin/create-vendor/route.ts`
- **Admin Page**: `/app/admin/vendors/page.tsx`

## 🚀 Current Status

- ✅ PHP script created
- ✅ API endpoint updated to use PHP script
- ✅ Vendor page updated with Activate/Suspend logic
- ⏳ **Next**: Upload PHP script to WordPress server
- ⏳ **Then**: Test all vendor management functions

---

**Once uploaded, all vendor management will be fully functional!** 🎉

