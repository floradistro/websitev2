-- Setup EXACT field specifications as per user requirements
-- Flora Distro vendor fields

-- FLOWER FIELDS
INSERT INTO vendor_product_fields (vendor_id, category_id, field_id, field_definition, is_active, sort_order) VALUES
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'strain_type',
 '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": true}'::jsonb, true, 1),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'nose',
 '{"label": "Nose", "slug": "nose", "type": "text", "required": false}'::jsonb, true, 2),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'genetics',
 '{"label": "Genetics", "slug": "genetics", "type": "text", "required": false, "placeholder": "e.g., OG Kush x Durban Poison"}'::jsonb, true, 3),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'terpenes',
 '{"label": "Terpenes", "slug": "terpenes", "type": "text", "required": false}'::jsonb, true, 4),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'thca_percentage',
 '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 5),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'd9_percentage',
 '{"label": "Δ9 %", "slug": "d9_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 6),

-- CONCENTRATE FIELDS
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'strain_type',
 '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": false}'::jsonb, true, 1),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'consistency',
 '{"label": "Consistency", "slug": "consistency", "type": "select", "options": ["Shatter", "Wax", "Live Resin", "Distillate", "Rosin", "Crumble", "Budder", "Sauce"], "required": false}'::jsonb, true, 2),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'nose',
 '{"label": "Nose", "slug": "nose", "type": "text", "required": false}'::jsonb, true, 3),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'genetics',
 '{"label": "Genetics", "slug": "genetics", "type": "text", "required": false}'::jsonb, true, 4),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'terpenes',
 '{"label": "Terpenes", "slug": "terpenes", "type": "text", "required": false}'::jsonb, true, 5),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'thca_percentage',
 '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 6),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'd9_percentage',
 '{"label": "Δ9 %", "slug": "d9_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 7),

-- EDIBLES FIELDS
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'edible_type',
 '{"label": "Edible Type", "slug": "edible_type", "type": "select", "options": ["Cookies", "Gummies", "Chocolates", "Brownies", "Hard Candy", "Drinks", "Mints", "Other"], "required": false}'::jsonb, true, 1),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'total_mg_per_package',
 '{"label": "Total MG Per Package", "slug": "total_mg_per_package", "type": "number", "suffix": "mg", "required": false}'::jsonb, true, 2),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'total_mg_per_piece',
 '{"label": "Total MG Per Piece", "slug": "total_mg_per_piece", "type": "number", "suffix": "mg", "required": false}'::jsonb, true, 3),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'd9_percentage',
 '{"label": "Δ9 %", "slug": "d9_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 4),

-- VAPE FIELDS
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'vape_type',
 '{"label": "Vape Type", "slug": "vape_type", "type": "select", "options": ["Disposable", "Cartridge", "Pod System"], "required": false}'::jsonb, true, 1),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'tank_size',
 '{"label": "Tank Size", "slug": "tank_size", "type": "select", "options": ["0.5g", "1g", "1ml", "2g", "2ml"], "required": false}'::jsonb, true, 2),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'strain_type',
 '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": false}'::jsonb, true, 3),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'nose',
 '{"label": "Nose", "slug": "nose", "type": "text", "required": false}'::jsonb, true, 4),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'genetics',
 '{"label": "Genetics", "slug": "genetics", "type": "text", "required": false}'::jsonb, true, 5),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'terpenes',
 '{"label": "Terpenes", "slug": "terpenes", "type": "text", "required": false}'::jsonb, true, 6),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'thca_percentage',
 '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 7),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'd9_percentage',
 '{"label": "Δ9 %", "slug": "d9_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 8),

-- BEVERAGES FIELDS (keep existing)
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '64ca5109-04c7-4279-bef5-c7da59a42654', 'dosage',
 '{"label": "Dosage", "slug": "dosage", "type": "text", "required": false, "placeholder": "e.g., 10mg"}'::jsonb, true, 1),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '64ca5109-04c7-4279-bef5-c7da59a42654', 'flavor',
 '{"label": "Flavor", "slug": "flavor", "type": "text", "required": false}'::jsonb, true, 2),
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '64ca5109-04c7-4279-bef5-c7da59a42654', 'line',
 '{"label": "Product Line", "slug": "line", "type": "text", "required": false}'::jsonb, true, 3)

ON CONFLICT (vendor_id, category_id, field_id) DO NOTHING;
