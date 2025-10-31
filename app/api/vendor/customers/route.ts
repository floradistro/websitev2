import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || 'all';

    // CRITICAL: Get vendor ID from request header
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Calculate offset
    const offset = (page - 1) * limit;

    // First get total count for pagination
    let countQuery = supabase
      .from('vendor_customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    if (tier !== 'all') {
      countQuery = countQuery.eq('loyalty_tier', tier);
    }

    const { count: totalCount } = await countQuery;

    // Get vendor_customers with pagination applied
    let vcQuery = supabase
      .from('vendor_customers')
      .select('customer_id, loyalty_points, loyalty_tier, total_orders, total_spent, last_purchase_date')
      .eq('vendor_id', vendorId)
      .range(offset, offset + limit - 1)  // Apply pagination here
      .order('created_at', { ascending: false });

    // Apply tier filter
    if (tier !== 'all') {
      vcQuery = vcQuery.eq('loyalty_tier', tier);
    }

    const { data: vendorCustomersData, error: vcError } = await vcQuery;

    if (vcError) {
      return NextResponse.json({ error: vcError.message }, { status: 500 });
    }

    if (!vendorCustomersData || vendorCustomersData.length === 0) {
      return NextResponse.json({
        customers: [],
        stats: { total: 0, withLoyalty: 0, avgPoints: 0, totalLifetimeValue: 0 },
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Get customer IDs
    const customerIds = vendorCustomersData.map(vc => vc.customer_id);

    // Get customer details
    const { data: customersData, error: custError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, created_at')
      .in('id', customerIds);

    if (custError) {
      return NextResponse.json({ error: custError.message }, { status: 500 });
    }

    // Create a map for quick lookup
    const customerMap = new Map(customersData?.map(c => [c.id, c]) || []);

    // Combine data
    let customers = vendorCustomersData
      .map((vc: any) => {
        const customer = customerMap.get(vc.customer_id);
        if (!customer) return null;

        return {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          loyalty_points: vc.loyalty_points,
          loyalty_tier: vc.loyalty_tier,
          total_orders: vc.total_orders,
          total_spent: vc.total_spent,
          last_order_date: vc.last_purchase_date,
          created_at: customer.created_at,
        };
      })
      .filter(c => c !== null);

    // Apply search filter on transformed data (since Supabase can't filter on nested fields in this case)
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter((c: any) =>
        c.email?.toLowerCase().includes(searchLower) ||
        c.first_name?.toLowerCase().includes(searchLower) ||
        c.last_name?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Note: Pagination already applied at database level
    // Search filtering happens after since we need customer details
    const paginatedCustomers = customers;

    // Get stats for THIS vendor only
    const { data: statsData } = await supabase
      .from('vendor_customers')
      .select('loyalty_points, total_spent')
      .eq('vendor_id', vendorId)
      .limit(10000); // Sample for stats

    const stats = {
      total: statsData?.length || 0,
      withLoyalty: statsData?.filter(c => c.loyalty_points > 0).length || 0,
      avgPoints: statsData && statsData.length > 0
        ? Math.round(statsData.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) / statsData.length)
        : 0,
      totalLifetimeValue: statsData?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0,
    };

    return NextResponse.json({
      customers: paginatedCustomers,
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
}
