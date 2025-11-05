-- =====================================================
-- Apple Wallet Passes Migration
-- Creates native Apple Wallet pass system
-- Replaces Alpine IQ wallet dependency
-- =====================================================

-- Table: wallet_passes
-- Tracks all generated wallet passes for customers
CREATE TABLE IF NOT EXISTS wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer & Vendor
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Pass Identification
  serial_number TEXT NOT NULL UNIQUE, -- Apple's pass serial number
  authentication_token TEXT NOT NULL UNIQUE, -- Token for pass updates
  pass_type_identifier TEXT NOT NULL, -- e.g., "pass.com.whaletools.wallet"

  -- Pass Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  added_to_wallet_at TIMESTAMPTZ, -- When customer first added pass
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pass Data (what's shown on the pass)
  pass_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "points": 420,
  --   "tier": "Gold",
  --   "member_name": "John Doe",
  --   "member_since": "2024-01-15",
  --   "barcode_message": "CUSTOMER-12345"
  -- }

  -- Vendor Branding Override (optional, uses vendor table by default)
  custom_branding JSONB,
  -- Example: { "logo_url": "...", "colors": {...} }

  -- Device Tracking
  devices JSONB DEFAULT '[]'::jsonb,
  -- Tracks devices that have this pass installed
  -- [{ "device_id": "...", "push_token": "...", "registered_at": "..." }]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wallet_passes_customer ON wallet_passes(customer_id);
CREATE INDEX idx_wallet_passes_vendor ON wallet_passes(vendor_id);
CREATE INDEX idx_wallet_passes_serial ON wallet_passes(serial_number);
CREATE INDEX idx_wallet_passes_auth_token ON wallet_passes(authentication_token);
CREATE INDEX idx_wallet_passes_status ON wallet_passes(status);

-- =====================================================
-- Table: wallet_pass_events
-- Logs all events related to wallet passes
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_pass_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  pass_id UUID NOT NULL REFERENCES wallet_passes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'generated',      -- Pass was generated
    'added',          -- Pass added to wallet
    'updated',        -- Pass data updated
    'removed',        -- Pass removed from wallet
    'device_registered', -- Device registered for updates
    'device_unregistered', -- Device unregistered
    'viewed',         -- Pass viewed/opened
    'scanned'         -- Barcode scanned
  )),

  -- Event Context
  device_id TEXT,
  push_token TEXT,
  user_agent TEXT,
  ip_address INET,

  -- Additional Data
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wallet_pass_events_pass ON wallet_pass_events(pass_id);
CREATE INDEX idx_wallet_pass_events_customer ON wallet_pass_events(customer_id);
CREATE INDEX idx_wallet_pass_events_type ON wallet_pass_events(event_type);
CREATE INDEX idx_wallet_pass_events_created ON wallet_pass_events(created_at DESC);

-- =====================================================
-- Table: vendor_wallet_settings
-- Vendor-specific Apple Wallet configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_wallet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,

  -- Apple Wallet Configuration
  pass_type_identifier TEXT NOT NULL DEFAULT 'pass.com.whaletools.wallet',
  team_identifier TEXT NOT NULL DEFAULT 'Y9Q7L7SGR3',
  organization_name TEXT NOT NULL,

  -- Pass Customization
  logo_text TEXT, -- Text shown next to logo
  description TEXT, -- Pass description

  -- Colors (override vendor.brand_colors if needed)
  foreground_color TEXT DEFAULT 'rgb(255,255,255)',
  background_color TEXT DEFAULT 'rgb(0,0,0)',
  label_color TEXT, -- Optional

  -- Pass Fields Configuration
  fields_config JSONB DEFAULT '{
    "primaryFields": [
      {"key": "points", "label": "Points", "show": true}
    ],
    "secondaryFields": [
      {"key": "tier", "label": "Tier", "show": true},
      {"key": "member_since", "label": "Member Since", "show": true}
    ],
    "auxiliaryFields": [],
    "backFields": [
      {"key": "terms", "label": "Terms & Conditions", "show": true}
    ]
  }'::jsonb,

  -- Features
  enable_push_updates BOOLEAN DEFAULT true,
  enable_location_updates BOOLEAN DEFAULT false,

  -- Store Locations (for location-based notifications)
  locations JSONB DEFAULT '[]'::jsonb,
  -- [{ "latitude": 35.2271, "longitude": -80.8431, "relevantText": "You're near our store!" }]

  -- Metadata
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_vendor_wallet_settings_vendor ON vendor_wallet_settings(vendor_id);

