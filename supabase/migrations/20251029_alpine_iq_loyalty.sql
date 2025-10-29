-- Add Alpine IQ specific fields to customer_loyalty table

ALTER TABLE customer_loyalty
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'builtin',
ADD COLUMN IF NOT EXISTS tier_name TEXT,
ADD COLUMN IF NOT EXISTS tier_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS lifetime_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS alpineiq_customer_id TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_provider ON customer_loyalty(vendor_id, provider);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_alpineiq_id ON customer_loyalty(alpineiq_customer_id);

-- Add unique constraint for Alpine IQ customer mapping
ALTER TABLE customer_loyalty
ADD CONSTRAINT unique_customer_vendor_provider UNIQUE (customer_id, vendor_id, provider);

-- Drop old unique constraint if it exists
ALTER TABLE customer_loyalty
DROP CONSTRAINT IF EXISTS customer_loyalty_vendor_id_customer_id_key;
