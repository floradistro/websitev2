import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased from 50 to 1000
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

    // CRITICAL: When searching, fetch ALL customers in chunks
    // Otherwise use pagination for performance
    let vendorCustomersData: any[] = [];

    if (search) {
      // Fetch ALL vendor_customers in chunks
      const CHUNK_SIZE = 1000;
      let chunkOffset = 0;
      let hasMore = true;

      while (hasMore) {
        let vcQuery = supabase
          .from('vendor_customers')
          .select('customer_id, loyalty_points, loyalty_tier, total_orders, total_spent, last_purchase_date')
          .eq('vendor_id', vendorId)
          .range(chunkOffset, chunkOffset + CHUNK_SIZE - 1);

        // Apply tier filter
        if (tier !== 'all') {
          vcQuery = vcQuery.eq('loyalty_tier', tier);
        }

        const { data: chunk, error: chunkError } = await vcQuery;

        if (chunkError) {
          console.error(`Error fetching chunk at ${chunkOffset}:`, chunkError);
          break;
        }

        if (!chunk || chunk.length === 0) {
          break;
        }

        vendorCustomersData.push(...chunk);
        chunkOffset += CHUNK_SIZE;
        hasMore = chunk.length === CHUNK_SIZE;
      }
    } else {
      // No search - use regular pagination
      let vcQuery = supabase
        .from('vendor_customers')
        .select('customer_id, loyalty_points, loyalty_tier, total_orders, total_spent, last_purchase_date')
        .eq('vendor_id', vendorId)
        .range(offset, offset + limit - 1)
        .order('loyalty_points', { ascending: false });

      // Apply tier filter
      if (tier !== 'all') {
        vcQuery = vcQuery.eq('loyalty_tier', tier);
      }

      const { data, error: vcError } = await vcQuery;

      if (vcError) {
        return NextResponse.json({ error: vcError.message }, { status: 500 });
      }

      vendorCustomersData = data || [];
    }

    if (!vendorCustomersData || vendorCustomersData.length === 0) {
      return NextResponse.json({
        customers: [],
        stats: { total: 0, withLoyalty: 0, avgPoints: 0, totalLifetimeValue: 0 },
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // When searching, limit the vendor_customers we'll process to avoid timeouts
    // We'll fetch customer details for these, filter, then paginate
    const vcToProcess = search ? vendorCustomersData.slice(0, 2000) : vendorCustomersData;

    // Get customer IDs and deduplicate
    const customerIds = [...new Set(vcToProcess.map(vc => vc.customer_id))];

    // Get customer details in chunks
    const customersData: any[] = [];
    const CUSTOMER_CHUNK_SIZE = 100;

    for (let i = 0; i < customerIds.length; i += CUSTOMER_CHUNK_SIZE) {
      const chunkIds = customerIds.slice(i, i + CUSTOMER_CHUNK_SIZE);

      const { data: chunk, error: custError } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, phone, created_at')
        .in('id', chunkIds);

      if (custError) {
        console.error(`Error fetching customers chunk ${i}:`, custError);
        continue;
      }

      if (chunk) {
        customersData.push(...chunk);
      }
    }

    // Create a map for quick lookup
    const customerMap = new Map(customersData?.map(c => [c.id, c]) || []);

    // Also deduplicate vendor_customers by customer_id (keep highest points)
    const vendorCustomersByCustomerId = new Map();
    for (const vc of vcToProcess) {
      const existing = vendorCustomersByCustomerId.get(vc.customer_id);
      if (!existing || (vc.loyalty_points || 0) > (existing.loyalty_points || 0)) {
        vendorCustomersByCustomerId.set(vc.customer_id, vc);
      }
    }

    // Use deduplicated vendor_customers
    const deduplicatedVendorCustomers = Array.from(vendorCustomersByCustomerId.values());

    // Combine data using deduplicated vendor_customers
    let customers = deduplicatedVendorCustomers
      .map((vc: any) => {
        const customer = customerMap.get(vc.customer_id);
        if (!customer) return null;

        return {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          loyalty_points: vc.loyalty_points || 0,
          loyalty_tier: vc.loyalty_tier || 'bronze',
          total_orders: vc.total_orders || 0,
          total_spent: vc.total_spent || 0,
          last_order_date: vc.last_purchase_date,
          created_at: customer.created_at,
        };
      })
      .filter(c => c !== null);

    // Apply smart search filter on transformed data
    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Split search into words for smart matching
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

      // Score and filter customers
      const scoredCustomers = customers.map((c: any) => {
        const firstName = (c.first_name || '').toLowerCase();
        const lastName = (c.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').replace(/\D/g, '');

        let score = 0;
        let matchesAll = true;

        for (const word of searchWords) {
          const searchPhone = word.replace(/\D/g, '');
          let wordMatched = false;
          let wordScore = 0;

          // Exact match (highest priority)
          if (firstName === word || lastName === word) {
            wordScore = 1000;
            wordMatched = true;
          }
          // Starts with match (high priority)
          else if (firstName.startsWith(word)) {
            wordScore = 100;
            wordMatched = true;
          }
          else if (lastName.startsWith(word)) {
            wordScore = 90;
            wordMatched = true;
          }
          // Word boundary match in full name (medium-high priority)
          else if (new RegExp(`\\b${word}`).test(fullName)) {
            wordScore = 50;
            wordMatched = true;
          }
          // Email starts with
          else if (email.startsWith(word)) {
            wordScore = 40;
            wordMatched = true;
          }
          // Phone match (at least 3 digits)
          else if (searchPhone.length >= 3 && phone.includes(searchPhone)) {
            wordScore = 30;
            wordMatched = true;
          }
          // Contains anywhere (lowest priority)
          else if (firstName.includes(word) || lastName.includes(word) || email.includes(word)) {
            wordScore = 10;
            wordMatched = true;
          }

          if (!wordMatched) {
            matchesAll = false;
            break;
          }

          score += wordScore;
        }

        return { customer: c, score, matchesAll };
      });

      // Filter to only matching customers and sort by score
      customers = scoredCustomers
        .filter(({ matchesAll }) => matchesAll)
        .sort((a, b) => b.score - a.score)
        .map(({ customer }) => customer);
    }

    // Note: Pagination already applied at database level
    // Search filtering happens after since we need customer details
    const paginatedCustomers = customers;

    // Get stats for THIS vendor only
    // Use count for total to avoid loading all records
    const { count: totalCustomers } = await supabase
      .from('vendor_customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    const { count: withLoyaltyCount } = await supabase
      .from('vendor_customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .gt('loyalty_points', 0);

    // Get all records for calculations (bypass 1000 limit)
    const { data: statsData } = await supabase
      .from('vendor_customers')
      .select('loyalty_points, total_spent')
      .eq('vendor_id', vendorId)
      .limit(100000); // Set high limit to get all customers

    const stats = {
      total: totalCustomers || 0,
      withLoyalty: withLoyaltyCount || 0,
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
});
