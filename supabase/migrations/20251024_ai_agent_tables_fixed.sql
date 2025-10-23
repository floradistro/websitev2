-- ============================================================================
-- AI AGENT TABLES - FIXED VERSION
-- Creates tables for storing AI-generated storefronts and conversations
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  
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

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  storefront_id UUID,
  
  -- Conversation History
  messages JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ADD FOREIGN KEY CONSTRAINTS (after tables exist)
-- ============================================================================

ALTER TABLE public.vendor_storefronts 
  DROP CONSTRAINT IF EXISTS vendor_storefronts_vendor_id_fkey;

ALTER TABLE public.vendor_storefronts 
  ADD CONSTRAINT vendor_storefronts_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE public.ai_conversations 
  DROP CONSTRAINT IF EXISTS ai_conversations_vendor_id_fkey;

ALTER TABLE public.ai_conversations 
  ADD CONSTRAINT ai_conversations_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

ALTER TABLE public.ai_conversations 
  DROP CONSTRAINT IF EXISTS ai_conversations_storefront_id_fkey;

ALTER TABLE public.ai_conversations 
  ADD CONSTRAINT ai_conversations_storefront_id_fkey 
  FOREIGN KEY (storefront_id) REFERENCES public.vendor_storefronts(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS vendor_storefronts_vendor_idx ON public.vendor_storefronts(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_storefronts_status_idx ON public.vendor_storefronts(status);
CREATE INDEX IF NOT EXISTS vendor_storefronts_deployment_idx ON public.vendor_storefronts(deployment_id);
CREATE INDEX IF NOT EXISTS ai_conversations_vendor_idx ON public.ai_conversations(vendor_id);
CREATE INDEX IF NOT EXISTS ai_conversations_storefront_idx ON public.ai_conversations(storefront_id);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.vendor_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE POLICIES
-- ============================================================================

-- Vendors can manage their own storefronts
DROP POLICY IF EXISTS "Vendors manage own storefronts" ON public.vendor_storefronts;
CREATE POLICY "Vendors manage own storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (vendor_id::text = auth.uid()::text);

-- Vendors can view their own conversations
DROP POLICY IF EXISTS "Vendors view own conversations" ON public.ai_conversations;
CREATE POLICY "Vendors view own conversations"
  ON public.ai_conversations FOR SELECT
  USING (vendor_id::text = auth.uid()::text);

-- Vendors can create conversations
DROP POLICY IF EXISTS "Vendors create conversations" ON public.ai_conversations;
CREATE POLICY "Vendors create conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (vendor_id::text = auth.uid()::text);

-- Vendors can update their own conversations
DROP POLICY IF EXISTS "Vendors update own conversations" ON public.ai_conversations;
CREATE POLICY "Vendors update own conversations"
  ON public.ai_conversations FOR UPDATE
  USING (vendor_id::text = auth.uid()::text);

-- Service role has full access
DROP POLICY IF EXISTS "Service role storefronts" ON public.vendor_storefronts;
CREATE POLICY "Service role storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Service role conversations" ON public.ai_conversations;
CREATE POLICY "Service role conversations"
  ON public.ai_conversations FOR ALL
  USING (true);

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS vendor_storefronts_updated_at ON public.vendor_storefronts;
CREATE TRIGGER vendor_storefronts_updated_at 
  BEFORE UPDATE ON public.vendor_storefronts
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER ai_conversations_updated_at 
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.vendor_storefronts TO authenticated, service_role;
GRANT ALL ON public.ai_conversations TO authenticated, service_role;

-- ============================================================================
-- 8. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.vendor_storefronts IS 'AI-generated vendor storefronts with deployment info';
COMMENT ON TABLE public.ai_conversations IS 'Conversation history between vendors and AI agent';

