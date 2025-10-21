-- ============================================================================
-- USERS/EMPLOYEES & ROLE-BASED ACCESS CONTROL (RBAC)
-- Enables vendors and admins to create employee accounts with location-specific access
-- ============================================================================

-- ============================================================================
-- USER ROLES ENUM
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin',              -- Full system access (Yacht Club admin)
    'vendor_owner',       -- Vendor account owner (full vendor access)
    'vendor_manager',     -- Manager level (manage locations, staff, inventory)
    'location_manager',   -- Single location manager
    'pos_staff',          -- POS operations only
    'inventory_staff',    -- Inventory management only
    'readonly'            -- View-only access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USERS TABLE (Employees)
-- Extends Supabase Auth with business logic
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Info
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Role & Access
  role user_role NOT NULL DEFAULT 'pos_staff',
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Employment
  employee_id TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  
  -- Login
  last_login TIMESTAMPTZ,
  login_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS users_vendor_id_idx ON public.users(vendor_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

COMMENT ON TABLE public.users IS 'Employee accounts with role-based access';
COMMENT ON COLUMN public.users.role IS 'User role determining permissions';
COMMENT ON COLUMN public.users.vendor_id IS 'NULL for admin users, set for vendor employees';

-- ============================================================================
-- USER LOCATION ASSIGNMENTS
-- Assigns users to specific locations they can access
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  
  -- Access Level
  is_primary_location BOOLEAN DEFAULT false,
  can_manage BOOLEAN DEFAULT false, -- Can manage this location's settings
  can_sell BOOLEAN DEFAULT true,    -- Can process sales/POS
  can_manage_inventory BOOLEAN DEFAULT false, -- Can adjust inventory
  can_transfer BOOLEAN DEFAULT false, -- Can initiate transfers
  
  -- Schedule (optional)
  schedule JSONB DEFAULT '{}', -- {"monday": {"start": "09:00", "end": "17:00"}}
  
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  
  UNIQUE(user_id, location_id)
);

CREATE INDEX IF NOT EXISTS user_locations_user_id_idx ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS user_locations_location_id_idx ON public.user_locations(location_id);

COMMENT ON TABLE public.user_locations IS 'Assigns users to specific locations with granular permissions';

-- ============================================================================
-- PERMISSIONS TABLE
-- Define what each role can do
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role, permission)
);

CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON public.role_permissions(role);

-- Seed permissions
INSERT INTO public.role_permissions (role, permission, description) VALUES
-- Admin permissions (full access)
('admin', 'manage_vendors', 'Create, edit, delete vendors'),
('admin', 'manage_users', 'Create, edit, delete all users'),
('admin', 'manage_locations', 'Create, edit, delete all locations'),
('admin', 'manage_products', 'Approve/reject vendor products'),
('admin', 'view_all_data', 'View all data across all vendors'),
('admin', 'manage_system', 'System settings and configuration'),

-- Vendor Owner permissions
('vendor_owner', 'manage_own_vendor', 'Edit own vendor profile'),
('vendor_owner', 'manage_locations', 'Create/edit own locations'),
('vendor_owner', 'manage_employees', 'Create/edit employees'),
('vendor_owner', 'manage_products', 'Create/edit products'),
('vendor_owner', 'manage_inventory', 'View/edit all inventory'),
('vendor_owner', 'view_reports', 'View sales and analytics'),
('vendor_owner', 'manage_orders', 'View/manage orders'),

-- Vendor Manager permissions
('vendor_manager', 'manage_locations', 'Manage assigned locations'),
('vendor_manager', 'manage_employees', 'Manage location staff'),
('vendor_manager', 'manage_products', 'Edit products'),
('vendor_manager', 'manage_inventory', 'Manage inventory'),
('vendor_manager', 'view_reports', 'View location reports'),
('vendor_manager', 'process_sales', 'Process POS sales'),

