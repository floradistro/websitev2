-- Create Alpine IQ sync queue table for retry logic

CREATE TABLE IF NOT EXISTS alpine_iq_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'customer', 'refund', 'void')),
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  error_message TEXT,
  last_retry_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_alpine_iq_sync_queue_vendor ON alpine_iq_sync_queue(vendor_id);
CREATE INDEX IF NOT EXISTS idx_alpine_iq_sync_queue_status ON alpine_iq_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_alpine_iq_sync_queue_type ON alpine_iq_sync_queue(type);
CREATE INDEX IF NOT EXISTS idx_alpine_iq_sync_queue_created ON alpine_iq_sync_queue(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alpine_iq_sync_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER alpine_iq_sync_queue_updated_at
  BEFORE UPDATE ON alpine_iq_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_alpine_iq_sync_queue_updated_at();

-- Add RLS policies
ALTER TABLE alpine_iq_sync_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for API)
CREATE POLICY "Service role full access to sync queue" ON alpine_iq_sync_queue
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE alpine_iq_sync_queue IS 'Queue for retrying failed Alpine IQ API syncs';
COMMENT ON COLUMN alpine_iq_sync_queue.type IS 'Type of sync: sale, customer, refund, void';
COMMENT ON COLUMN alpine_iq_sync_queue.data IS 'JSON data to sync to Alpine IQ';
COMMENT ON COLUMN alpine_iq_sync_queue.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN alpine_iq_sync_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN alpine_iq_sync_queue.max_retries IS 'Maximum number of retries before marking as failed';
