-- Add 'shipping_fulfillment' to the transaction_type constraint
-- This allows POS to track shipping order fulfillments separately from pickup orders

ALTER TABLE public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_check;
ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_transaction_type_check
  CHECK (transaction_type IN ('walk_in_sale', 'pickup_fulfillment', 'shipping_fulfillment', 'refund', 'void', 'no_sale'));

COMMENT ON CONSTRAINT pos_transactions_transaction_type_check ON public.pos_transactions IS
  'Allowed transaction types: walk_in_sale, pickup_fulfillment, shipping_fulfillment, refund, void, no_sale';
