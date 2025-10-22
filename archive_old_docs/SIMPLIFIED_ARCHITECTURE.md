# Simplified Vendor Architecture

## Current (Complex):
```
Login → Supabase → Auth Bridge → WP Token → Vendor Proxy → Lookup Vendor → WordPress
```

## Simplified (Easy):
```
Login → Supabase → Get WP User ID → Direct WooCommerce APIs
```

## What Changes:

### REMOVE:
- ❌ `/flora-vendors/v1/vendors/me/*` endpoints (complex auth)
- ❌ Auth bridge complexity
- ❌ Vendor proxy lookups

### USE INSTEAD:
- ✅ `/wc/v3/products?author={wordpress_user_id}` (vendor's products)
- ✅ `/flora-im/v1/inventory?vendor_id={wordpress_user_id}` (vendor's inventory)
- ✅ `/wc/v3/orders?customer={wordpress_user_id}` (vendor's orders)

## Benefits:
- No custom WordPress auth needed
- Just use consumer keys (already have them)
- Supabase stores vendor profile + wordpress_user_id
- Direct API access, no proxy needed
- 90% less code

## Implementation:
```typescript
// After Supabase login
const vendor = await supabase.from('vendors').select('*').eq('email', user.email).single();

// Get vendor's products directly
const products = await axios.get(
  `${baseUrl}/wp-json/wc/v3/products?author=${vendor.wordpress_user_id}`,
  { auth: { username: ck, password: cs } }
);

// Get vendor's inventory directly  
const inventory = await axios.get(
  `${baseUrl}/wp-json/flora-im/v1/inventory?vendor_id=${vendor.wordpress_user_id}`,
  { auth: { username: ck, password: cs } }
);
```

No auth bridge, no proxy, no complexity!

