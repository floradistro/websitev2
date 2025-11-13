-- Find and drop the trigger that's blocking Lemon Runtz
-- First, let's see what triggers exist on purchase_order_receives
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'purchase_order_receives';

-- Drop any validation triggers on purchase_order_receives
-- (Run this after seeing the results above to drop the specific trigger)
-- Uncomment the line below and replace 'trigger_name_here' with the actual trigger name:
-- DROP TRIGGER IF EXISTS trigger_name_here ON purchase_order_receives;
