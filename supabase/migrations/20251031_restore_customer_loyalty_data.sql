/**
 * Restore Customer Loyalty Data
 *
 * Transfer loyalty points, orders, and spending data from customers table
 * to vendor_customers table
 */

DO $$
DECLARE
  flora_vendor_id UUID := 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
  updated_count INTEGER := 0;
BEGIN

  -- Update vendor_customers with actual data from customers table
  UPDATE vendor_customers vc
  SET
    loyalty_points = COALESCE(c.loyalty_points, 0),
    loyalty_tier = COALESCE(c.loyalty_tier, 'bronze'),
    total_orders = COALESCE(c.total_orders, 0),
    total_spent = COALESCE(c.total_spent, 0),
    last_purchase_date = c.last_order_date
  FROM customers c
  WHERE vc.customer_id = c.id
    AND vc.vendor_id = flora_vendor_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Successfully updated loyalty data for % customers', updated_count;

END $$;

-- Verify the data transfer
SELECT
  COUNT(*) as total_customers,
  SUM(loyalty_points) as total_points,
  SUM(total_orders) as total_orders,
  SUM(total_spent) as total_spent
FROM vendor_customers
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
