-- =====================================================
-- WhaleTools Role-Based Access Control (RBAC) System
-- =====================================================
-- This migration creates a unified authentication system
-- for both vendor admins and employees with granular
-- app-level permissions and location-based access.

-- 1. Add role field to users table
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee'
CHECK (role IN ('vendor_admin', 'manager', 'employee'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_vendor_role ON users(vendor_id, role);

-- Update existing vendor users to have vendor_admin role
-- (This assumes current users in the users table are employees)
-- Vendors will need to be migrated separately

-- 2. Vendor Apps/Modules Definition
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- lucide-react icon name
  route VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'operations', 'sales', 'marketing', 'management'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default apps
INSERT INTO vendor_apps (app_key, display_name, description, icon, route, category, sort_order) VALUES
  ('pos', 'Point of Sale', 'Process sales, manage transactions, and handle customer orders', 'ShoppingCart', '/pos/register', 'operations', 1),
  ('orders', 'Order Queue', 'Manage pickup and shipping orders, fulfill customer requests', 'Package', '/pos/orders', 'operations', 2),
  ('tv_menus', 'Digital Menus', 'Create and manage TV menu displays for your locations', 'Monitor', '/vendor/tv-menus', 'marketing', 3),
  ('inventory', 'Inventory', 'Track stock levels, manage products, and view inventory reports', 'PackageSearch', '/vendor/inventory', 'operations', 4),
  ('products', 'Products', 'Manage your product catalog, pricing, and product information', 'Tag', '/vendor/products', 'management', 5),
  ('analytics', 'Analytics', 'View sales reports, performance metrics, and business insights', 'BarChart3', '/vendor/dashboard', 'management', 6),
  ('customers', 'Customers', 'Manage customer relationships and view customer data', 'Users', '/vendor/customers', 'sales', 7),
  ('marketing', 'Marketing', 'Create campaigns, promotions, and marketing materials', 'Megaphone', '/vendor/marketing', 'marketing', 8)
ON CONFLICT (app_key) DO NOTHING;

-- 3. User App Permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS user_app_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_key VARCHAR(50) NOT NULL REFERENCES vendor_apps(app_key) ON DELETE CASCADE,
  can_access BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES users(id), -- Who granted this permission
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, app_key)
);

CREATE INDEX IF NOT EXISTS idx_user_app_permissions_user ON user_app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_app ON user_app_permissions(app_key);

-- 4. Employee Location Assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Primary location for the employee
  can_access BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES users(id), -- Who assigned this location
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_locations_user ON employee_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_location ON employee_locations(location_id);

-- 5. Enhanced User Profiles
-- =====================================================
-- Add additional fields to users table for better employee management
ALTER TABLE users
ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6); -- For quick POS login

-- 6. Activity Logging
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'app_access', 'permission_change'
  app_key VARCHAR(50) REFERENCES vendor_apps(app_key),
  location_id UUID REFERENCES locations(id),
  metadata JSONB, -- Additional context
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_vendor ON user_activity_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);

-- 7. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE vendor_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Vendor Apps: Public read (all authenticated users can see available apps)
CREATE POLICY "Anyone can view active apps" ON vendor_apps
  FOR SELECT USING (is_active = true);

-- User App Permissions: Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_app_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Vendor admins can manage permissions for their vendor's employees
CREATE POLICY "Vendor admins manage employee permissions" ON user_app_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendor_admin'
      AND users.vendor_id = (SELECT vendor_id FROM users WHERE id = user_app_permissions.user_id)
    )
  );

-- Employee Locations: Users can view their own location assignments
CREATE POLICY "Users can view own locations" ON employee_locations
  FOR SELECT USING (auth.uid() = user_id);

-- Vendor admins can manage location assignments
CREATE POLICY "Vendor admins manage location assignments" ON employee_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendor_admin'
      AND users.vendor_id = (SELECT vendor_id FROM users WHERE id = employee_locations.user_id)
    )
  );

-- Activity Log: Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Vendor admins can view all activity for their vendor
CREATE POLICY "Vendor admins view vendor activity" ON user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'vendor_admin'
      AND users.vendor_id = user_activity_log.vendor_id
    )
  );

-- 8. Helper Functions
-- =====================================================

-- Function to check if user has access to an app
CREATE OR REPLACE FUNCTION user_has_app_access(p_user_id UUID, p_app_key VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vendor admins have access to everything
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'vendor_admin') THEN
    RETURN true;
  END IF;

  -- Check explicit permission
  RETURN EXISTS (
    SELECT 1 FROM user_app_permissions
    WHERE user_id = p_user_id
    AND app_key = p_app_key
    AND can_access = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible locations
CREATE OR REPLACE FUNCTION get_user_locations(p_user_id UUID)
RETURNS TABLE (
  location_id UUID,
  location_name VARCHAR,
  is_primary BOOLEAN
) AS $$
BEGIN
  -- Vendor admins can access all their vendor's locations
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'vendor_admin') THEN
    RETURN QUERY
    SELECT l.id, l.name, false
    FROM locations l
    JOIN users u ON u.vendor_id = l.vendor_id
    WHERE u.id = p_user_id;
  ELSE
    -- Employees can only access assigned locations
    RETURN QUERY
    SELECT l.id, l.name, el.is_primary
    FROM employee_locations el
    JOIN locations l ON l.id = el.location_id
    WHERE el.user_id = p_user_id AND el.can_access = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR,
  p_app_key VARCHAR DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_vendor_id UUID;
  v_log_id UUID;
BEGIN
  -- Get vendor_id from user
  SELECT vendor_id INTO v_vendor_id FROM users WHERE id = p_user_id;

  -- Insert activity log
  INSERT INTO user_activity_log (
    user_id,
    vendor_id,
    activity_type,
    app_key,
    location_id,
    metadata
  ) VALUES (
    p_user_id,
    v_vendor_id,
    p_activity_type,
    p_app_key,
    p_location_id,
    p_metadata
  ) RETURNING id INTO v_log_id;

  -- Update last_login_at if it's a login event
  IF p_activity_type = 'login' THEN
    UPDATE users SET last_login_at = NOW() WHERE id = p_user_id;
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Sample Data for Testing
-- =====================================================
-- This creates a sample vendor admin and employee for testing
-- REMOVE IN PRODUCTION

-- Note: You'll need to manually create vendor admin users
-- and assign them the 'vendor_admin' role

COMMENT ON TABLE vendor_apps IS 'Available applications/modules in WhaleTools platform';
COMMENT ON TABLE user_app_permissions IS 'Maps users to apps they can access';
COMMENT ON TABLE employee_locations IS 'Maps employees to locations they can work at';
COMMENT ON TABLE user_activity_log IS 'Audit log of user activities across the platform';
COMMENT ON FUNCTION user_has_app_access IS 'Check if a user has permission to access a specific app';
COMMENT ON FUNCTION get_user_locations IS 'Get all locations a user can access';
COMMENT ON FUNCTION log_user_activity IS 'Log user activity for audit trail';
