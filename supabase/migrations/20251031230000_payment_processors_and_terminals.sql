-- =====================================================
-- PAYMENT PROCESSORS & TERMINAL CONFIGURATION SYSTEM
-- Enables multi-processor support with Dejavoo SPIN integration
-- =====================================================

-- ============================================================
-- 1. PAYMENT PROCESSORS TABLE
-- Stores payment processor configurations per vendor/location
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  -- Processor type and status
  processor_type TEXT NOT NULL CHECK (processor_type IN ('dejavoo', 'authorize_net', 'stripe', 'square', 'clover')),
  processor_name TEXT NOT NULL, -- User-friendly name (e.g., "Dejavoo - Charlotte")
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default processor for this location

  -- Environment
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),

  -- Dejavoo SPIN Configuration
  dejavoo_authkey TEXT, -- Authentication password (max 10 chars)
  dejavoo_tpn TEXT, -- Terminal Profile Number (10-12 chars)
  dejavoo_merchant_id TEXT, -- Merchant ID from VAR sheet
  dejavoo_store_number TEXT, -- Store number from VAR sheet
  dejavoo_v_number TEXT, -- V# from VAR sheet
  dejavoo_register_id TEXT, -- Alternative terminal identifier (obsolete but supported)

  -- Authorize.Net Configuration
  authorizenet_api_login_id TEXT,
  authorizenet_transaction_key TEXT,
  authorizenet_public_client_key TEXT,

  -- Stripe Configuration
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  stripe_webhook_secret TEXT,

  -- Square Configuration
  square_application_id TEXT,
  square_access_token TEXT,
  square_location_id TEXT,

  -- Clover Configuration
  clover_merchant_id TEXT,
  clover_api_token TEXT,

  -- Processor-specific settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'failed', NULL)),
  last_test_error TEXT,

  -- Constraints
  CONSTRAINT vendor_or_location_required CHECK (location_id IS NOT NULL OR vendor_id IS NOT NULL)
);

CREATE INDEX idx_payment_processors_vendor ON payment_processors(vendor_id);
CREATE INDEX idx_payment_processors_location ON payment_processors(location_id);
CREATE INDEX idx_payment_processors_active ON payment_processors(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_unique_default_per_location ON payment_processors(location_id) WHERE is_default = true;

COMMENT ON TABLE payment_processors IS 'Stores payment processor configurations per vendor/location';
COMMENT ON COLUMN payment_processors.dejavoo_tpn IS 'Terminal Profile Number - identifies terminal in Dejavoo SPIN environment';
COMMENT ON COLUMN payment_processors.is_default IS 'Default processor for location - only one allowed per location';

-- ============================================================
-- 2. DEJAVOO TERMINAL CONFIGURATIONS TABLE
-- Stores complete VAR sheet data for Dejavoo terminals
-- ============================================================

CREATE TABLE IF NOT EXISTS dejavoo_terminal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  payment_processor_id UUID REFERENCES payment_processors(id) ON DELETE SET NULL,

  -- VAR Sheet Identifiers
  v_number TEXT NOT NULL, -- V# (e.g., V7979944)
  merchant_id TEXT NOT NULL, -- Merchant ID (e.g., 000000069542)
  store_number TEXT NOT NULL, -- Store Number (e.g., 3133)
  hc_pos_id TEXT NOT NULL, -- HC POS ID (e.g., 400036395474658)

  -- Terminal Identification
  terminal_number TEXT NOT NULL DEFAULT '0005', -- Terminal Number
  location_number TEXT NOT NULL DEFAULT '000001', -- Location Number
  tpn TEXT, -- Terminal Profile Number (if different from payment_processor)

  -- Network Configuration
  mcc TEXT, -- Merchant Category Code (e.g., 5499)
  agent TEXT, -- Agent code
  chain TEXT, -- Chain code
  bin TEXT, -- Bank Identification Number
  merchant_aba TEXT, -- Merchant ABA routing number

  -- Settlement Configuration
  settlement_agent TEXT, -- Settlement Agent (e.g., V301)
  reimbursement_attribute TEXT, -- Reimbursement Attribute (e.g., Z)

  -- Authentication & Security
  authentication_code TEXT NOT NULL, -- Authentication Code (e.g., 123ABC123)

  -- Entitlements (payment types accepted)
  entitlements JSONB DEFAULT '[]', -- ["Visa", "Mastercard", "Discover", "Amex", "JCB", "ATM"]

  -- Terminal Hardware
  manufacturer TEXT, -- e.g., "STAGE"
  model TEXT, -- e.g., "STAGE" or "Dejavoo P8"
  software_version TEXT, -- e.g., "HCSTGEN"

  -- Time Zone
  time_zone TEXT, -- e.g., "705" (Eastern Time)

  -- EBT Configuration
  ebt_fcs_id TEXT, -- EBT FCS ID

  -- Additional settings
  settings JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_terminal_per_location UNIQUE (location_id, terminal_number)
);

