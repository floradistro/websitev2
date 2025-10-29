import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const tier = searchParams.get('tier') || 'all';

  const supabase = getServiceSupabase();

  // Calculate offset
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('customers')
    .select('id, email, first_name, last_name, phone, loyalty_points, loyalty_tier, total_orders, total_spent, last_order_date, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (tier !== 'all') {
    query = query.eq('loyalty_tier', tier);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: customers, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get stats (cached/lightweight query)
  const { data: statsData } = await supabase
    .from('customers')
    .select('loyalty_points, total_spent')
    .limit(10000); // Sample for stats

  const stats = {
    total: count || 0,
    withLoyalty: statsData?.filter(c => c.loyalty_points > 0).length || 0,
    avgPoints: statsData && statsData.length > 0
      ? Math.round(statsData.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) / statsData.length)
      : 0,
    totalLifetimeValue: statsData?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0,
  };

  return NextResponse.json({
    customers,
    stats,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
