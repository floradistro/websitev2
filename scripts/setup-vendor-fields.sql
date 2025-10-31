-- Setup vendor-specific fields for all Flora Distro categories
-- Using ONLY vendor_product_fields (no admin field groups)

-- Flower fields
INSERT INTO vendor_product_fields (vendor_id, category_id, field_id, field_definition, is_active, sort_order)
VALUES
  -- Flower
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'strain_type',
   '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'thca_percentage',
   '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'lineage',
   '{"label": "Lineage", "slug": "lineage", "type": "text", "required": false, "placeholder": "e.g., OG Kush x Durban Poison"}'::jsonb, true, 3),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723', 'nose',
   '{"label": "Nose/Terpenes", "slug": "nose", "type": "text", "required": false}'::jsonb, true, 4),

  -- Concentrates
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'extract_type',
   '{"label": "Extract Type", "slug": "extract_type", "type": "select", "options": ["Shatter", "Wax", "Live Resin", "Distillate", "Rosin"], "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'strain_type',
   '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": false}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', 'e9b86776-f9f4-4f42-a7cc-873d34671d0a', 'thca_percentage',
   '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 3),

  -- Edibles
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'dosage_per_serving',
   '{"label": "Dosage per Serving", "slug": "dosage_per_serving", "type": "number", "suffix": "mg", "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'servings_per_package',
   '{"label": "Servings per Package", "slug": "servings_per_package", "type": "number", "required": false}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5533179e-43e0-4565-a600-b1e7aa270a60', 'ingredients',
   '{"label": "Ingredients", "slug": "ingredients", "type": "textarea", "required": false}'::jsonb, true, 3),

  -- Vape
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'hardware_type',
   '{"label": "Hardware Type", "slug": "hardware_type", "type": "select", "options": ["510 Cartridge", "Disposable", "Pod System"], "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'oil_type',
   '{"label": "Oil Type", "slug": "oil_type", "type": "select", "options": ["Distillate", "Live Resin", "Full Spectrum"], "required": false}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '33f4655c-9a42-429c-b46b-ff0100d8d132', 'strain_type',
   '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": false}'::jsonb, true, 3),

  -- Pre-Rolls
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5cb391e4-91f7-4ffa-8c3f-780d70ccb157', 'strain_type',
   '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5cb391e4-91f7-4ffa-8c3f-780d70ccb157', 'weight',
   '{"label": "Weight", "slug": "weight", "type": "text", "required": false, "placeholder": "e.g., 1g, 0.5g"}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '5cb391e4-91f7-4ffa-8c3f-780d70ccb157', 'thca_percentage',
   '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 3),

  -- Hash Holes
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '2b3ed050-daff-4406-9f9e-01edb2343fa1', 'strain_type',
   '{"label": "Strain Type", "slug": "strain_type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": true}'::jsonb, true, 1),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '2b3ed050-daff-4406-9f9e-01edb2343fa1', 'thca_percentage',
   '{"label": "THCa %", "slug": "thca_percentage", "type": "number", "suffix": "%", "required": false}'::jsonb, true, 2),
  ('cd2e1122-d511-4edb-be5d-98ef274b4baf', '2b3ed050-daff-4406-9f9e-01edb2343fa1', 'weight',
   '{"label": "Weight", "slug": "weight", "type": "text", "required": false}'::jsonb, true, 3)

ON CONFLICT (vendor_id, category_id, field_id) DO NOTHING;