CREATE INDEX idx_dejavoo_terminals_location ON dejavoo_terminal_configs(location_id);
CREATE INDEX idx_dejavoo_terminals_merchant ON dejavoo_terminal_configs(merchant_id);
CREATE INDEX idx_dejavoo_terminals_v_number ON dejavoo_terminal_configs(v_number);

COMMENT ON TABLE dejavoo_terminal_configs IS 'Stores complete Dejavoo VAR sheet configuration data per location';
COMMENT ON COLUMN dejavoo_terminal_configs.hc_pos_id IS 'HC POS ID - unique identifier for terminal in Dejavoo system';

-- ============================================================
-- 3. EXTEND POS_REGISTERS TABLE
-- Add payment processor and terminal configuration references
-- ============================================================

-- Add columns to existing pos_registers table
ALTER TABLE pos_registers
  ADD COLUMN IF NOT EXISTS payment_processor_id UUID REFERENCES payment_processors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dejavoo_config_id UUID REFERENCES dejavoo_terminal_configs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processor_type TEXT CHECK (processor_type IN ('dejavoo', 'authorize_net', 'stripe', 'square', 'clover', 'none')),
  ADD COLUMN IF NOT EXISTS hardware_model TEXT, -- e.g., "Dejavoo P8", "iPad Pro", "Android Tablet"
  ADD COLUMN IF NOT EXISTS serial_number TEXT, -- Hardware serial number
  ADD COLUMN IF NOT EXISTS firmware_version TEXT, -- Device firmware version
  ADD COLUMN IF NOT EXISTS supports_nfc BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_emv BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_magstripe BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_ebt BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pos_registers_processor ON pos_registers(payment_processor_id);
CREATE INDEX IF NOT EXISTS idx_pos_registers_dejavoo_config ON pos_registers(dejavoo_config_id);

COMMENT ON COLUMN pos_registers.payment_processor_id IS 'Payment processor configuration used by this register';
COMMENT ON COLUMN pos_registers.dejavoo_config_id IS 'Dejavoo terminal configuration if using Dejavoo processor';
COMMENT ON COLUMN pos_registers.hardware_model IS 'Physical hardware model (e.g., Dejavoo P8, iPad Pro)';

