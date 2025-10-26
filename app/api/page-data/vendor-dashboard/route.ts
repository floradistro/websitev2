import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    console.log(`[Dashboard API] Starting fetch for vendor: ${vendorId}`);
    
    // Execute ONLY essential dashboard queries in parallel (reduced from 4 to 3 queries)
    const [vendorResult, productsResult, inventoryResult] = await Promise.allSettled([
      // Vendor branding - only essential fields
      supabase
        .from('vendors')
        .select('id, store_name, store_tagline, logo_url')
        .eq('id', vendorId)
        .single(),
      
      // Products - minimal fields only for stats
      supabase
        .from('products')
        .select('id, name, status, featured_image_storage, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(100), // Limit to 100 for stats
      
      // Low stock inventory only - faster than full inventory scan
      supabase
        .from('inventory')
        .select('id, quantity, low_stock_threshold, product_id')
        .eq('vendor_id', vendorId)
        .lt('quantity', 10)
        .limit(20)
    ]);
    
    console.log(`[Dashboard API] Parallel queries completed in ${Date.now() - startTime}ms`);
    
    // Extract data from results
    const vendor = vendorResult.status === 'fulfilled' ? vendorResult.value.data : null;
    const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
    const lowStockItems = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data || [] : [];
    
    console.log(`[Dashboard API] Extracted: ${products.length} products, ${lowStockItems.length} low stock items`);
    
    // Calculate stats (fast in-memory operations)
    const totalProducts = products.length;
    const approved = products.filter(p => p.status === 'published').length;
    const pending = products.filter(p => p.status === 'pending').length;
    const rejected = products.filter(p => p.status === 'draft').length;
    
    // Get recent products for display (top 5)
    const recentProducts = products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      image: p.featured_image_storage || '/yacht-club-logo.png',
      status: p.status === 'published' ? 'approved' : p.status === 'pending' ? 'pending' : 'rejected',
      submittedDate: p.created_at
    }));
    
    // Need product names for low stock - fetch in one query
    let lowStock: any[] = [];
    if (lowStockItems.length > 0) {
      const lowStockProductIds = lowStockItems.map(i => i.product_id);
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name')
        .in('id', lowStockProductIds);
      
      const productNameMap = new Map((lowStockProducts || []).map(p => [p.id, p.name]));
      
      lowStock = lowStockItems.map((item: any) => ({
        id: item.id,
        name: productNameMap.get(item.product_id) || 'Unknown',
        currentStock: item.quantity,
        threshold: item.low_stock_threshold || 5
      }));
    }
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[Dashboard API] ✅ Complete in ${responseTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: {
        vendor: vendor,
        stats: {
          totalProducts,
          approved,
          pending,
          rejected,
          totalSales30d: 0, // Not fetching sales for speed - add back if needed
          lowStock: lowStock.length,
          sales_30_days: 0,
          pending_review: pending,
          low_stock_items: lowStock.length
        },
        recentProducts,
        lowStockItems: lowStock,
        notices: [],
        sales_data: [], // Empty for now - add back if analytics needed
        topProducts: [],
        actionItems: []
      },
      meta: {
        responseTime: `${responseTime}ms`,
        vendorId,
        timestamp: new Date().toISOString(),
        cached: true
      }
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'X-Response-Time': `${responseTime}ms`,
        'CDN-Cache-Control': 'max-age=30'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in /api/page-data/vendor-dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch vendor dashboard data'
      },
      { status: 500 }
    );
  }
}

