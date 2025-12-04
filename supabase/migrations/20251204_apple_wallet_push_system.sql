-- ============================================================================
-- APPLE WALLET REAL-TIME UPDATE SYSTEM
-- ============================================================================
-- This migration creates the infrastructure for Apple Wallet push notifications
-- enabling real-time updates to loyalty passes when points change.
--
-- Architecture:
-- 1. Device registrations table - tracks which devices have installed passes
-- 2. Pass updates log - tracks pending updates for each pass
-- 3. Database trigger - fires when customer points change
-- 4. Push notification queue - for async processing
-- ============================================================================

-- ============================================================================
-- TABLE: wallet_device_registrations
-- Stores Apple Wallet device registrations for push notifications
-- Apple requires this for the web service API
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_device_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Apple's device identifier (sent during registration)
    device_library_identifier TEXT NOT NULL,

    -- APNs push token for sending notifications
    push_token TEXT NOT NULL,

    -- Pass identification
    pass_type_identifier TEXT NOT NULL DEFAULT 'pass.com.whaletools.wallet',
    serial_number TEXT NOT NULL,

    -- Link to our data
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_push_at TIMESTAMPTZ,
    push_count INTEGER DEFAULT 0,

    -- Unique constraint per device + pass combination
    CONSTRAINT unique_device_pass UNIQUE (device_library_identifier, pass_type_identifier, serial_number)
);

-- Index for fast lookups by customer (when points change)
CREATE INDEX IF NOT EXISTS idx_wallet_device_customer
ON public.wallet_device_registrations(customer_id);

-- Index for pass type lookups (Apple web service)
CREATE INDEX IF NOT EXISTS idx_wallet_device_pass_type
ON public.wallet_device_registrations(pass_type_identifier, serial_number);

-- ============================================================================
-- TABLE: wallet_push_queue
-- Queue for async push notification processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_push_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Target
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,

    -- Push details
    push_type TEXT NOT NULL DEFAULT 'points_update', -- points_update, tier_change, promo
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest

    -- Payload for the push (what changed)
    payload JSONB DEFAULT '{}',

    -- Processing state
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,

    -- Error tracking
    last_error TEXT
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_wallet_push_queue_pending
ON public.wallet_push_queue(status, priority, created_at)
WHERE status = 'pending';

-- ============================================================================
-- TABLE: wallet_passes (update existing or create)
-- Add columns needed for push notifications
-- ============================================================================
DO $$
BEGIN
    -- Add web_service_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wallet_passes' AND column_name = 'web_service_url'
    ) THEN
        ALTER TABLE public.wallet_passes
        ADD COLUMN web_service_url TEXT;
    END IF;

    -- Add last_push_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wallet_passes' AND column_name = 'last_push_at'
    ) THEN
        ALTER TABLE public.wallet_passes
        ADD COLUMN last_push_at TIMESTAMPTZ;
    END IF;

    -- Add push_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wallet_passes' AND column_name = 'push_enabled'
    ) THEN
        ALTER TABLE public.wallet_passes
        ADD COLUMN push_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================================================
-- FUNCTION: queue_wallet_push
-- Called by trigger to queue a push notification when points change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_wallet_push()
RETURNS TRIGGER AS $$
DECLARE
    points_changed BOOLEAN;
    tier_changed BOOLEAN;
BEGIN
    -- Check what changed
    points_changed := OLD.loyalty_points IS DISTINCT FROM NEW.loyalty_points;
    tier_changed := OLD.loyalty_tier IS DISTINCT FROM NEW.loyalty_tier;

    -- Only queue if something relevant changed
    IF points_changed OR tier_changed THEN
        INSERT INTO public.wallet_push_queue (
            customer_id,
            vendor_id,
            push_type,
            priority,
            payload
        ) VALUES (
            NEW.id,
            NEW.vendor_id,
            CASE
                WHEN tier_changed THEN 'tier_change'
                ELSE 'points_update'
            END,
            CASE
                WHEN tier_changed THEN 1  -- Tier changes are high priority
                ELSE 5
            END,
            jsonb_build_object(
                'old_points', OLD.loyalty_points,
                'new_points', NEW.loyalty_points,
                'old_tier', OLD.loyalty_tier,
                'new_tier', NEW.loyalty_tier,
                'customer_name', CONCAT(NEW.first_name, ' ', NEW.last_name),
                'changed_at', NOW()
            )
        );

        -- Log for debugging
        RAISE NOTICE 'Wallet push queued for customer % - points: % -> %, tier: % -> %',
            NEW.id,
            OLD.loyalty_points, NEW.loyalty_points,
            OLD.loyalty_tier, NEW.loyalty_tier;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: wallet_push_on_points_change
-- Fires when customer loyalty points or tier changes
-- ============================================================================
DROP TRIGGER IF EXISTS wallet_push_on_points_change ON public.customers;
CREATE TRIGGER wallet_push_on_points_change
    AFTER UPDATE OF loyalty_points, loyalty_tier ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.queue_wallet_push();

