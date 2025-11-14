-- Payment Processor Health Tracking Migration
-- Run this in Supabase SQL Editor or via psql

BEGIN;

-- Add health tracking columns
ALTER TABLE public.payment_processors
ADD COLUMN IF NOT EXISTS last_health_check timestamptz,
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_health_error text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_processors_health 
ON public.payment_processors(is_live, last_health_check);

-- Add comments
COMMENT ON COLUMN public.payment_processors.last_health_check IS 'Last time processor health was checked (real-time monitoring)';
COMMENT ON COLUMN public.payment_processors.is_live IS 'Real-time status - true if processor responded to last health check';
COMMENT ON COLUMN public.payment_processors.last_health_error IS 'Last error message from health check (null if healthy)';

COMMIT;

