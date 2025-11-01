-- =====================================================
-- SEED FLORA DISTRO DEJAVOO CONFIGURATIONS
-- Sets up 3 locations with Dejavoo payment processors
-- =====================================================

-- Flora Distro Vendor ID
DO $$
DECLARE
  v_vendor_id UUID := 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
  v_charlotte_location_id UUID := '8cb9154e-c89c-4f5e-b751-74820e348b8a';
  v_salisbury_location_id UUID := '3cb3be4c-8f44-4d4d-b37e-9f929ae5e840';
  v_blowing_rock_location_id UUID := '4d0685cc-6dfd-4c2e-a640-d8cfd4080975';

  v_charlotte_processor_id UUID;
  v_salisbury_processor_id UUID;
  v_blowing_rock_processor_id UUID;

  v_charlotte_config_id UUID;
  v_salisbury_config_id UUID;
  v_blowing_rock_config_id UUID;
BEGIN

-- ============================================================
-- 1. CHARLOTTE MONROE - Payment Processor Configuration
-- ============================================================

INSERT INTO payment_processors (
  vendor_id,
  location_id,
  processor_type,
  processor_name,
  is_active,
  is_default,
  environment,
  dejavoo_authkey,
  dejavoo_tpn,
  dejavoo_merchant_id,
  dejavoo_store_number,
  dejavoo_v_number
) VALUES (
  v_vendor_id,
  v_charlotte_location_id,
  'dejavoo',
  'Dejavoo - Charlotte Monroe',
  true,
  true, -- Default processor for Charlotte
  'production',
  '123ABC123',
  'CHARLMON01', -- Generate unique TPN
  '000000069542',
  '3133',
  'V7979944'
) RETURNING id INTO v_charlotte_processor_id;

-- Charlotte Dejavoo Terminal Configuration (VAR Sheet)
INSERT INTO dejavoo_terminal_configs (
  location_id,
  payment_processor_id,
  v_number,
  merchant_id,
  store_number,
  hc_pos_id,
  terminal_number,
  location_number,
  tpn,
  mcc,
  agent,
  chain,
  bin,
  merchant_aba,
  settlement_agent,
  reimbursement_attribute,
  authentication_code,
  entitlements,
  manufacturer,
  model,
  software_version,
  time_zone,
  ebt_fcs_id,
  is_active
) VALUES (
  v_charlotte_location_id,
  v_charlotte_processor_id,
  'V7979944',
  '000000069542',
  '3133',
  '400036395474658',
  '0005',
  '000001',
  'CHARLMON01',
  '5499',
  '580401',
  '025804',
  '439802',
  '916072851',
  'V301',
  'Z',
  '123ABC123',
  '["ATM", "Visa", "Mastercard", "Discover", "American Express", "JCB"]'::jsonb,
  'STAGE',
  'Dejavoo P8',
  'HCSTGEN',
  '705',
  '0000000',
  true
) RETURNING id INTO v_charlotte_config_id;

-- ============================================================
-- 2. SALISBURY - Payment Processor Configuration
-- ============================================================

INSERT INTO payment_processors (
  vendor_id,
  location_id,
  processor_type,
  processor_name,
  is_active,
  is_default,
  environment,
  dejavoo_authkey,
  dejavoo_tpn,
  dejavoo_merchant_id,
  dejavoo_store_number,
  dejavoo_v_number
) VALUES (
  v_vendor_id,
  v_salisbury_location_id,
  'dejavoo',
  'Dejavoo - Salisbury',
  true,
  true, -- Default processor for Salisbury
  'production',
  '123ABC123',
  'SALISBURY01',
  '000000069559',
  '1112',
  'V7979946'
) RETURNING id INTO v_salisbury_processor_id;

