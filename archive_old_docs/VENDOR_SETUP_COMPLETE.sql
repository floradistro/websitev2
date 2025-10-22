-- =============================================
-- MOONWATER VENDOR SETUP - Run in phpMyAdmin
-- Database: dbpm1080lhrpq2
-- =============================================

-- 1. Set user role to wc_product_vendors_admin_vendor
UPDATE dbpm1080lhrpq2.wp_usermeta 
SET meta_value = 'a:1:{s:32:"wc_product_vendors_admin_vendor";b:1;}' 
WHERE user_id = 140 
AND meta_key = 'wp_capabilities';

-- 2. Add vendor metadata (use INSERT IGNORE to avoid duplicates)
INSERT INTO dbpm1080lhrpq2.wp_usermeta (user_id, meta_key, meta_value) VALUES 
(140, 'store_name', 'Moonwater'),
(140, '_wcfm_vendor', 'yes'),
(140, 'wcfmmp_vendor_store_name', 'Moonwater'),
(140, 'wcfm_email', 'eli@moonwaterbeverages.com'),
(140, '_wcfm_vendor_status', 'approved'),
(140, 'wcfm_vendor_active', '1')
ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value);

-- 3. Add to vendor table (if exists) - ACTIVATED
INSERT INTO dbpm1080lhrpq2.wp_flora_vendors 
(user_id, store_name, slug, email, verified, featured, created_at) 
VALUES 
(140, 'Moonwater', 'moonwater', 'eli@moonwaterbeverages.com', 1, 0, NOW())
ON DUPLICATE KEY UPDATE 
  store_name = 'Moonwater', 
  email = 'eli@moonwaterbeverages.com',
  verified = 1;

-- 4. Create default vendor location (for inventory)
INSERT IGNORE INTO dbpm1080lhrpq2.wp_flora_locations 
(name, vendor_id, address, city, state, zip, is_default, status, created_at, updated_at)
VALUES 
('Moonwater Warehouse', 140, '', '', '', '', 1, 'active', NOW(), NOW());

-- 5. Set vendor as active in options table
INSERT INTO dbpm1080lhrpq2.wp_options (option_name, option_value, autoload) 
VALUES ('wcfm_vendor_active_140', '1', 'no')
ON DUPLICATE KEY UPDATE option_value = '1';

-- Verify results
SELECT 
    u.ID,
    u.user_login,
    u.user_email,
    (SELECT meta_value FROM dbpm1080lhrpq2.wp_usermeta WHERE user_id = u.ID AND meta_key = 'wp_capabilities') as role,
    (SELECT meta_value FROM dbpm1080lhrpq2.wp_usermeta WHERE user_id = u.ID AND meta_key = 'store_name') as store_name,
    (SELECT meta_value FROM dbpm1080lhrpq2.wp_usermeta WHERE user_id = u.ID AND meta_key = '_wcfm_vendor') as is_vendor,
    (SELECT meta_value FROM dbpm1080lhrpq2.wp_usermeta WHERE user_id = u.ID AND meta_key = '_wcfm_vendor_status') as status
FROM dbpm1080lhrpq2.wp_users u
WHERE u.ID = 140;

