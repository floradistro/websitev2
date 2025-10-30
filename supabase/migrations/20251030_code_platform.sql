-- Code Platform Tables
-- This migration creates tables for the AI-powered app building platform

-- Vendor Apps table - stores all apps created by vendors
CREATE TABLE IF NOT EXISTS vendor_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  app_type TEXT NOT NULL CHECK (app_type IN ('storefront', 'admin-panel', 'customer-portal', 'mobile', 'dashboard', 'custom')),
  description TEXT,
  github_repo TEXT, -- e.g., 'yourplatform/vendor-slug-app-name'
  deployment_url TEXT, -- Vercel deployment URL
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'building', 'deployed', 'archived')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, slug)
);

-- App editing sessions - track AI usage per session
CREATE TABLE IF NOT EXISTS vendor_app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES vendor_apps(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ai_tokens_used INTEGER DEFAULT 0,
  ai_cost_usd DECIMAL(10,4) DEFAULT 0,
  commits_made INTEGER DEFAULT 0
);

-- AI usage tracking - log every AI API call
CREATE TABLE IF NOT EXISTS vendor_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  app_id UUID REFERENCES vendor_apps(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,4) NOT NULL,
  instruction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App templates (optional - for predefined templates)
CREATE TABLE IF NOT EXISTS app_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  app_type TEXT NOT NULL,
  description TEXT,
  preview_image TEXT,
  github_template_repo TEXT, -- e.g., 'yourplatform/template-storefront'
  is_active BOOLEAN DEFAULT true,
  features JSONB, -- Array of features
  required_subscription_tier TEXT DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_apps_vendor_id ON vendor_apps(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_apps_status ON vendor_apps(status);
CREATE INDEX IF NOT EXISTS idx_vendor_apps_type ON vendor_apps(app_type);
CREATE INDEX IF NOT EXISTS idx_vendor_app_sessions_app_id ON vendor_app_sessions(app_id);
CREATE INDEX IF NOT EXISTS idx_vendor_app_sessions_vendor_id ON vendor_app_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ai_usage_vendor_id ON vendor_ai_usage(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ai_usage_app_id ON vendor_ai_usage(app_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ai_usage_created_at ON vendor_ai_usage(created_at);

-- RLS Policies - vendors can only access their own apps
ALTER TABLE vendor_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can see their own apps
CREATE POLICY "Vendors can view own apps"
  ON vendor_apps FOR SELECT
  USING (vendor_id = auth.uid());

-- Policy: Vendors can create their own apps
CREATE POLICY "Vendors can create own apps"
  ON vendor_apps FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

-- Policy: Vendors can update their own apps
CREATE POLICY "Vendors can update own apps"
  ON vendor_apps FOR UPDATE
  USING (vendor_id = auth.uid());

-- Policy: Vendors can delete their own apps
CREATE POLICY "Vendors can delete own apps"
  ON vendor_apps FOR DELETE
  USING (vendor_id = auth.uid());

-- Policy: Vendors can view their own sessions
CREATE POLICY "Vendors can view own sessions"
  ON vendor_app_sessions FOR SELECT
  USING (vendor_id = auth.uid());

-- Policy: Vendors can insert their own sessions
CREATE POLICY "Vendors can create own sessions"
  ON vendor_app_sessions FOR INSERT
  WITH CHECK (vendor_id = auth.uid());

-- Policy: Vendors can view their own AI usage
CREATE POLICY "Vendors can view own AI usage"
  ON vendor_ai_usage FOR SELECT
  USING (vendor_id = auth.uid());

-- Policy: System can insert AI usage (service role)
CREATE POLICY "Service can insert AI usage"
  ON vendor_ai_usage FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_vendor_apps_updated_at BEFORE UPDATE ON vendor_apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default app templates
INSERT INTO app_templates (name, slug, app_type, description, features, required_subscription_tier)
VALUES
  (
    'Storefront',
    'storefront',
    'storefront',
    'Customer-facing online store with products, cart, and checkout',
    '["Product catalog", "Shopping cart", "Checkout flow", "Customer accounts", "Order tracking"]'::jsonb,
    'pro'
  ),
  (
    'Admin Panel',
    'admin-panel',
    'admin-panel',
    'Internal management tool for orders, inventory, and analytics',
    '["Order management", "Inventory control", "Analytics dashboard", "Staff permissions", "Real-time updates"]'::jsonb,
    'pro'
  ),
  (
    'Customer Portal',
    'customer-portal',
    'customer-portal',
    'Self-service portal for customers to manage orders and account',
    '["Order history", "Loyalty points", "Reorder favorites", "Support tickets", "Profile management"]'::jsonb,
    'pro'
  ),
  (
    'Mobile App',
    'mobile',
    'mobile',
    'iOS/Android app built with React Native',
    '["Mobile shopping", "Push notifications", "Biometric auth", "Camera features", "Offline mode"]'::jsonb,
    'enterprise'
  ),
  (
    'Analytics Dashboard',
    'dashboard',
    'dashboard',
    'Data visualization and reporting tool',
    '["Sales charts", "KPI tracking", "Custom reports", "Data export", "Real-time metrics"]'::jsonb,
    'pro'
  ),
  (
    'Custom App',
    'custom',
    'custom',
    'Start from scratch and build anything you need',
    '["Full flexibility", "AI assistance", "Any framework", "Custom features", "Your vision"]'::jsonb,
    'enterprise'
  )
ON CONFLICT (slug) DO NOTHING;
