# Developer Keys - Flora Distribution API

## WordPress Production API
**Base URL**: https://api.floradistro.com

### WooCommerce API Keys
```
Consumer Key: ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5
Consumer Secret: cs_38194e74c7ddc5d72b6c32c70485728e7e529678
```

### Usage
These keys provide full access to the WooCommerce REST API for:
- Products
- Orders
- Customers
- Vendors
- Inventory Management
- Shipping
- Payment Processing

### API Endpoints
- Base: `https://api.floradistro.com/wp-json/wc/v3/`
- Vendor: `https://api.floradistro.com/wp-json/flora/v1/`

### Authentication
Use Basic Auth with Consumer Key as username and Consumer Secret as password:
```bash
curl -u ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678 \
  https://api.floradistro.com/wp-json/wc/v3/products
```

## Database Access
**Host**: 127.0.0.1  
**Database**: dbpm1080lhrpq2  
**Username**: unr9f5qnxgdfb  
**Password**: csh4jneuc074  
**Table Prefix**: avu_

## Server Access (Siteground)
**Hostname**: gvam1142.siteground.biz  
**SSH Port**: 18765  
**Username**: u2736-pgt6vpiklij1  
**Auth**: SSH Key (provided separately)

**WordPress Installation Path**: `/home/customer/www/api.floradistro.com/public_html/`

## Important Notes
- ⚠️ Keep these keys secure and never commit to public repositories
- ⚠️ These keys have full admin access to the WordPress/WooCommerce system
- ⚠️ Rate limits may apply to API requests
- ✅ All keys are for production environment

