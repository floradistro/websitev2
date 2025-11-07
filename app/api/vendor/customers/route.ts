import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || 'all';

    // Get vendor ID from request header
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query - customers belong to THIS vendor only
    let baseQuery = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('vendor_id', vendorId);

    // Apply tier filter
    if (tier !== 'all') {
      baseQuery = baseQuery.eq('loyalty_tier', tier);
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase().trim();
      const searchPhone = searchLower.replace(/\D/g, '');

      // Search across multiple fields
      baseQuery = baseQuery.or(
        `first_name.ilike.%${searchLower}%,` +
        `last_name.ilike.%${searchLower}%,` +
        `email.ilike.%${searchLower}%` +
        (searchPhone.length >= 3 ? `,phone.ilike.%${searchPhone}%` : '')
      );
    }

    // Get total count
    const { count: totalCount } = await baseQuery;

    // Get paginated results
    const { data: customers, error } = await baseQuery
      .range(offset, offset + limit - 1)
      .order('loyalty_points', { ascending: false });

    if (error) {
      console.error('[Customer API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format customers
    const formattedCustomers = (customers || []).map((c: any) => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      loyalty_points: c.loyalty_points || 0,
      loyalty_tier: c.loyalty_tier || 'bronze',
      total_orders: c.total_orders || 0,
      total_spent: c.total_spent || 0,
      last_order_date: c.last_purchase_date,
      created_at: c.created_at,
    }));

    // Get stats for THIS vendor only
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    const { count: withLoyaltyCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .gt('loyalty_points', 0);

    // Get aggregate stats
    const { data: statsData } = await supabase
      .from('customers')
      .select('loyalty_points, total_spent')
      .eq('vendor_id', vendorId);

    const stats = {
      total: totalCustomers || 0,
      withLoyalty: withLoyaltyCount || 0,
      avgPoints: statsData && statsData.length > 0
        ? Math.round(statsData.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) / statsData.length)
        : 0,
      totalLifetimeValue: statsData?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0,
    };

    return NextResponse.json({
      customers: formattedCustomers,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[Customer API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
});