-- ============================================================================
-- FUNCTION: get_passes_for_device
-- Apple Web Service API: Get serial numbers for registered passes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_passes_for_device(
    p_device_library_id TEXT,
    p_pass_type_id TEXT,
    p_updated_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    serial_number TEXT,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wdr.serial_number,
        COALESCE(wp.last_updated_at, wdr.updated_at) as last_updated
    FROM public.wallet_device_registrations wdr
    LEFT JOIN public.wallet_passes wp
        ON wp.serial_number = wdr.serial_number
        AND wp.vendor_id = wdr.vendor_id
    WHERE wdr.device_library_identifier = p_device_library_id
        AND wdr.pass_type_identifier = p_pass_type_id
        AND (p_updated_since IS NULL OR COALESCE(wp.last_updated_at, wdr.updated_at) > p_updated_since);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: register_device_for_pass
-- Apple Web Service API: Register a device for push notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_device_for_pass(
    p_device_library_id TEXT,
    p_pass_type_id TEXT,
    p_serial_number TEXT,
    p_push_token TEXT,
    p_auth_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_pass RECORD;
    v_result JSONB;
BEGIN
    -- Verify the pass exists and auth token matches
    SELECT * INTO v_pass
    FROM public.wallet_passes
    WHERE serial_number = p_serial_number
        AND pass_type_identifier = p_pass_type_id
        AND authentication_token = p_auth_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pass not found or invalid authentication'
        );
    END IF;

    -- Insert or update the device registration
    INSERT INTO public.wallet_device_registrations (
        device_library_identifier,
        push_token,
        pass_type_identifier,
        serial_number,
        customer_id,
        vendor_id
    ) VALUES (
        p_device_library_id,
        p_push_token,
        p_pass_type_id,
        p_serial_number,
        v_pass.customer_id,
        v_pass.vendor_id
    )
    ON CONFLICT (device_library_identifier, pass_type_identifier, serial_number)
    DO UPDATE SET
        push_token = EXCLUDED.push_token,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Device registered successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: unregister_device_for_pass
-- Apple Web Service API: Unregister a device
-- ============================================================================
CREATE OR REPLACE FUNCTION public.unregister_device_for_pass(
    p_device_library_id TEXT,
    p_pass_type_id TEXT,
    p_serial_number TEXT,
    p_auth_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_pass RECORD;
BEGIN
    -- Verify the pass exists and auth token matches
    SELECT * INTO v_pass
    FROM public.wallet_passes
    WHERE serial_number = p_serial_number
        AND pass_type_identifier = p_pass_type_id
        AND authentication_token = p_auth_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pass not found or invalid authentication'
        );
    END IF;

    -- Delete the registration
    DELETE FROM public.wallet_device_registrations
    WHERE device_library_identifier = p_device_library_id
        AND pass_type_identifier = p_pass_type_id
        AND serial_number = p_serial_number;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Device unregistered successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_push_tokens_for_customer
-- Get all push tokens for a customer's wallet passes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_push_tokens_for_customer(p_customer_id UUID)
RETURNS TABLE (
    push_token TEXT,
    pass_type_identifier TEXT,
    serial_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wdr.push_token,
        wdr.pass_type_identifier,
        wdr.serial_number
    FROM public.wallet_device_registrations wdr
    WHERE wdr.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: process_wallet_push_queue
-- Process pending push notifications (called by edge function)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_wallet_push_queue(p_batch_size INTEGER DEFAULT 100)
RETURNS TABLE (
    queue_id UUID,
    customer_id UUID,
    vendor_id UUID,
    push_type TEXT,
    payload JSONB,
    push_tokens TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH pending_items AS (
        SELECT wpq.*
        FROM public.wallet_push_queue wpq
        WHERE wpq.status = 'pending'
            AND (wpq.next_retry_at IS NULL OR wpq.next_retry_at <= NOW())
        ORDER BY wpq.priority, wpq.created_at
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    ),
    updated AS (
        UPDATE public.wallet_push_queue
        SET status = 'processing',
            attempts = attempts + 1
        WHERE id IN (SELECT id FROM pending_items)
        RETURNING *
    )
    SELECT
        u.id as queue_id,
        u.customer_id,
        u.vendor_id,
        u.push_type,
        u.payload,
        ARRAY_AGG(wdr.push_token) as push_tokens
    FROM updated u
    LEFT JOIN public.wallet_device_registrations wdr ON wdr.customer_id = u.customer_id
    GROUP BY u.id, u.customer_id, u.vendor_id, u.push_type, u.payload;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: mark_push_completed
-- Mark a push as completed
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_push_completed(p_queue_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.wallet_push_queue
    SET status = 'completed',
        processed_at = NOW()
    WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: mark_push_failed
-- Mark a push as failed (with retry logic)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_push_failed(
    p_queue_id UUID,
    p_error TEXT
)
RETURNS VOID AS $$
DECLARE
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    SELECT attempts, max_attempts INTO v_attempts, v_max_attempts
    FROM public.wallet_push_queue
    WHERE id = p_queue_id;

    IF v_attempts >= v_max_attempts THEN
        -- Max retries reached, mark as permanently failed
        UPDATE public.wallet_push_queue
        SET status = 'failed',
            last_error = p_error,
            processed_at = NOW()
        WHERE id = p_queue_id;
    ELSE
        -- Schedule retry with exponential backoff
        UPDATE public.wallet_push_queue
        SET status = 'pending',
            last_error = p_error,
            next_retry_at = NOW() + (POWER(2, v_attempts) * INTERVAL '1 minute')
        WHERE id = p_queue_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.wallet_device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_push_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to device registrations"
ON public.wallet_device_registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to push queue"
ON public.wallet_push_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_device_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_push_queue TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_wallet_push() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_passes_for_device(TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_device_for_pass(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.unregister_device_for_pass(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_push_tokens_for_customer(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_wallet_push_queue(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_push_completed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_push_failed(UUID, TEXT) TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.wallet_device_registrations IS 'Stores Apple Wallet device registrations for push notifications';
COMMENT ON TABLE public.wallet_push_queue IS 'Queue for processing Apple Wallet push notifications';
COMMENT ON FUNCTION public.queue_wallet_push() IS 'Trigger function to queue push notifications when customer points change';
COMMENT ON FUNCTION public.get_passes_for_device(TEXT, TEXT, TIMESTAMPTZ) IS 'Apple Web Service API: Get serial numbers for registered passes';
COMMENT ON FUNCTION public.register_device_for_pass(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Apple Web Service API: Register a device for push notifications';
