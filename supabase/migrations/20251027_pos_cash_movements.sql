-- ============================================================================
-- POS CASH MOVEMENTS - Complete Cash Drawer Tracking
-- Tracks every cash movement during a shift (not just opening/closing)
-- ============================================================================

-- ============================================================================
-- 1. CREATE pos_cash_movements TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pos_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
  register_id UUID REFERENCES public.pos_registers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'opening',          -- Initial cash when session opens
    'sale',             -- Cash received from sale
    'refund',           -- Cash given back for refund
    'no_sale',          -- Open drawer without transaction (make change)
    'paid_in',          -- Add cash to drawer (bank change, float adjustment)
    'paid_out',         -- Remove cash from drawer (tips, petty cash, change for customer)
    'closing'           -- Final cash when session closes
  )),
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,  -- Positive for additions, negative for removals
  
  -- Transaction references
  transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Details
  reason TEXT NOT NULL,           -- "Opening cash", "Sale #123", "Gave change to customer", etc.
  notes TEXT,                     -- Additional details
  
  -- Running balance (calculated on insert)
  running_balance DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pos_cash_movements_session_idx ON public.pos_cash_movements(session_id);
CREATE INDEX IF NOT EXISTS pos_cash_movements_register_idx ON public.pos_cash_movements(register_id);
CREATE INDEX IF NOT EXISTS pos_cash_movements_user_idx ON public.pos_cash_movements(user_id);
CREATE INDEX IF NOT EXISTS pos_cash_movements_location_idx ON public.pos_cash_movements(location_id);
CREATE INDEX IF NOT EXISTS pos_cash_movements_type_idx ON public.pos_cash_movements(movement_type);
CREATE INDEX IF NOT EXISTS pos_cash_movements_created_at_idx ON public.pos_cash_movements(created_at DESC);

COMMENT ON TABLE public.pos_cash_movements IS 'Tracks every cash movement in/out of drawer during a session';
COMMENT ON COLUMN public.pos_cash_movements.movement_type IS 'Type of cash movement: opening, sale, refund, no_sale, paid_in, paid_out, closing';
COMMENT ON COLUMN public.pos_cash_movements.amount IS 'Positive for cash IN, negative for cash OUT';
COMMENT ON COLUMN public.pos_cash_movements.running_balance IS 'Cash balance after this movement';


-- ============================================================================
-- 2. FUNCTION TO CALCULATE RUNNING BALANCE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_cash_running_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_balance DECIMAL(10,2);
BEGIN
  -- Get previous balance for this session
  SELECT running_balance INTO v_previous_balance
  FROM public.pos_cash_movements
  WHERE session_id = NEW.session_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no previous balance, this is the first movement (should be opening)
  IF v_previous_balance IS NULL THEN
    NEW.running_balance := NEW.amount;
  ELSE
    -- Add amount to previous balance
    NEW.running_balance := v_previous_balance + NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_running_balance_trigger ON public.pos_cash_movements;
CREATE TRIGGER calculate_running_balance_trigger
  BEFORE INSERT ON public.pos_cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_cash_running_balance();

COMMENT ON FUNCTION public.calculate_cash_running_balance IS 'Automatically calculates running balance for each cash movement';


