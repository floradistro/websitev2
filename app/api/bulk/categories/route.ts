import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Bulk Categories API - Lightning fast category fetching
 * GET /api/bulk/categories?limit=100
 * POST /api/bulk/categories { ids: [...] }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const parentId = searchParams.get('parent_id');
    const includeProducts = searchParams.get('include_products') === 'true';

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        parent_id,
        menu_order,
        product_count,
        is_featured
      `)
      .order('menu_order', { ascending: true });

    if (parentId) {
      if (parentId === 'null' || parentId === '0') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }
    }

    query = query.limit(limit);

    const { data: categories, error } = await query;

    if (error) {
      console.error('Bulk categories error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Optionally fetch product counts
    let enrichedCategories = categories || [];
    if (includeProducts) {
      const categoryIds = categories?.map(c => c.id) || [];
      const { data: productCounts } = await supabase
        .from('product_categories')
        .select('category_id')
        .in('category_id', categoryIds);

      const countMap = new Map<string, number>();
      productCounts?.forEach(pc => {
        countMap.set(pc.category_id, (countMap.get(pc.category_id) || 0) + 1);
      });

      enrichedCategories = categories?.map(cat => ({
        ...cat,
        product_count: countMap.get(cat.id) || 0
      })) || [];
    }

    return NextResponse.json({
      categories: enrichedCategories,
      count: enrichedCategories.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      }
    });
  } catch (error) {
    console.error('Bulk categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .in('id', ids)
      .order('menu_order', { ascending: true });

    if (error) {
      console.error('Bulk categories fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: categories || [],
      count: categories?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      }
    });
  } catch (error) {
    console.error('Bulk categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
