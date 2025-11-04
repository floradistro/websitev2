import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Get vendor ID from header (consistent with other endpoints)
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    // Calculate date range
    const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[range] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get revenue data
    const { data: revenueData, error: revenueError } = await supabase
      .from('order_items')
      .select(`
        line_total,
        quantity,
        orders!inner(created_at, status)
      `)
      .eq('vendor_id', vendorId)
      .gte('orders.created_at', startDate.toISOString())
      .in('orders.status', ['completed', 'processing']);

    if (revenueError) throw revenueError;

    // Calculate revenue metrics
    const totalRevenue = revenueData?.reduce((sum, item: any) => sum + parseFloat(item.line_total || '0'), 0) || 0;
    const totalOrders = new Set(revenueData?.map((item: any) => item.orders?.created_at)).size || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get products with cost data
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, cost_price, regular_price, margin_percentage, sales_count')
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('margin_percentage', { ascending: false })
      .limit(10);

    if (productsError) throw productsError;

    // Calculate cost metrics
    const totalCost = productsData?.reduce((sum, p) => sum + (parseFloat(p.cost_price || '0') * p.sales_count), 0) || 0;
    const avgMargin = productsData?.length > 0 
      ? productsData.reduce((sum, p) => sum + (parseFloat(p.margin_percentage || '0')), 0) / productsData.length 
      : 0;

    // Get inventory data - correct column names
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('product_id, quantity, low_stock_threshold')
      .eq('vendor_id', vendorId);

    if (inventoryError) throw inventoryError;

    const lowStockCount = inventoryData?.filter(i => 
      parseFloat(i.quantity) < parseFloat(i.low_stock_threshold || '0')
    ).length || 0;
    
    const stockValue = productsData?.reduce((sum, p) => {
      const inventory = inventoryData?.find(i => i.product_id === p.id);
      const qty = inventory ? parseFloat(inventory.quantity) : 0;
      return sum + (parseFloat(p.cost_price || '0') * qty);
    }, 0) || 0;

    // Calculate turnover rate (simplified: sales_count / avg_stock)
    const avgStock = inventoryData?.reduce((sum, i) => sum + parseFloat(i.quantity), 0) / (inventoryData?.length || 1);
    const totalSales = productsData?.reduce((sum, p) => sum + p.sales_count, 0) || 0;
    const turnoverRate = avgStock > 0 ? totalSales / avgStock : 0;

    // Group revenue by date for chart
    const revenueByDate = revenueData?.reduce((acc: any, item: any) => {
      const date = new Date(item.orders.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += parseFloat(item.line_total || '0');
      return acc;
    }, {}) || {};

    const revenueChartData = Object.entries(revenueByDate).map(([date, amount]) => ({
      date,
      amount: parseFloat(amount as string)
    })).slice(-14); // Last 14 days

    // Top products
    const topPerformers = productsData?.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      revenue: parseFloat(p.regular_price || '0') * p.sales_count,
      units: p.sales_count,
      margin: parseFloat(p.margin_percentage || '0')
    })) || [];

    // Calculate trend (simplified: compare first half vs second half)
    const midpoint = Math.floor(revenueChartData.length / 2);
    const firstHalf = revenueChartData.slice(0, midpoint).reduce((sum, d) => sum + d.amount, 0);
    const secondHalf = revenueChartData.slice(midpoint).reduce((sum, d) => sum + d.amount, 0);
    const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    const analytics = {
      revenue: {
        total: totalRevenue,
        trend: parseFloat(trend.toFixed(2)),
        data: revenueChartData
      },
      orders: {
        total: totalOrders,
        trend: 0, // Could calculate this similarly
        avgValue: avgOrderValue
      },
      products: {
        total: productsData?.length || 0,
        topPerformers,
        underPerformers: [] // Empty for now
      },
      costs: {
        totalCost,
        avgMargin,
        profitability: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
        grossProfit: totalRevenue - totalCost
      },
      inventory: {
        turnoverRate,
        stockValue,
        lowStockCount,
        daysOfInventory: turnoverRate > 0 ? 365 / turnoverRate : 0
      }
    };

    return NextResponse.json({ success: true, analytics });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load analytics' },
      { status: 500 }
    );
  }
}