-- ============================================================================
-- 3. FUNCTION TO AUTO-LOG CASH SALES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_cash_sale_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if payment method is cash and transaction completed
  IF NEW.payment_method = 'cash' 
     AND NEW.payment_status = 'completed' 
     AND NEW.session_id IS NOT NULL THEN
    
    -- Insert cash movement for this sale
    INSERT INTO public.pos_cash_movements (
      session_id,
      register_id,
      user_id,
      location_id,
      vendor_id,
      movement_type,
      amount,
      transaction_id,
      order_id,
      reason,
      metadata
    ) VALUES (
      NEW.session_id,
      NEW.register_id,
      NEW.user_id,
      NEW.location_id,
      NEW.vendor_id,
      'sale',
      NEW.total_amount,
      NEW.id,
      NEW.order_id,
      'Cash sale: ' || COALESCE((SELECT order_number FROM public.orders WHERE id = NEW.order_id), 'N/A'),
      jsonb_build_object(
        'transaction_number', NEW.transaction_number,
        'transaction_type', NEW.transaction_type,
        'cash_tendered', NEW.cash_tendered,
        'change_given', NEW.change_given
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_cash_sale_trigger ON public.pos_transactions;
CREATE TRIGGER log_cash_sale_trigger
  AFTER INSERT ON public.pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cash_sale_movement();

COMMENT ON FUNCTION public.log_cash_sale_movement IS 'Automatically logs cash movements for cash sales';


-- ============================================================================
-- 4. FUNCTION TO AUTO-LOG OPENING/CLOSING CASH
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_session_cash_movements()
RETURNS TRIGGER AS $$
BEGIN
  -- On session open: log opening cash
  IF TG_OP = 'INSERT' AND NEW.status = 'open' THEN
    INSERT INTO public.pos_cash_movements (
      session_id,
      register_id,
      user_id,
      location_id,
      vendor_id,
      movement_type,
      amount,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      NEW.register_id,
      NEW.user_id,
      NEW.location_id,
      NEW.vendor_id,
      'opening',
      NEW.opening_cash,
      'Session opened: ' || NEW.session_number,
      jsonb_build_object('session_number', NEW.session_number)
    );
  END IF;
  
  -- On session close: log closing cash
  IF TG_OP = 'UPDATE' 
     AND OLD.status = 'open' 
     AND NEW.status = 'closed' 
     AND NEW.closing_cash IS NOT NULL THEN
    
    INSERT INTO public.pos_cash_movements (
      session_id,
      register_id,
      user_id,
      location_id,
      vendor_id,
      movement_type,
      amount,
      reason,
      notes,
      metadata
    ) VALUES (
      NEW.id,
      NEW.register_id,
      NEW.user_id,
      NEW.location_id,
      NEW.vendor_id,
      'closing',
      0, -- Closing is just a marker, doesn't change balance
      'Session closed: ' || NEW.session_number,
      'Expected: $' || NEW.expected_cash::TEXT || ', Actual: $' || NEW.closing_cash::TEXT || ', Difference: $' || NEW.cash_difference::TEXT,
      jsonb_build_object(
        'session_number', NEW.session_number,
        'expected_cash', NEW.expected_cash,
        'closing_cash', NEW.closing_cash,
        'cash_difference', NEW.cash_difference
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_session_movements_trigger ON public.pos_sessions;
CREATE TRIGGER log_session_movements_trigger
  AFTER INSERT OR UPDATE ON public.pos_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_session_cash_movements();

COMMENT ON FUNCTION public.log_session_cash_movements IS 'Automatically logs opening and closing cash movements';


-- ============================================================================
-- 5. VIEW FOR SESSION CASH SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW public.pos_session_cash_summary AS
SELECT 
  cm.session_id,
  s.session_number,
  s.location_id,
  l.name as location_name,
  
  -- Movement counts
  COUNT(*) as total_movements,
  COUNT(*) FILTER (WHERE cm.movement_type = 'sale') as sale_count,
  COUNT(*) FILTER (WHERE cm.movement_type = 'refund') as refund_count,
  COUNT(*) FILTER (WHERE cm.movement_type = 'no_sale') as no_sale_count,
  COUNT(*) FILTER (WHERE cm.movement_type = 'paid_in') as paid_in_count,
  COUNT(*) FILTER (WHERE cm.movement_type = 'paid_out') as paid_out_count,
  
  -- Amount totals
  SUM(cm.amount) FILTER (WHERE cm.movement_type = 'opening') as opening_amount,
  SUM(cm.amount) FILTER (WHERE cm.movement_type = 'sale') as sales_amount,
  SUM(cm.amount) FILTER (WHERE cm.movement_type = 'refund') as refunds_amount,
  SUM(cm.amount) FILTER (WHERE cm.movement_type = 'paid_in') as paid_in_amount,
  SUM(cm.amount) FILTER (WHERE cm.movement_type = 'paid_out') as paid_out_amount,
  
  -- Expected closing balance (opening + all movements)
  SUM(cm.amount) FILTER (WHERE cm.movement_type != 'closing') as expected_closing,
  
  -- Actual closing (from session)
  s.closing_cash as actual_closing,
  s.cash_difference,
  
  -- Session dates
  s.opened_at,
  s.closed_at

FROM public.pos_cash_movements cm
JOIN public.pos_sessions s ON s.id = cm.session_id
JOIN public.locations l ON l.id = s.location_id
GROUP BY cm.session_id, s.id, l.id
ORDER BY s.opened_at DESC;

COMMENT ON VIEW public.pos_session_cash_summary IS 'Summary of all cash movements per session with breakdown';


-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.pos_cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Location staff can view cash movements" ON public.pos_cash_movements;
CREATE POLICY "Location staff can view cash movements"
  ON public.pos_cash_movements FOR SELECT
  USING (
    location_id IN (
      SELECT location_id FROM public.user_locations 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Location staff can create cash movements" ON public.pos_cash_movements;
CREATE POLICY "Location staff can create cash movements"
  ON public.pos_cash_movements FOR INSERT
  WITH CHECK (
    location_id IN (
      SELECT location_id FROM public.user_locations 
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        AND can_sell = true
    )
  );

DROP POLICY IF EXISTS "Service role full access to cash movements" ON public.pos_cash_movements;
CREATE POLICY "Service role full access to cash movements"
  ON public.pos_cash_movements FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- 7. GRANTS
-- ============================================================================
GRANT ALL ON public.pos_cash_movements TO authenticated, service_role;


-- ============================================================================
-- 8. UPDATE TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS set_pos_cash_movements_updated_at ON public.pos_cash_movements;
CREATE TRIGGER set_pos_cash_movements_updated_at 
  BEFORE UPDATE ON public.pos_cash_movements
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Created pos_cash_movements table
-- ✅ Automatic running balance calculation
-- ✅ Auto-log cash sales from pos_transactions
-- ✅ Auto-log opening/closing from pos_sessions
-- ✅ Session cash summary view
-- ✅ RLS policies for location-based access
-- ✅ Grants for authenticated users