-- ============================================================
-- 4. PAYMENT TRANSACTIONS LOG TABLE
-- Logs all payment processor transactions for auditing
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  payment_processor_id UUID REFERENCES payment_processors(id) ON DELETE SET NULL,
  pos_register_id UUID REFERENCES pos_registers(id) ON DELETE SET NULL,
  pos_transaction_id UUID REFERENCES pos_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Staff member who processed

  -- Transaction Details
  processor_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'return', 'void', 'auth', 'capture', 'refund')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit', 'debit', 'ebt_food', 'ebt_cash', 'gift', 'cash', 'check')),

  -- Amounts
  amount DECIMAL(10, 2) NOT NULL,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount + COALESCE(tip_amount, 0)) STORED,

  -- Transaction Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'error', 'voided', 'refunded')),

  -- Processor Response
  processor_transaction_id TEXT, -- Transaction ID from processor
  processor_reference_id TEXT, -- Reference ID sent to processor
  authorization_code TEXT, -- Auth code from processor
  result_code TEXT, -- Result code from processor
  status_code TEXT, -- Status code from processor
  message TEXT, -- Message from processor
  detailed_message TEXT, -- Detailed message from processor

  -- Request/Response Data (for debugging and auditing)
  request_data JSONB, -- Full request sent to processor
  response_data JSONB, -- Full response from processor

  -- Card Details (tokenized/masked - NEVER store raw card data)
  card_type TEXT, -- Visa, Mastercard, Amex, Discover
  card_last_four TEXT,
  card_bin TEXT, -- First 6 digits
  cardholder_name TEXT,

  -- Receipt
  receipt_data JSONB, -- Receipt details for reprinting
  receipt_number TEXT,

  -- Metadata
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_vendor ON payment_transactions(vendor_id);
CREATE INDEX idx_payment_transactions_location ON payment_transactions(location_id);
CREATE INDEX idx_payment_transactions_processor ON payment_transactions(payment_processor_id);
CREATE INDEX idx_payment_transactions_register ON payment_transactions(pos_register_id);
CREATE INDEX idx_payment_transactions_pos_txn ON payment_transactions(pos_transaction_id);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(processed_at);
CREATE INDEX idx_payment_transactions_processor_ref ON payment_transactions(processor_transaction_id);

COMMENT ON TABLE payment_transactions IS 'Logs all payment processor transactions for auditing and reconciliation';
COMMENT ON COLUMN payment_transactions.request_data IS 'Full request payload sent to payment processor (for debugging)';
COMMENT ON COLUMN payment_transactions.response_data IS 'Full response from payment processor (for auditing)';

-- ============================================================
-- 5. PAYMENT METHODS TABLE
-- Defines supported payment methods per location
-- ============================================================

CREATE TABLE IF NOT EXISTS location_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Payment Method Configuration
  method_type TEXT NOT NULL CHECK (method_type IN ('cash', 'credit', 'debit', 'ebt_food', 'ebt_cash', 'gift_card', 'check', 'ach', 'mobile_wallet')),
  method_name TEXT NOT NULL, -- User-friendly name (e.g., "Credit Card", "EBT SNAP")
  is_enabled BOOLEAN DEFAULT true,

  -- Processing
  requires_processor BOOLEAN DEFAULT false, -- Does this method need a payment processor?
  default_processor_id UUID REFERENCES payment_processors(id) ON DELETE SET NULL,

  -- Limits and Fees
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  processing_fee_percent DECIMAL(5, 2), -- Fee percentage (e.g., 2.9)
  processing_fee_fixed DECIMAL(10, 2), -- Fixed fee (e.g., 0.30)

  -- Settings
  allow_tips BOOLEAN DEFAULT true,
  allow_partial_payments BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT false,
  requires_manager_approval BOOLEAN DEFAULT false,

  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_method_per_location UNIQUE (location_id, method_type)
);

CREATE INDEX idx_location_payment_methods_location ON location_payment_methods(location_id);
CREATE INDEX idx_location_payment_methods_enabled ON location_payment_methods(is_enabled) WHERE is_enabled = true;

