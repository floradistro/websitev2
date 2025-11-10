-- Performance indexes for authentication queries
-- These indexes optimize the auth middleware lookups

-- Index for user lookups by ID (primary auth check)
CREATE INDEX IF NOT EXISTS idx_users_id_active 
ON users(id) 
WHERE deleted_at IS NULL;

-- Index for vendor lookups by user ID
CREATE INDEX IF NOT EXISTS idx_users_vendor_id 
ON users(vendor_id) 
WHERE vendor_id IS NOT NULL AND deleted_at IS NULL;

-- Index for role-based access control
CREATE INDEX IF NOT EXISTS idx_users_role_vendor 
ON users(role, vendor_id) 
WHERE deleted_at IS NULL;

-- Index for session lookups (if using sessions table)
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id 
ON auth.sessions(user_id);

-- Index for refresh token lookups
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_token 
ON auth.refresh_tokens(token);

-- Composite index for vendor + role queries
CREATE INDEX IF NOT EXISTS idx_users_vendor_role_active 
ON users(vendor_id, role) 
WHERE deleted_at IS NULL AND vendor_id IS NOT NULL;

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email)) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_users_id_active IS 'Optimizes requireAuth() middleware lookups';
COMMENT ON INDEX idx_users_vendor_id IS 'Optimizes requireVendor() middleware lookups';
COMMENT ON INDEX idx_users_role_vendor IS 'Optimizes requireAdmin() middleware lookups';
COMMENT ON INDEX idx_auth_sessions_user_id IS 'Optimizes session validation queries';
COMMENT ON INDEX idx_users_vendor_role_active IS 'Optimizes vendor + role combination queries';
COMMENT ON INDEX idx_users_email_lower IS 'Optimizes case-insensitive email login queries';