-- Salisbury Dejavoo Terminal Configuration (VAR Sheet)
INSERT INTO dejavoo_terminal_configs (
  location_id,
  payment_processor_id,
  v_number,
  merchant_id,
  store_number,
  hc_pos_id,
  terminal_number,
  location_number,
  tpn,
  mcc,
  agent,
  chain,
  bin,
  merchant_aba,
  settlement_agent,
  reimbursement_attribute,
  authentication_code,
  entitlements,
  manufacturer,
  model,
  software_version,
  time_zone,
  ebt_fcs_id,
  is_active
) VALUES (
  v_salisbury_location_id,
  v_salisbury_processor_id,
  'V7979946',
  '000000069559',
  '1112',
  '100054395474658',
  '0005',
  '000001',
  'SALISBURY01',
  '5499',
  '580401',
  '025804',
  '439802',
  '916072851',
  'V301',
  'Z',
  '123ABC123',
  '["Visa", "Mastercard", "Discover", "American Express", "JCB", "ATM"]'::jsonb,
  'STAGE',
  'Dejavoo P8',
  'HCSTGEN',
  '705',
  '0000000',
  true
) RETURNING id INTO v_salisbury_config_id;

-- ============================================================
-- 3. BLOWING ROCK - Payment Processor Configuration
-- ============================================================

INSERT INTO payment_processors (
  vendor_id,
  location_id,
  processor_type,
  processor_name,
  is_active,
  is_default,
  environment,
  dejavoo_authkey,
  dejavoo_tpn,
  dejavoo_merchant_id,
  dejavoo_store_number,
  dejavoo_v_number
) VALUES (
  v_vendor_id,
  v_blowing_rock_location_id,
  'dejavoo',
  'Dejavoo - Blowing Rock',
  true,
  true, -- Default processor for Blowing Rock
  'production',
  '123ABC123',
  'BLOWROCK01',
  '000000069534',
  '3892',
  'V7979925'
) RETURNING id INTO v_blowing_rock_processor_id;

-- Blowing Rock Dejavoo Terminal Configuration (VAR Sheet)
INSERT INTO dejavoo_terminal_configs (
  location_id,
  payment_processor_id,
  v_number,
  merchant_id,
  store_number,
  hc_pos_id,
  terminal_number,
  location_number,
  tpn,
  mcc,
  agent,
  chain,
  bin,
  merchant_aba,
  settlement_agent,
  reimbursement_attribute,
  authentication_code,
  entitlements,
  manufacturer,
  model,
  software_version,
  time_zone,
  ebt_fcs_id,
  is_active
) VALUES (
  v_blowing_rock_location_id,
  v_blowing_rock_processor_id,
  'V7979925',
  '000000069534',
  '3892',
  '300045395474644',
  '0005',
  '000001',
  'BLOWROCK01',
  '5499',
  '580401',
  '025804',
  '439802',
  '916072851',
  'V301',
  'Z',
  '123ABC123',
  '["Visa", "Mastercard", "Discover", "American Express", "JCB", "ATM"]'::jsonb,
  'STAGE',
  'Dejavoo P8',
  'HCSTGEN',
  '705',
  '0000000',
  true
) RETURNING id INTO v_blowing_rock_config_id;

-- ============================================================
-- 4. UPDATE EXISTING POS REGISTERS WITH DEJAVOO CONFIGURATION
-- ============================================================

-- Charlotte Monroe - Update existing register
UPDATE pos_registers
SET
  register_name = 'Front Counter',
  device_name = 'Dejavoo P8 #1',
  device_type = 'android_tablet',
  payment_processor_id = v_charlotte_processor_id,
  dejavoo_config_id = v_charlotte_config_id,
  processor_type = 'dejavoo',
  hardware_model = 'Dejavoo P8',
  status = 'active',
  allow_cash = true,
  allow_card = true,
  allow_refunds = true,
  allow_voids = true,
  supports_nfc = true,
  supports_emv = true,
  supports_magstripe = true,
  supports_ebt = true
WHERE register_number = 'REG-CHA-001'
  AND location_id = v_charlotte_location_id;

