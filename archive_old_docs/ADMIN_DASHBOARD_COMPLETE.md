# FloraDistro Admin Dashboard - Complete

## Overview
A comprehensive admin dashboard for FloraDistro staff to manage the entire marketplace. Built with the same elegant design system as the vendor dashboard but styled for administrative control.

## Access
- **URL**: `/admin/dashboard`
- **Login**: `/admin/login`
- **Default Credentials** (for testing):
  - Username: `admin`
  - Password: `admin`

⚠️ **Security Note**: Update authentication in production with proper admin user management.

## Features

### 1. Dashboard (`/admin/dashboard`)
- Real-time marketplace statistics
- Pending product approvals counter
- Total products, vendors, and revenue
- System health monitoring
- Quick action buttons

### 2. Product Approvals (`/admin/approvals`)
- View all pending product submissions
- Bulk approve/reject products
- Detailed product information display
- Auto-refresh every 30 seconds
- Individual and bulk approval actions
- Rejection with custom reason

### 3. Vendor Management (`/admin/vendors`)
- View all registered vendors
- Create new vendor accounts
- Suspend/activate vendors
- Delete vendor accounts
- Search and filter vendors
- View vendor statistics

### 4. Products Management (`/admin/products`)
- View all marketplace products
- Search products by name
- Delete products
- View product details
- Monitor inventory levels

### 5. Additional Pages (Coming Soon)
- **Analytics**: Marketplace performance metrics
- **Users**: Customer account management
- **Payouts**: Vendor payment management
- **Reports**: Generate and view reports
- **Settings**: Configure marketplace settings

## API Endpoints

### Create/Activate Vendor
**Endpoint**: `POST /api/admin/create-vendor`

**Create New Vendor**:
```json
{
  "store_name": "Vendor Store Name",
  "email": "vendor@example.com",
  "username": "vendorusername",
  "password": "securepassword"
}
```

**Activate Existing User as Vendor**:
```json
{
  "user_id": 123,
  "store_name": "Store Name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Vendor created successfully",
  "user_id": 123,
  "username": "vendorusername",
  "email": "vendor@example.com",
  "store_name": "Vendor Store Name"
}
```

## Design System

### Color Scheme
- **Primary Admin Color**: Red (#EF4444)
- **Background**: Black (#0a0a0a, #1a1a1a)
- **Borders**: White with opacity (red-500/20 for admin sections)
- **Text**: White with various opacity levels

### Layout
- **Mobile-first responsive design**
- **Desktop sidebar navigation**
- **Mobile bottom navigation**
- **Consistent with vendor dashboard styling**

### Components
- Elegant card-based layouts
- Smooth transitions and animations
- Touch-optimized for mobile
- Hover effects on desktop
- Loading states and error handling

## WordPress Integration

### Vendor Creation
The system creates vendors using:
1. WordPress Users API (`/wp-json/wp/v2/users`)
2. WooCommerce Customers API (`/wp-json/wc/v3/customers`)
3. Flora Matrix plugin metadata

### Product Approvals
Uses Flora Matrix plugin endpoints:
- `/wp-json/flora-im/v1/vendor-dev/pending-products` (GET)
- `/wp-json/flora-im/v1/vendor-dev/approve-product` (POST)
- `/wp-json/flora-im/v1/vendor-dev/reject-product` (POST)

## Credentials

### WordPress Production
- **URL**: https://api.floradistro.com
- **Consumer Key**: `ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5`
- **Consumer Secret**: `cs_38194e74c7ddc5d72b6c32c70485728e7e529678`

### SiteGround
- **Hostname**: gvam1142.siteground.biz
- **Username**: u2736-pgt6vpiklij1
- **Port**: 18765

## File Structure

```
app/admin/
├── layout.tsx                 # Admin layout with sidebar/nav
├── dashboard/
│   └── page.tsx              # Main dashboard
├── approvals/
│   └── page.tsx              # Product approval interface
├── vendors/
│   └── page.tsx              # Vendor management
├── products/
│   └── page.tsx              # All products view
├── analytics/
│   └── page.tsx              # Analytics (placeholder)
├── users/
│   └── page.tsx              # User management (placeholder)
├── payouts/
│   └── page.tsx              # Payout management (placeholder)
├── reports/
│   └── page.tsx              # Reports (placeholder)
├── settings/
│   └── page.tsx              # Settings (placeholder)
└── login/
    └── page.tsx              # Admin login

app/api/admin/
└── create-vendor/
    └── route.ts              # Vendor creation endpoint
```

## Usage Examples

### Creating a Vendor
1. Navigate to `/admin/vendors`
2. Click "Add Vendor" button
3. Fill in store name, email, username, and password
4. Click "Create Vendor"

### Approving Products
1. Navigate to `/admin/approvals`
2. Review product details by clicking to expand
3. Click "Approve" or "Reject" for individual products
4. Or select multiple products and use "Approve X" bulk action

### Managing Products
1. Navigate to `/admin/products`
2. Search for specific products
3. View or delete products as needed

## Security Considerations

1. **Authentication**: Implement proper admin authentication in production
2. **API Security**: Ensure WordPress API endpoints are properly secured
3. **Role-Based Access**: Verify admin role before allowing access
4. **CSRF Protection**: Consider implementing CSRF tokens for admin actions
5. **Audit Logging**: Track all admin actions for compliance

## Next Steps

To enhance the admin dashboard:

1. **Implement proper authentication**
   - Use JWT or session-based auth
   - Add admin role verification
   - Implement password reset

2. **Complete placeholder pages**
   - Build out analytics with charts
   - Add user management features
   - Create payout processing
   - Implement report generation

3. **Add more admin controls**
   - Category management
   - Site settings configuration
   - Email template customization
   - Commission rate management

4. **Enhance monitoring**
   - Real-time notifications
   - Activity logs
   - Error tracking
   - Performance monitoring

## Support

For issues or questions:
- Check WordPress error logs
- Review browser console for client-side errors
- Verify API credentials are correct
- Ensure Flora Matrix plugin is active

## Development

To run locally:
```bash
npm run dev
```

Access at: `http://localhost:3000/admin/dashboard`

---

**Status**: ✅ Complete and functional
**Last Updated**: October 20, 2025
**Version**: 1.0.0

