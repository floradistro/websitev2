# Flora Distro - Next.js Platform

Modern multi-vendor cannabis retail platform built with Next.js 14, Supabase, and enterprise-grade architecture.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **Payments**: Authorize.net
- **Deployment**: Vercel

## 📦 Core Systems

### Vendor Portal
- Multi-location inventory management
- Purchase order system with COGS tracking
- Product catalog management
- Real-time analytics dashboard
- Custom domains and branding
- Order fulfillment tracking

### Admin Portal
- Vendor management (create, suspend, delete)
- Product approvals workflow
- Multi-location system
- User & employee management (RBAC)
- Field groups & category management
- Payment configuration

### Customer Platform
- Product browsing with advanced filters
- Multi-location pickup & delivery
- Real-time cart with Authorize.net payments
- Order tracking
- Product reviews

## 🗂️ Key Features

### Inventory Management
- **Multi-location tracking** across warehouses and retail
- **Real-time POS integration** (single inventory system)
- **Advanced filtering** by location, category, THC levels, strain types
- **Bulk operations** for transfers and updates
- **Cost tracking** (unit cost, weighted average cost)
- **Export to CSV** for reporting

### Purchase Orders
- **Product catalog browser** for easy restocking
- **Cost tracking (COGS)** with weighted averages
- **Partial receiving** support
- **Auto inventory updates** on receive
- **Supplier management**
- **Status workflow** (Draft → Submitted → In Transit → Received)

### Multi-Location
- **Location-based access control**
- **POS terminal support**
- **Stock transfers between locations**
- **Location-specific pricing tiers**
- **Billing management** ($49.99/month per additional location)

## 🔐 Authentication

- **Admin**: `/admin/login`
- **Vendor**: `/vendor/login`
- **Customer**: `/login`

All auth handled by Supabase with Row Level Security (RLS) policies.

## 📁 Project Structure

```
app/
├── admin/              # Admin portal
│   ├── dashboard/      # Admin dashboard
│   ├── vendors/        # Vendor management
│   ├── products/       # Product catalog (with delete)
│   ├── approvals/      # Product approvals
│   ├── locations/      # Location management
│   └── users/          # User & employee RBAC
├── vendor/             # Vendor portal
│   ├── dashboard/      # Vendor dashboard
│   ├── products/       # Product management (with delete)
│   ├── inventory/      # Multi-location inventory (with delete)
│   ├── purchase-orders/ # PO system (NEW)
│   ├── locations/      # Location viewer
│   ├── orders/         # Order fulfillment
│   └── settings/       # Vendor settings
├── api/
│   ├── admin/          # Admin APIs
│   ├── vendor/         # Vendor APIs
│   ├── supabase/       # Direct Supabase APIs
│   └── payment/        # Payment processing
supabase/
└── migrations/         # Database schema

```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server (port 3000)
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

Essential docs in root:
- `DEVELOPER_KEYS.md` - API keys and credentials
- `ENHANCED_INVENTORY_SYSTEM.md` - Inventory features
- `PURCHASE_ORDER_SYSTEM.md` - PO system guide
- `FIELD_GROUPS_SYSTEM.md` - Field groups setup
- `MULTI_LOCATION_SYSTEM_COMPLETE.md` - Multi-location architecture
- `INVENTORY_FIX_EXPLANATION.md` - How POS integration works

Archived docs: `archive_old_docs/` (migration history, old summaries)

## 🔑 Key APIs

### Vendor APIs
- `GET /api/vendor/products` - List products (with DELETE)
- `GET /api/vendor/inventory` - Unified inventory view (with DELETE)
- `GET /api/vendor/purchase-orders` - List POs
- `POST /api/vendor/purchase-orders` - Create PO
- `POST /api/vendor/purchase-orders/receive` - Receive items

### Admin APIs
- `DELETE /api/admin/products` - Delete any product (force option)
- `GET /api/admin/vendors` - List vendors
- `POST /api/admin/create-vendor-supabase` - Create vendor

## ⚡ Performance

- Parallel API loading
- Client-side filtering
- Optimistic updates
- Smart caching
- Image optimization

## 🔒 Security

- Row Level Security (RLS) on all tables
- Vendor isolation
- JWT authentication
- Server-side API keys
- HTTPS only

## 📊 Database

Single source of truth in Supabase:
- **One inventory table** (vendor + house inventory)
- **One products table** (all products)
- **One locations table** (retail + vendor locations)
- **One orders table** (online + POS)

## 🎯 Recent Updates

✅ Enhanced multi-location inventory management
✅ Purchase order system with COGS tracking
✅ Product deletion (vendor + admin)
✅ Inventory deletion (vendor only on own locations)
✅ Unified POS/vendor inventory view
✅ Codebase cleanup (140+ old files archived)

---

Built with ❤️ for enterprise-grade cannabis retail management.

