-- ============================================================================
-- POS REGISTER MANAGEMENT
-- Adds register/device tracking for multiple tablets per location
-- ============================================================================

-- ============================================================================
-- 1. CREATE pos_registers TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pos_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Register info
  register_number TEXT UNIQUE NOT NULL,  -- "REG-CHA-001", "REG-CHA-002"
  register_name TEXT NOT NULL,           -- "Front Counter", "Back Office", "Mobile 1"
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Device identification
  device_id TEXT,                        -- Unique device identifier (tablet serial, browser fingerprint)
  device_name TEXT,                      -- iPad Pro #1, iPad Air #2
  device_type TEXT,                      -- 'ipad', 'android_tablet', 'desktop', 'mobile'
  last_ip_address TEXT,
  
  -- Current state
  current_session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
  last_active_at TIMESTAMPTZ,
  
  -- Settings
  default_printer_id TEXT,
  allow_cash BOOLEAN DEFAULT true,
  allow_card BOOLEAN DEFAULT true,
  allow_refunds BOOLEAN DEFAULT false,
  allow_voids BOOLEAN DEFAULT false,
  require_manager_approval BOOLEAN DEFAULT false,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pos_registers_location_idx ON public.pos_registers(location_id);
CREATE INDEX IF NOT EXISTS pos_registers_vendor_idx ON public.pos_registers(vendor_id);
CREATE INDEX IF NOT EXISTS pos_registers_status_idx ON public.pos_registers(status);
CREATE INDEX IF NOT EXISTS pos_registers_device_id_idx ON public.pos_registers(device_id);

COMMENT ON TABLE public.pos_registers IS 'Physical POS registers/devices - each tablet/terminal is a register';
COMMENT ON COLUMN public.pos_registers.register_number IS 'Unique register identifier like REG-CHA-001';
COMMENT ON COLUMN public.pos_registers.device_id IS 'Device fingerprint or serial number for tablet identification';


-- ============================================================================
-- 2. ADD register_id TO pos_sessions
-- ============================================================================
ALTER TABLE public.pos_sessions 
  ADD COLUMN IF NOT EXISTS register_id UUID REFERENCES public.pos_registers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pos_sessions_register_idx ON public.pos_sessions(register_id);

COMMENT ON COLUMN public.pos_sessions.register_id IS 'Links session to specific register/device';


-- ============================================================================
-- 3. ADD register_id TO pos_transactions
-- ============================================================================
ALTER TABLE public.pos_transactions 
  ADD COLUMN IF NOT EXISTS register_id UUID REFERENCES public.pos_registers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pos_transactions_register_idx ON public.pos_transactions(register_id);

COMMENT ON COLUMN public.pos_transactions.register_id IS 'Which register processed this transaction';


-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Generate unique register number
CREATE OR REPLACE FUNCTION public.generate_register_number(p_location_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_location_code TEXT;
  v_sequence INTEGER;
  v_register_number TEXT;
BEGIN
  -- Get location code from slug
  SELECT UPPER(LEFT(slug, 3)) INTO v_location_code
  FROM public.locations
  WHERE id = p_location_id;
  
  -- Get next sequence number for this location
  SELECT COALESCE(MAX(CAST(SUBSTRING(register_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.pos_registers
  WHERE location_id = p_location_id;
  
  -- Format: REG-CHA-001
  v_register_number := 'REG-' || v_location_code || '-' || LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_register_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_register_number IS 'Generates unique register number like REG-CHA-001';


-- Get active register by device ID
CREATE OR REPLACE FUNCTION public.get_register_by_device(p_device_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_register_id UUID;
BEGIN
  SELECT id INTO v_register_id
  FROM public.pos_registers
  WHERE device_id = p_device_id
    AND status = 'active'
  LIMIT 1;
  
  RETURN v_register_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_register_by_device IS 'Returns register ID for a device';


-- Update register last active timestamp
CREATE OR REPLACE FUNCTION public.update_register_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_active_at for the register
  IF NEW.register_id IS NOT NULL THEN
    UPDATE public.pos_registers
    SET 
      last_active_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.register_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track register activity
DROP TRIGGER IF EXISTS update_register_activity_trigger ON public.pos_transactions;
CREATE TRIGGER update_register_activity_trigger
  AFTER INSERT ON public.pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_register_activity();


-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- POS Registers - location staff can view their location's registers
ALTER TABLE public.pos_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Location staff can view registers" ON public.pos_registers;
CREATE POLICY "Location staff can view registers"
  ON public.pos_registers FOR SELECT
  USING (
    location_id IN (
      SELECT location_id FROM public.user_locations 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access to registers" ON public.pos_registers;
CREATE POLICY "Service role full access to registers"
  ON public.pos_registers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT ALL ON public.pos_registers TO authenticated, service_role;


-- ============================================================================
-- 7. UPDATE TRIGGERS
-- ============================================================================

-- Apply updated_at trigger to pos_registers
DROP TRIGGER IF EXISTS set_pos_registers_updated_at ON public.pos_registers;
CREATE TRIGGER set_pos_registers_updated_at 
  BEFORE UPDATE ON public.pos_registers
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 8. SEED DEFAULT REGISTERS
-- ============================================================================

-- Create default registers for Flora Distro locations
INSERT INTO public.pos_registers (
  location_id,
  vendor_id,
  register_number,
  register_name,
  device_name,
  status
)
SELECT 
  l.id,
  l.vendor_id,
  'REG-' || UPPER(LEFT(l.slug, 3)) || '-001',
  'Main Register',
  'iPad #1',
  'active'
FROM public.locations l
WHERE l.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND l.pos_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM public.pos_registers r 
    WHERE r.location_id = l.id
  )
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 9. VIEWS FOR REPORTING
-- ============================================================================

-- Active registers summary
CREATE OR REPLACE VIEW public.active_pos_registers AS
SELECT 
  r.*,
  l.name as location_name,
  l.slug as location_slug,
  v.store_name as vendor_name,
  s.session_number as current_session,
  s.total_sales as session_sales,
  s.opened_at as session_opened_at,
  EXTRACT(EPOCH FROM (NOW() - r.last_active_at)) / 60 as minutes_since_active
FROM public.pos_registers r
JOIN public.locations l ON l.id = r.location_id
JOIN public.vendors v ON v.id = r.vendor_id
LEFT JOIN public.pos_sessions s ON s.id = r.current_session_id
WHERE r.status = 'active'
ORDER BY l.name, r.register_number;

COMMENT ON VIEW public.active_pos_registers IS 'All active POS registers with location and session info';


-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Created pos_registers table
-- ✅ Added register_id to pos_sessions and pos_transactions
-- ✅ Helper functions for register management
-- ✅ RLS policies for location-based access
-- ✅ Activity tracking triggers
-- ✅ Seeded default registers for Flora Distro
-- ✅ Reporting view


