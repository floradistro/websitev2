/**
 * Add shipping_fulfillment to transaction_type constraint
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public'
  }
});

async function updateConstraint() {
  console.log('🔧 Updating transaction_type constraint to include shipping_fulfillment...\n');

  // Drop the old constraint
  const { error: dropError } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_check;
    `
  });

  if (dropError) {
    console.error('❌ Failed to drop constraint:', dropError);
  } else {
    console.log('✅ Old constraint dropped');
  }

  // Add the new constraint with shipping_fulfillment
  const { error: addError } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.pos_transactions ADD CONSTRAINT pos_transactions_transaction_type_check
        CHECK (transaction_type IN ('walk_in_sale', 'pickup_fulfillment', 'shipping_fulfillment', 'refund', 'void', 'no_sale'));
    `
  });

  if (addError) {
    console.error('❌ Failed to add constraint:', addError);
    process.exit(1);
  }

  console.log('✅ New constraint added with shipping_fulfillment support');
  console.log('\n📋 Allowed transaction types: walk_in_sale, pickup_fulfillment, shipping_fulfillment, refund, void, no_sale');
}

updateConstraint()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