-- Salisbury - Update existing register
UPDATE pos_registers
SET
  register_name = 'Front Counter',
  device_name = 'Dejavoo P8 #2',
  device_type = 'android_tablet',
  payment_processor_id = v_salisbury_processor_id,
  dejavoo_config_id = v_salisbury_config_id,
  processor_type = 'dejavoo',
  hardware_model = 'Dejavoo P8',
  status = 'active',
  allow_cash = true,
  allow_card = true,
  allow_refunds = true,
  allow_voids = true,
  supports_nfc = true,
  supports_emv = true,
  supports_magstripe = true,
  supports_ebt = true
WHERE register_number = 'REG-SAL-001'
  AND location_id = v_salisbury_location_id;

-- Blowing Rock - Update existing register
UPDATE pos_registers
SET
  register_name = 'Front Counter',
  device_name = 'Dejavoo P8 #3',
  device_type = 'android_tablet',
  payment_processor_id = v_blowing_rock_processor_id,
  dejavoo_config_id = v_blowing_rock_config_id,
  processor_type = 'dejavoo',
  hardware_model = 'Dejavoo P8',
  status = 'active',
  allow_cash = true,
  allow_card = true,
  allow_refunds = true,
  allow_voids = true,
  supports_nfc = true,
  supports_emv = true,
  supports_magstripe = true,
  supports_ebt = true
WHERE register_number = 'REG-BLO-001'
  AND location_id = v_blowing_rock_location_id;

-- ============================================================
-- 5. SETUP LOCATION PAYMENT METHODS
-- ============================================================

-- Charlotte Monroe Payment Methods
INSERT INTO location_payment_methods (location_id, method_type, method_name, is_enabled, requires_processor, default_processor_id, allow_tips, requires_signature) VALUES
  (v_charlotte_location_id, 'cash', 'Cash', true, false, NULL, true, false),
  (v_charlotte_location_id, 'credit', 'Credit Card', true, true, v_charlotte_processor_id, true, true),
  (v_charlotte_location_id, 'debit', 'Debit Card', true, true, v_charlotte_processor_id, true, true),
  (v_charlotte_location_id, 'ebt_food', 'EBT SNAP', true, true, v_charlotte_processor_id, false, false),
  (v_charlotte_location_id, 'ebt_cash', 'EBT Cash', true, true, v_charlotte_processor_id, false, false);

-- Salisbury Payment Methods
INSERT INTO location_payment_methods (location_id, method_type, method_name, is_enabled, requires_processor, default_processor_id, allow_tips, requires_signature) VALUES
  (v_salisbury_location_id, 'cash', 'Cash', true, false, NULL, true, false),
  (v_salisbury_location_id, 'credit', 'Credit Card', true, true, v_salisbury_processor_id, true, true),
  (v_salisbury_location_id, 'debit', 'Debit Card', true, true, v_salisbury_processor_id, true, true),
  (v_salisbury_location_id, 'ebt_food', 'EBT SNAP', true, true, v_salisbury_processor_id, false, false),
  (v_salisbury_location_id, 'ebt_cash', 'EBT Cash', true, true, v_salisbury_processor_id, false, false);

-- Blowing Rock Payment Methods
INSERT INTO location_payment_methods (location_id, method_type, method_name, is_enabled, requires_processor, default_processor_id, allow_tips, requires_signature) VALUES
  (v_blowing_rock_location_id, 'cash', 'Cash', true, false, NULL, true, false),
  (v_blowing_rock_location_id, 'credit', 'Credit Card', true, true, v_blowing_rock_processor_id, true, true),
  (v_blowing_rock_location_id, 'debit', 'Debit Card', true, true, v_blowing_rock_processor_id, true, true),
  (v_blowing_rock_location_id, 'ebt_food', 'EBT SNAP', true, true, v_blowing_rock_processor_id, false, false),
  (v_blowing_rock_location_id, 'ebt_cash', 'EBT Cash', true, true, v_blowing_rock_processor_id, false, false);

RAISE NOTICE 'Flora Distro Dejavoo configuration complete for 3 locations';

END $$;
