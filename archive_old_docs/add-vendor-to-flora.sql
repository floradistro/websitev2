-- Add vendor ID 151 to Flora Matrix
INSERT INTO wp_flora_vendors (user_id, store_name, slug, email, verified, featured, created_at)
VALUES (151, 'Real Working Vendor 1760992249', 'real-working-vendor-1760992249', 'realvendor1760992249@test.com', 1, 0, NOW())
ON DUPLICATE KEY UPDATE 
  store_name = 'Real Working Vendor 1760992249',
  email = 'realvendor1760992249@test.com',
  verified = 1;

