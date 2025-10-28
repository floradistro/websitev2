# POS Management System

## Overview
Admin-controlled POS system with vendor logo display and enable/disable functionality.

---

## ✅ Features Implemented

### 1. Vendor Logo in POS Header
- **Location**: Top-left corner of POS interface
- **Display**: 40x40px logo with background
- **Auto-refresh**: Logo fetched on POS mount
- **Fallback**: Hidden if no logo configured

### 2. Admin POS Management Dashboard
- **Route**: `/admin/pos-management`
- **Features**:
  - Real-time stats (Total, Enabled, Disabled vendors)
  - Search by name, email, slug
  - Filter by POS status (All/Enabled/Disabled)
  - Toggle POS access per vendor
  - Success/error notifications
  - Vendor logo preview in table

### 3. API Endpoints

#### `/api/admin/pos/vendors` (GET)
Fetch all vendors with POS status
```typescript
Response: {
  success: boolean;
  vendors: Array<{
    id, store_name, slug, logo_url, email, status, pos_enabled
  }>;
}
```

#### `/api/admin/pos/vendors` (PATCH)
Update vendor POS status
```typescript
Body: { vendorId: string, pos_enabled: boolean }
Response: { success: boolean, vendor: {...}, message: string }
```

#### `/api/vendor/auth/refresh` (POST)
Refresh vendor data without re-login
```typescript
Body: { vendorId: string }
Response: { success: boolean, vendor: {...} }
```

---

## 🗄️ Database

### Vendors Table Fields
- `pos_enabled` (boolean) - Controls POS access
- `logo_url` (text) - Vendor logo from Supabase storage

### Flora Distro Status
```sql
-- Enabled for testing
UPDATE vendors 
SET pos_enabled = true 
WHERE slug = 'flora-distro';
```

---

## 🎨 UI Components

### Modified Files
1. **POSSessionHeader.tsx**
   - Added vendor logo display
   - Auto-refresh vendor data on mount
   - Debug logging for vendor data

2. **VendorAuthContext.tsx**
   - Added `logo_url` and `pos_enabled` to vendor interface
   - Added `refreshVendorData()` function
   - Updated login to fetch logo/POS status

3. **Admin Layout**
   - Added "POS Management" navigation link
   - Icon: Monitor (lucide-react)
   - Position: After Locations, before Domains

---

## 🔐 Admin Controls

### Enable/Disable POS
1. Navigate to `/admin/pos-management`
2. Find vendor in list or search
3. Click Enable/Disable button
4. Vendor's POS access updates immediately
5. Vendor sees logo on next POS load

### Vendor Access
- Vendors with `pos_enabled = false` can still access `/pos` route
- Logo only displays if `logo_url` exists
- POS functionality works regardless of logo

---

## 🔄 Data Flow

```
Admin enables POS → Database updated → Vendor refreshes POS → Logo displays
```

### Vendor Data Refresh Triggers:
1. **On login** - Full vendor data fetched
2. **On POS mount** - Auto-refresh called
3. **Manual** - Call `refreshVendorData()` from context

---

## 🧪 Testing

### Test Admin Controls
1. Go to `/admin/pos-management`
2. Toggle POS for any vendor
3. Verify stats update
4. Test search/filter functionality

### Test Vendor Logo Display
1. Log in as vendor with POS enabled
2. Navigate to `/pos/register`
3. Check console for debug log:
   ```
   🔍 POS Header - Vendor Data: {
     store_name: "Flora Distro",
     logo_url: "https://...",
     pos_enabled: true,
     has_logo: true
   }
   ```
4. Verify logo displays in top-left

### Test Flora Distro
- **Email**: `fahad@cwscommercial.com`
- **Status**: POS Enabled ✅
- **Logo**: Configured ✅

---

## 📝 Notes

- Logo images require Supabase domain in `next.config.ts` (already configured)
- Vendor must log out/in OR page refresh to see logo after enabling POS
- Auto-refresh on POS mount ensures latest data
- Admin can manage POS access without vendor interaction

---

## 🚀 Next Steps (Optional)

- [ ] Bulk enable/disable POS for multiple vendors
- [ ] POS activity logs per vendor
- [ ] Location-specific POS controls
- [ ] POS analytics dashboard
- [ ] Custom POS branding per vendor
- [ ] POS user role management
- [ ] Hardware integration settings per vendor



