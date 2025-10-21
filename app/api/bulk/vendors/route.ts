import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Bulk Vendors API - Fast vendor fetching
 * GET /api/bulk/vendors?limit=100&status=active
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const status = searchParams.get('status') || 'active';
    const includeLocations = searchParams.get('include_locations') === 'true';

    const supabase = getServiceSupabase();
    
    let selectQuery = `
      id,
      email,
      store_name,
      slug,
      status,
      phone,
      address,
      city,
      state,
      zip,
      logo_url,
      banner_url,
      description,
      total_locations,
      created_at
    `;

    if (includeLocations) {
      selectQuery += `,
        locations(
          id,
          name,
          slug,
          city,
          state,
          is_active,
          accepts_online_orders
        )
      `;
    }

    let query = supabase
      .from('vendors')
      .select(selectQuery)
      .order('store_name', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.limit(limit);

    const { data: vendors, error } = await query;

    if (error) {
      console.error('Bulk vendors error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vendors: vendors || [],
      count: vendors?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      }
    });
  } catch (error) {
    console.error('Bulk vendors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Fetch specific vendors by IDs
 */
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select(`
        *,
        locations(*)
      `)
      .in('id', ids);

    if (error) {
      console.error('Bulk vendors fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vendors: vendors || [],
      count: vendors?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      }
    });
  } catch (error) {
    console.error('Bulk vendors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

