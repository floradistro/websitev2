#!/usr/bin/env node

const { Client } = require('pg');

const connectionString = 'postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres';

const sql = `
CREATE OR REPLACE FUNCTION increment_session_counter(
  p_session_id uuid,
  p_counter_name text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the session based on counter type
  IF p_counter_name = 'walk_in_sales' THEN
    UPDATE pos_sessions
    SET
      walk_in_sales = walk_in_sales + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'pickup_orders_fulfilled' THEN
    UPDATE pos_sessions
    SET
      pickup_orders_fulfilled = pickup_orders_fulfilled + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'delivery_orders_dispatched' THEN
    UPDATE pos_sessions
    SET
      delivery_orders_dispatched = delivery_orders_dispatched + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSE
    RAISE EXCEPTION 'Invalid counter name: %', p_counter_name;
  END IF;
END;
$function$;

COMMENT ON FUNCTION increment_session_counter IS
  'Atomically increment session transaction counters and total sales. Used by POS sales endpoint.';
`;

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('🔧 Creating increment_session_counter function...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');

    // Verify
    const { rows } = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'increment_session_counter'
    `);

    if (rows.length > 0) {
      console.log('✅ Function verified in database');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Disconnected');
  }
}

applyMigration();