-- =====================================================
-- Table: wallet_pass_updates_queue
-- Queue for batch updating passes
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_pass_updates_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pass_id UUID NOT NULL REFERENCES wallet_passes(id) ON DELETE CASCADE,

  -- Update Details
  update_type TEXT NOT NULL CHECK (update_type IN ('points_changed', 'tier_changed', 'profile_updated', 'manual')),
  old_data JSONB,
  new_data JSONB,

  -- Processing Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message TEXT,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Push Notification
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_wallet_pass_updates_status ON wallet_pass_updates_queue(status);
CREATE INDEX idx_wallet_pass_updates_pass ON wallet_pass_updates_queue(pass_id);
CREATE INDEX idx_wallet_pass_updates_created ON wallet_pass_updates_queue(created_at DESC);

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- Function: Update wallet pass when customer loyalty changes
CREATE OR REPLACE FUNCTION trigger_wallet_pass_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if loyalty points or tier changed
  IF (NEW.loyalty_points != OLD.loyalty_points) OR (NEW.loyalty_tier != OLD.loyalty_tier) THEN
    -- Queue an update for all active passes for this customer
    INSERT INTO wallet_pass_updates_queue (pass_id, update_type, old_data, new_data)
    SELECT
      id,
      CASE
        WHEN NEW.loyalty_tier != OLD.loyalty_tier THEN 'tier_changed'
        ELSE 'points_changed'
      END,
      jsonb_build_object('points', OLD.loyalty_points, 'tier', OLD.loyalty_tier),
      jsonb_build_object('points', NEW.loyalty_points, 'tier', NEW.loyalty_tier)
    FROM wallet_passes
    WHERE customer_id = NEW.id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update passes when customer loyalty changes
DROP TRIGGER IF EXISTS trg_customer_loyalty_wallet_update ON customers;
CREATE TRIGGER trg_customer_loyalty_wallet_update
AFTER UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION trigger_wallet_pass_update();

-- Function: Update timestamps
CREATE OR REPLACE FUNCTION update_wallet_pass_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS trg_wallet_passes_updated ON wallet_passes;
CREATE TRIGGER trg_wallet_passes_updated
BEFORE UPDATE ON wallet_passes
FOR EACH ROW
EXECUTE FUNCTION update_wallet_pass_timestamp();

DROP TRIGGER IF EXISTS trg_vendor_wallet_settings_updated ON vendor_wallet_settings;
CREATE TRIGGER trg_vendor_wallet_settings_updated
BEFORE UPDATE ON vendor_wallet_settings
FOR EACH ROW
EXECUTE FUNCTION update_wallet_pass_timestamp();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE wallet_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pass_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_wallet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pass_updates_queue ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_passes
CREATE POLICY "Customers can view own passes" ON wallet_passes
  FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM customers WHERE id = customer_id));

CREATE POLICY "Service role has full access to passes" ON wallet_passes
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for wallet_pass_events
CREATE POLICY "Service role has full access to events" ON wallet_pass_events
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for vendor_wallet_settings
CREATE POLICY "Service role has full access to vendor wallet settings" ON vendor_wallet_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for updates queue
CREATE POLICY "Service role has full access to updates queue" ON wallet_pass_updates_queue
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE wallet_passes IS 'Stores all Apple Wallet passes generated for customers';
COMMENT ON TABLE wallet_pass_events IS 'Logs all events related to wallet passes (adds, updates, scans)';
COMMENT ON TABLE vendor_wallet_settings IS 'Vendor-specific Apple Wallet pass configuration';
COMMENT ON TABLE wallet_pass_updates_queue IS 'Queue for batch processing wallet pass updates and push notifications';

COMMENT ON COLUMN wallet_passes.serial_number IS 'Unique Apple Wallet pass serial number';
COMMENT ON COLUMN wallet_passes.authentication_token IS 'Token used by Apple to authenticate pass update requests';
COMMENT ON COLUMN wallet_passes.pass_data IS 'Current data displayed on the pass (points, tier, etc.)';
COMMENT ON COLUMN wallet_passes.devices IS 'Array of device IDs and push tokens that have this pass installed';

-- =====================================================
-- Sample Vendor Wallet Settings Insert
-- =====================================================

-- This will be populated via API when vendors first enable wallet passes
-- Example for reference:
/*
INSERT INTO vendor_wallet_settings (vendor_id, organization_name, logo_text, description)
SELECT
  id,
  store_name,
  store_name || ' Rewards',
  'Your loyalty card for ' || store_name
FROM vendors
WHERE slug = 'flora-distro'
ON CONFLICT (vendor_id) DO NOTHING;
*/
