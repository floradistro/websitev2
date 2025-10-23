-- ============================================================================
-- AI AGENT TABLES - Vendor Storefront Generator
-- Creates tables for storing AI-generated storefronts and conversations
-- ============================================================================

-- ============================================================================
-- VENDOR STOREFRONTS TABLE
-- Stores generated storefronts with deployment information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Deployment Info
  deployment_id TEXT UNIQUE,
  repository_url TEXT,
  live_url TEXT,
  preview_url TEXT,
  
  -- Configuration
  template TEXT,
  customizations JSONB DEFAULT '{}',
  ai_specs JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'building', 'deployed', 'failed')),
  build_logs TEXT,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  last_deployed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI CONVERSATIONS TABLE
-- Stores conversation history between vendors and AI agent
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  storefront_id UUID REFERENCES public.vendor_storefronts(id) ON DELETE CASCADE,
  
  -- Conversation History (array of message objects)
  messages JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS vendor_storefronts_vendor_idx ON public.vendor_storefronts(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_storefronts_status_idx ON public.vendor_storefronts(status);
CREATE INDEX IF NOT EXISTS vendor_storefronts_deployment_idx ON public.vendor_storefronts(deployment_id);

CREATE INDEX IF NOT EXISTS ai_conversations_vendor_idx ON public.ai_conversations(vendor_id);
CREATE INDEX IF NOT EXISTS ai_conversations_storefront_idx ON public.ai_conversations(storefront_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.vendor_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own storefronts
DROP POLICY IF EXISTS "Vendors manage own storefronts" ON public.vendor_storefronts;
CREATE POLICY "Vendors manage own storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Vendors can view their own conversations
DROP POLICY IF EXISTS "Vendors view own conversations" ON public.ai_conversations;
CREATE POLICY "Vendors view own conversations"
  ON public.ai_conversations FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Vendors can create conversations
DROP POLICY IF EXISTS "Vendors create conversations" ON public.ai_conversations;
CREATE POLICY "Vendors create conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Vendors can update their own conversations
DROP POLICY IF EXISTS "Vendors update own conversations" ON public.ai_conversations;
CREATE POLICY "Vendors update own conversations"
  ON public.ai_conversations FOR UPDATE
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

-- Service role has full access to everything
DROP POLICY IF EXISTS "Service role full access to storefronts" ON public.vendor_storefronts;
CREATE POLICY "Service role full access to storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access to conversations" ON public.ai_conversations;
CREATE POLICY "Service role full access to conversations"
  ON public.ai_conversations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on vendor_storefronts
CREATE TRIGGER vendor_storefronts_updated_at 
  BEFORE UPDATE ON public.vendor_storefronts
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Update updated_at timestamp on ai_conversations
CREATE TRIGGER ai_conversations_updated_at 
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT ALL ON public.vendor_storefronts TO authenticated, service_role;
GRANT ALL ON public.ai_conversations TO authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.vendor_storefronts IS 'AI-generated vendor storefronts with deployment info';
COMMENT ON TABLE public.ai_conversations IS 'Conversation history between vendors and AI agent';

COMMENT ON COLUMN public.vendor_storefronts.deployment_id IS 'Vercel deployment ID';
COMMENT ON COLUMN public.vendor_storefronts.ai_specs IS 'Complete AI-generated specifications';
COMMENT ON COLUMN public.vendor_storefronts.status IS 'Current deployment status';

COMMENT ON COLUMN public.ai_conversations.messages IS 'Array of {role, content, timestamp} objects';

