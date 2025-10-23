import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

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
    
    // Execute ALL dashboard queries in parallel
    const [vendorResult, productsResult, ordersResult, inventoryResult] = await Promise.allSettled([
      // Vendor branding
      supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single(),
      
      // Products with stats (get ALL products, not just 10)
      supabase
        .from('products')
        .select('id, name, status, featured_image_storage, created_at, stock_quantity')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false }),
      
      // Recent orders (last 30 days)
      supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          created_at,
          order:orders(id, status, total, created_at)
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Low stock inventory
      supabase
        .from('inventory')
        .select(`
          id,
          quantity,
          low_stock_threshold,
          product:products(id, name)
        `)
        .eq('vendor_id', vendorId)
        .lt('quantity', 10)
        .limit(10)
    ]);
    
    // Extract data from results
    const vendor = vendorResult.status === 'fulfilled' ? vendorResult.value.data : null;
    const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
    const orderItems = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
    const lowStockItems = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data || [] : [];
    
    // Calculate stats
    const totalProducts = products.length;
    const approved = products.filter(p => p.status === 'published').length;
    const pending = products.filter(p => p.status === 'pending').length;
    const rejected = products.filter(p => p.status === 'draft').length;
    
    // Calculate sales (last 30 days)
    const totalSales30d = orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    // Get recent products for display
    const recentProducts = products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      image: p.featured_image_storage || '/yacht-club-logo.png',
      status: p.status === 'published' ? 'approved' : p.status === 'pending' ? 'pending' : 'rejected',
      submittedDate: p.created_at
    }));
    
    // Format low stock items
    const lowStock = lowStockItems.map((item: any) => {
      const product = Array.isArray(item.product) ? item.product[0] : item.product;
      return {
        id: item.id,
        name: product?.name || 'Unknown',
        currentStock: item.quantity,
        threshold: item.low_stock_threshold || 5
      };
    });
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        vendor: vendor,
        stats: {
          totalProducts,
          approved,
          pending,
          rejected,
          totalSales30d,
          lowStock: lowStock.length
        },
        recentProducts,
        lowStockItems: lowStock,
        notices: [], // Can add system notices here
        salesData: [], // Can add time-series data if needed
        topProducts: [], // Can add top products by sales
        actionItems: lowStock.length > 0 ? [{
          id: 1,
          title: `${lowStock.length} items low on stock`,
          type: 'warning',
          link: '/vendor/inventory'
        }] : [],
        payout: {
          pendingEarnings: totalSales30d * 0.85, // Assuming 15% marketplace fee
          nextPayoutDate: 'Weekly on Fridays',
          lastPayoutAmount: 0
        }
      },
      meta: {
        responseTime: `${responseTime}ms`,
        vendorId,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        'X-Response-Time': `${responseTime}ms`,
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

