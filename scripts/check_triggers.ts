import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTriggers() {
  console.log('🔍 Checking for triggers and constraints...\n');

  // Check for triggers on purchase_order_receives
  const { data: triggers, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('*')
    .eq('event_object_table', 'purchase_order_receives');

  if (triggers && triggers.length > 0) {
    console.log('📋 Triggers on purchase_order_receives:');
    triggers.forEach((trigger: any) => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
    });
  } else {
    console.log('No triggers found on purchase_order_receives');
  }

  // Check for constraints
  const { data: constraints, error: constraintError } = await supabase
    .from('information_schema.table_constraints')
    .select('*')
    .eq('table_name', 'purchase_order_receives');

  if (constraints && constraints.length > 0) {
    console.log('\n🔒 Constraints on purchase_order_receives:');
    constraints.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
  }
}

checkTriggers();
