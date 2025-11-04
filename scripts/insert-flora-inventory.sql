-- Insert/Update Flora Distro inventory at Charlotte Monroe location
-- Vendor ID: cd2e1122-d511-4edb-be5d-98ef274b4baf
-- Location ID: 8cb9154e-c89c-4f5e-b751-74820e348b8a

-- FLOWER PRODUCTS (in grams)
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 112, NOW()
FROM products WHERE name = 'Blow Pop' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 112, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 68, NOW()
FROM products WHERE name = 'Bolo Candy' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 68, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 45, NOW()
FROM products WHERE name = 'Gary Payton' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 45, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 113, NOW()
FROM products WHERE name = 'Ghost Rider' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 113, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 73, NOW()
FROM products WHERE name = 'GG4' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 73, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 12, NOW()
FROM products WHERE name = 'Lava Cake' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 12, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 56, NOW()
FROM products WHERE name = 'Lemon Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 56, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 109, NOW()
FROM products WHERE name = 'Pez Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 109, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 71, NOW()
FROM products WHERE name = 'Pink Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 71, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 73, NOW()
FROM products WHERE name = 'Pink Soufflé' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 73, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 53, NOW()
FROM products WHERE name = 'Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 53, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 60, NOW()
FROM products WHERE name = 'Super Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 60, updated_at = NOW();

-- VAPES
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 45, NOW()
FROM products WHERE name = 'Pink Lemonade' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 45, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 16, NOW()
FROM products WHERE name = 'Orange Candy Crush' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 16, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 43, NOW()
FROM products WHERE name = 'Sprite' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 43, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 2, NOW()
FROM products WHERE name = 'Gelato 33' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 2, updated_at = NOW();

-- EDIBLES - GUMMIES
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 10, NOW()
FROM products WHERE name = 'Apple Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 10, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 1, NOW()
FROM products WHERE name = 'Blueberry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 1, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 20, NOW()
FROM products WHERE name = 'Cherry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 20, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 15, NOW()
FROM products WHERE name = 'Grape Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 15, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 9, NOW()
FROM products WHERE name = 'Green Tea Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 9, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 8, NOW()
FROM products WHERE name = 'Honey Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 8, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 12, NOW()
FROM products WHERE name = 'Raspberry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 12, updated_at = NOW();

-- EDIBLES - COOKIES
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 20, NOW()
FROM products WHERE name = 'Snickerdoodle Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 20, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 19, NOW()
FROM products WHERE name = 'Peanut Butter Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 19, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 2, NOW()
FROM products WHERE name = 'Chewy Chocolate Chip' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 2, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 17, NOW()
FROM products WHERE name = 'Chocolate Chip Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 17, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 3, NOW()
FROM products WHERE name = 'Thin Mint Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 3, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 4, NOW()
FROM products WHERE name = 'Oreo Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 4, updated_at = NOW();

-- MOONWATERS - 5mg DAY DRINKER (Clementine Orange)
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 72, NOW()
FROM products WHERE name = 'Clementine Orange' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%5%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 72, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 27, NOW()
FROM products WHERE name = 'Fizzy Punch' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%5%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 27, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 23, NOW()
FROM products WHERE name = 'Fizzy Lemonade' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%5%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 23, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 44, NOW()
FROM products WHERE name = 'Lemon Ginger' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%5%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 44, updated_at = NOW();

-- MOONWATERS - 10mg GOLDEN HOUR
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 18, NOW()
FROM products WHERE name = 'Clementine Orange' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%10%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 18, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 23, NOW()
FROM products WHERE name = 'Fizzy Punch' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%10%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 23, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 20, NOW()
FROM products WHERE name = 'Fizzy Lemonade' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%10%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 20, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 11, NOW()
FROM products WHERE name = 'Lemon Ginger' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%10%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 11, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 5, NOW()
FROM products WHERE name = 'Berry Twist' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%10%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 5, updated_at = NOW();

-- MOONWATERS - 30mg DARKSIDE
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 18, NOW()
FROM products WHERE name = 'Clementine Orange' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%30%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 18, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 11, NOW()
FROM products WHERE name = 'Fizzy Punch' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%30%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 11, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 35, NOW()
FROM products WHERE name = 'Fizzy Lemonade' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%30%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 35, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 27, NOW()
FROM products WHERE name = 'Lemon Ginger' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND description ILIKE '%30%mg%' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 27, updated_at = NOW();

-- HASH HOLES - 1.3g
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 7, NOW()
FROM products WHERE name ILIKE '%kush%mint%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 7, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 6, NOW()
FROM products WHERE name ILIKE '%gaslicious%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 6, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 6, NOW()
FROM products WHERE name ILIKE '%gummy%bear%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 6, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 2, NOW()
FROM products WHERE name ILIKE '%sour%garlic%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 2, updated_at = NOW();

-- HASH HOLES - 2.5g
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 6, NOW()
FROM products WHERE name ILIKE '%sour%diesel%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 6, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 9, NOW()
FROM products WHERE name = 'Caramel Delight 2.5g' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 9, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 8, NOW()
FROM products WHERE name = 'Fire Breath 2.5g' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 8, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 8, NOW()
FROM products WHERE name ILIKE '%grape%gas%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 8, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 10, NOW()
FROM products WHERE name ILIKE '%mellow%flower%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 10, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 10, NOW()
FROM products WHERE name ILIKE '%rocky%road%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 10, updated_at = NOW();

-- CONCENTRATE - ROSIN
INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 9, NOW()
FROM products WHERE name ILIKE '%sinmint%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 9, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 7, NOW()
FROM products WHERE name ILIKE '%mac%cocktail%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 7, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 6, NOW()
FROM products WHERE name = 'Fatso' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 6, updated_at = NOW();

INSERT INTO inventory (product_id, location_id, vendor_id, quantity, updated_at)
SELECT id, '8cb9154e-c89c-4f5e-b751-74820e348b8a', 'cd2e1122-d511-4edb-be5d-98ef274b4baf', 14, NOW()
FROM products WHERE name = 'Apple Kush' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1
ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = 14, updated_at = NOW();