-- Location Manager permissions
('location_manager', 'manage_location', 'Manage assigned location'),
('location_manager', 'manage_staff', 'Manage location staff schedules'),
('location_manager', 'manage_inventory', 'Manage location inventory'),
('location_manager', 'view_reports', 'View location reports'),
('location_manager', 'process_sales', 'Process POS sales'),

-- POS Staff permissions
('pos_staff', 'process_sales', 'Process POS sales'),
('pos_staff', 'view_inventory', 'View inventory levels'),
('pos_staff', 'process_returns', 'Process returns'),

-- Inventory Staff permissions
('inventory_staff', 'manage_inventory', 'Adjust inventory'),
('inventory_staff', 'receive_stock', 'Receive shipments'),
('inventory_staff', 'transfer_stock', 'Transfer between locations'),
('inventory_staff', 'view_inventory', 'View inventory'),

-- Readonly permissions
('readonly', 'view_data', 'View assigned data only')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================================================
-- USER SESSIONS TABLE
-- Track active sessions for security
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  
  -- Session Info
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS user_sessions_expires_idx ON public.user_sessions(expires_at);

-- ============================================================================
-- AUDIT LOG
-- Track important actions for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  vendor_id UUID REFERENCES public.vendors(id),
  location_id UUID REFERENCES public.locations(id),
  
  -- Action
  action TEXT NOT NULL,
  entity_type TEXT, -- 'user', 'product', 'inventory', etc.
  entity_id TEXT,
  
  -- Details
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_vendor_id_idx ON public.audit_log(vendor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid()::text = auth_user_id::text);

CREATE POLICY "Vendor owners can view their employees"
  ON public.users FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors 
      WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Service role full access"
  ON public.users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- User locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own location assignments"
  ON public.user_locations FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth.uid()::text = auth_user_id::text
    )
  );

CREATE POLICY "Service role full access to user locations"
  ON public.user_locations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Role permissions (public read)
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

-- Audit log (restricted)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.audit_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
  
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND permission = p_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's accessible locations
CREATE OR REPLACE FUNCTION public.get_user_locations(p_user_id UUID)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  can_manage BOOLEAN,
  can_sell BOOLEAN,
  can_manage_inventory BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    ul.can_manage,
    ul.can_sell,
    ul.can_manage_inventory
  FROM public.user_locations ul
  JOIN public.locations l ON l.id = ul.location_id
  WHERE ul.user_id = p_user_id
  AND l.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log audit action
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_vendor_id UUID;
  v_ip TEXT;
BEGIN
  -- Get vendor_id from user
  SELECT vendor_id INTO v_vendor_id FROM public.users WHERE id = p_user_id;
  
  -- Get IP from current request (if available)
  v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  
  INSERT INTO public.audit_log (
    user_id,
    vendor_id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address
  ) VALUES (
    p_user_id,
    v_vendor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    v_ip
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on users
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.users TO authenticated, service_role;
GRANT ALL ON public.user_locations TO authenticated, service_role;
GRANT SELECT ON public.role_permissions TO authenticated, service_role;
GRANT ALL ON public.user_sessions TO authenticated, service_role;
GRANT ALL ON public.audit_log TO authenticated, service_role;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active employees by vendor
CREATE OR REPLACE VIEW public.active_employees AS
SELECT 
  u.*,
  v.store_name as vendor_name,
  COUNT(ul.location_id) as assigned_locations
FROM public.users u
LEFT JOIN public.vendors v ON u.vendor_id = v.id
LEFT JOIN public.user_locations ul ON ul.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id, v.store_name;

COMMENT ON VIEW public.active_employees IS 'All active employees with location counts';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Create sample admin user (commented out - create via API)
-- INSERT INTO public.users (
--   email,
--   first_name,
--   last_name,
--   role,
--   status
-- ) VALUES (
--   'admin@floradistro.com',
--   'Admin',
--   'User',
--   'admin',
--   'active'
-- );

