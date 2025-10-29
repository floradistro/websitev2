import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const productId = 'fd80bd67-9b2e-4e95-aeb7-edd580daa6f8'; // Bolo Candy

  console.log('🧪 TEST: Simple query');
  const { data: simple, error: simpleError } = await supabase
    .from('product_pricing_assignments')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true);

  console.log('Simple result:', simple?.length, 'error:', simpleError);

  console.log('🧪 TEST: Query with join');
  const { data: withJoin, error: joinError } = await supabase
    .from('product_pricing_assignments')
    .select(`
      *,
      product:products!inner (
        id,
        name
      ),
      blueprint:pricing_tier_blueprints (
        id,
        name
      )
    `)
    .eq('product_id', productId)
    .eq('is_active', true);

  console.log('With join result:', withJoin?.length, 'error:', joinError);

  return NextResponse.json({
    simple: { count: simple?.length || 0, data: simple, error: simpleError },
    withJoin: { count: withJoin?.length || 0, data: withJoin, error: joinError }
  });
}
