import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

// Aggregated dashboard stats - single API call
export async function GET() {
  try {
    // Execute all queries in parallel for maximum speed
    const [
      productsCount,
      customersCount,
      ordersData,
      vendorsData,
      pendingProductsData,
      recentOrders,
      wholesaleApps
    ] = await Promise.all([
      // Products count
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),
      
      // Customers count
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true }),
      
      // Orders with revenue
      supabase
        .from('orders')
        .select('id, total_amount, created_at, status, payment_status'),
      
      // Vendors
      supabase
        .from('vendors')
        .select('id, status'),
      
      // Pending products
      supabase
        .from('products')
        .select('id')
        .in('status', ['draft', 'pending']),
      
      // Recent orders for charts (last 7 days)
      supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
      
      // Wholesale applications
      supabase
        .from('wholesale_applications')
        .select('id')
        .eq('status', 'pending')
    ]);

    const orders = ordersData.data || [];
    const totalRevenue = orders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount?.toString() || '0'), 0
    );

    // Process chart data (last 7 days)
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const revenueByDay = last7Days.map(date => {
      const dayRevenue = (recentOrders.data || [])
        .filter((order: any) => order.created_at?.startsWith(date))
        .reduce((sum: number, order: any) => sum + parseFloat(order.total_amount || '0'), 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(dayRevenue * 100) / 100
      };
    });

    const ordersByDay = last7Days.map(date => {
      const dayOrders = (recentOrders.data || [])
        .filter((order: any) => order.created_at?.startsWith(date))
        .length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: dayOrders
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: productsCount.count || 0,
        totalCustomers: customersCount.count || 0,
        totalOrders: ordersData.count || 0,
        totalRevenue: totalRevenue,
        pendingProducts: pendingProductsData.data?.length || 0,
        activeVendors: vendorsData.data?.filter((v: any) => v.status === 'active').length || 0,
        pendingWholesaleApplications: wholesaleApps.data?.length || 0
      },
      charts: {
        revenueByDay,
        ordersByDay
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard stats' },
      { status: 500 }
    );
  }
}