COMMENT ON TABLE location_payment_methods IS 'Defines which payment methods are enabled per location';

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Function to get default payment processor for a location
CREATE OR REPLACE FUNCTION get_default_payment_processor(p_location_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM payment_processors
    WHERE location_id = p_location_id
      AND is_active = true
      AND is_default = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get active payment processor for a register
CREATE OR REPLACE FUNCTION get_register_payment_processor(p_register_id UUID)
RETURNS UUID AS $$
DECLARE
  v_processor_id UUID;
  v_location_id UUID;
BEGIN
  -- Try to get processor from register first
  SELECT payment_processor_id, location_id
  INTO v_processor_id, v_location_id
  FROM pos_registers
  WHERE id = p_register_id;

  IF v_processor_id IS NOT NULL THEN
    RETURN v_processor_id;
  END IF;

  -- Fall back to location's default processor
  RETURN get_default_payment_processor(v_location_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. UPDATE TRIGGERS
-- ============================================================

-- Update timestamp trigger for payment_processors
CREATE OR REPLACE FUNCTION update_payment_processor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_processors_update_timestamp
  BEFORE UPDATE ON payment_processors
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_processor_timestamp();

-- Update timestamp trigger for dejavoo_terminal_configs
CREATE TRIGGER dejavoo_terminal_configs_update_timestamp
  BEFORE UPDATE ON dejavoo_terminal_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_processor_timestamp();

-- Update timestamp trigger for payment_transactions
CREATE TRIGGER payment_transactions_update_timestamp
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_processor_timestamp();

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dejavoo_terminal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment Processors Policies
CREATE POLICY "Vendors can view their own payment processors"
  ON payment_processors FOR SELECT
  USING (vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Vendors can manage their own payment processors"
  ON payment_processors FOR ALL
  USING (vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all payment processors"
  ON payment_processors FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Dejavoo Terminal Configs Policies
CREATE POLICY "Vendors can view their terminal configs"
  ON dejavoo_terminal_configs FOR SELECT
  USING (location_id IN (SELECT id FROM locations WHERE vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Vendors can manage their terminal configs"
  ON dejavoo_terminal_configs FOR ALL
  USING (location_id IN (SELECT id FROM locations WHERE vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid())));

-- Payment Transactions Policies
CREATE POLICY "Vendors can view their payment transactions"
  ON payment_transactions FOR SELECT
  USING (vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Location Payment Methods Policies
CREATE POLICY "Vendors can view their location payment methods"
  ON location_payment_methods FOR SELECT
  USING (location_id IN (SELECT id FROM locations WHERE vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Vendors can manage their location payment methods"
  ON location_payment_methods FOR ALL
  USING (location_id IN (SELECT id FROM locations WHERE vendor_id = (SELECT vendor_id FROM users WHERE id = auth.uid())));

-- ============================================================
-- 9. VIEWS FOR REPORTING
-- ============================================================

-- View: Terminal Overview with Processor Information
CREATE OR REPLACE VIEW terminal_overview AS
SELECT
  r.id as register_id,
  r.register_number,
  r.register_name,
  r.device_name,
  r.hardware_model,
  r.status as register_status,
  l.id as location_id,
  l.name as location_name,
  v.id as vendor_id,
  v.store_name as vendor_name,
  p.id as processor_id,
  p.processor_type,
  p.processor_name,
  p.is_active as processor_active,
  d.v_number,
  d.merchant_id,
  d.store_number,
  d.hc_pos_id,
  r.last_active_at
FROM pos_registers r
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN vendors v ON l.vendor_id = v.id
LEFT JOIN payment_processors p ON r.payment_processor_id = p.id
LEFT JOIN dejavoo_terminal_configs d ON r.dejavoo_config_id = d.id;

COMMENT ON VIEW terminal_overview IS 'Complete terminal information with processor and location details';

-- View: Payment Transactions with Full Details
CREATE OR REPLACE VIEW payment_transactions_detail AS
SELECT
  pt.id,
  pt.processor_type,
  pt.transaction_type,
  pt.payment_method,
  pt.amount,
  pt.tip_amount,
  pt.total_amount,
  pt.status,
  pt.authorization_code,
  pt.card_type,
  pt.card_last_four,
  pt.processed_at,
  v.store_name as vendor_name,
  l.name as location_name,
  r.register_name,
  u.first_name || ' ' || u.last_name as staff_name,
  o.order_number
FROM payment_transactions pt
LEFT JOIN vendors v ON pt.vendor_id = v.id
LEFT JOIN locations l ON pt.location_id = l.id
LEFT JOIN pos_registers r ON pt.pos_register_id = r.id
LEFT JOIN users u ON pt.user_id = u.id
LEFT JOIN orders o ON pt.order_id = o.id;

COMMENT ON VIEW payment_transactions_detail IS 'Payment transactions with human-readable details for reporting';

-- ============================================================
-- COMPLETE
-- ============================================================
