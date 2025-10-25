import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vendor/analytics/overview
 * Returns real-time overview metrics for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayOrders, error: todayError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('order_date', today.toISOString());

    if (todayError) throw todayError;

    const todaySales = todayOrders?.reduce((sum, o) => sum + parseFloat(o.vendor_subtotal || '0'), 0) || 0;
    const todayOrderCount = todayOrders?.length || 0;

    // Get last 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weekOrders, error: weekError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('order_date', sevenDaysAgo.toISOString());

    if (weekError) throw weekError;

    const weekSales = weekOrders?.reduce((sum, o) => sum + parseFloat(o.vendor_subtotal || '0'), 0) || 0;
    const weekOrderCount = weekOrders?.length || 0;

    // Get last 30 days stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: monthOrders, error: monthError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('order_date', thirtyDaysAgo.toISOString());

    if (monthError) throw monthError;

    const monthSales = monthOrders?.reduce((sum, o) => sum + parseFloat(o.vendor_subtotal || '0'), 0) || 0;
    const monthOrderCount = monthOrders?.length || 0;
    const avgOrderValue = monthOrderCount > 0 ? monthSales / monthOrderCount : 0;

    // Get pending orders
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .in('fulfillment_status', ['pending', 'processing']);

    if (pendingError) throw pendingError;

    // Get pending payout
    const { data: payoutData, error: payoutError } = await supabase
      .from('vendor_orders')
      .select('vendor_net_amount')
      .eq('vendor_id', vendorId)
      .eq('payout_status', 'pending');

    if (payoutError) throw payoutError;

    const pendingPayout = payoutData?.reduce((sum, o) => sum + parseFloat(o.vendor_net_amount || '0'), 0) || 0;

    // Get top products from order_items
    const { data: topProductsData, error: topProductsError } = await supabase
      .rpc('get_vendor_top_products', {
        p_vendor_id: vendorId,
        p_limit: 5
      });

    let topProducts = [];
    if (!topProductsError && topProductsData) {
      topProducts = topProductsData;
    } else {
      // Fallback if RPC doesn't exist
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, line_total')
        .eq('vendor_id', vendorId)
        .order('line_total', { ascending: false })
        .limit(5);
      
      topProducts = items || [];
    }

    // Get low stock items - fetch all and filter in memory since Supabase doesn't support column comparison
    const { data: allInventory } = await supabase
      .from('inventory')
      .select('id, product_id, quantity, low_stock_threshold, products(name)')
      .eq('vendor_id', vendorId);
    
    const lowStockItems = allInventory?.filter(item => 
      item.quantity <= (item.low_stock_threshold || 0)
    ) || [];

    const lowStockCount = lowStockItems.length;

    return NextResponse.json({
      success: true,
      data: {
        today: {
          sales: todaySales,
          orders: todayOrderCount
        },
        week: {
          sales: weekSales,
          orders: weekOrderCount
        },
        month: {
          sales: monthSales,
          orders: monthOrderCount,
          avgOrderValue
        },
        pending: {
          orders: pendingOrders?.length || 0,
          payout: pendingPayout
        },
        topProducts,
        lowStockCount,
        alerts: {
          lowStock: lowStockCount > 0,
          pendingOrders: (pendingOrders?.length || 0) > 0
        }
      }
    });

  } catch (error: any) {
    console.error('Vendor analytics overview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

