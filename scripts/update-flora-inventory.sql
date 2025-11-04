-- Update Flora Distro inventory at Charlotte Monroe location
-- Vendor ID: cd2e1122-d511-4edb-be5d-98ef274b4baf
-- Location ID: 8cb9154e-c89c-4f5e-b751-74820e348b8a

-- FLOWER PRODUCTS (in grams)
UPDATE inventory
SET
  quantity = 112,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Blo Pop' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 68,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Bolo' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 45,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Gary Payton' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 113,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Ghost Rider' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 73,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'GG4' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 12,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Lava' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 56,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Lemon Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 109,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Pez Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 71,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Pink Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 73,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Pink Soufflé' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 53,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 60,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Super Runtz' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- VAPES
UPDATE inventory
SET
  quantity = 45,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Pink Lemonade' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 16,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Orange Candy Crush' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 43,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Sprite' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 2,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Gelato 33' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- EDIBLES - GUMMIES
UPDATE inventory
SET
  quantity = 10,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Apple Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 1,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Blueberry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 20,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Cherry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 15,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Grape Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 9,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Green Tea Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 8,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Honey Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 12,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Raspberry Gummies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- EDIBLES - COOKIES
UPDATE inventory
SET
  quantity = 20,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Snickerdoodle Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 19,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Peanut Butter Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 2,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Chewy Chocolate Chip' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 17,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Chocolate Chip Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 3,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Thin Mint Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 4,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name = 'Oreo Cookies' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- MOONWATERS - 5mg DAY DRINKER
UPDATE inventory
SET
  quantity = 72,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%clementine%' AND name ILIKE '%5%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 27,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%punch%' AND name ILIKE '%5%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 23,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%lemonade%' AND name ILIKE '%5%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 44,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%lemon%ginger%' AND name ILIKE '%5%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- MOONWATERS - 10mg GOLDEN HOUR
UPDATE inventory
SET
  quantity = 18,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%clementine%' AND name ILIKE '%10%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 23,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%punch%' AND name ILIKE '%10%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 20,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%lemonade%' AND name ILIKE '%10%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 11,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%lemon%ginger%' AND name ILIKE '%10%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 5,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%berry%twist%' AND name ILIKE '%10%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- MOONWATERS - 30mg DARKSIDE
UPDATE inventory
SET
  quantity = 18,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%clementine%' AND name ILIKE '%30%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 11,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%punch%' AND name ILIKE '%30%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 35,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fizzy%lemonade%' AND name ILIKE '%30%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 27,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%lemon%ginger%' AND name ILIKE '%30%mg%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- HASH HOLES - 1.3g
UPDATE inventory
SET
  quantity = 7,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%kush%mint%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 6,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%gaslicious%clay%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 6,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%gummy%bear%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 2,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%sour%garlic%' AND name ILIKE '%1.3%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- HASH HOLES - 2.5g
UPDATE inventory
SET
  quantity = 6,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%sour%diesel%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 9,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%caramel%delight%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 8,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fire%breath%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 8,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%grape%gas%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 10,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%mellow%flower%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 10,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%rocky%road%' AND name ILIKE '%2.5%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

-- CONCENTRATE - ROSIN
UPDATE inventory
SET
  quantity = 9,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%sinmint%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 7,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%mac%cocktail%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 6,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%fatso%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';

UPDATE inventory
SET
  quantity = 14,
  updated_at = NOW()
WHERE product_id = (SELECT id FROM products WHERE name ILIKE '%apple%kush%' AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' LIMIT 1)
  AND location_id = '8cb9154e-c89c-4f5e-b751-74820e348b8a';
