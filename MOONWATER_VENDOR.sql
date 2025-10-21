-- First, find the correct table prefix
SHOW TABLES FROM dbpm1080lhrpq2 LIKE '%usermeta%';

-- Then use this (replace PREFIX_ with the actual prefix you see):
-- UPDATE dbpm1080lhrpq2.PREFIX_usermeta 
-- SET meta_value = 'a:1:{s:32:"wc_product_vendors_admin_vendor";b:1;}' 
-- WHERE user_id = 140 AND meta_key = 'PREFIX_capabilities';


