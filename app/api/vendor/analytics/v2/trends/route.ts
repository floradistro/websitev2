import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * Apple-Quality Trend Data API
 *
 * Fetches last 7-14 days of data for sparklines
 * Used by: StatCard sparklines in analytics dashboard
 *
 * Returns:
 * - Daily revenue trend
 * - Daily orders trend
 * - Daily customers trend
 * - Daily average order value trend
 */

interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendResponse {
  revenue: number[];
  orders: number[];
  customers: number[];
  avgOrderValue: number[];
  dates: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const days = parseInt(searchParams.get('days') || '7');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendor_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch daily aggregated data
    const { data, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        total_amount,
        customer_id,
        status
      `)
      .eq('vendor_id', vendorId)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('status', ['completed', 'fulfilled', 'paid']);

    if (error) {
      console.error('Error fetching trend data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trend data' },
        { status: 500 }
      );
    }

    // Group by date and calculate metrics
    const dailyData: Record<
      string,
      {
        revenue: number;
        orders: number;
        customers: Set<string>;
      }
    > = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        revenue: 0,
        orders: 0,
        customers: new Set(),
      };
    }

    // Aggregate data
    data?.forEach((order) => {
      const dateStr = order.created_at.split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += parseFloat(order.total_amount || '0');
        dailyData[dateStr].orders += 1;
        if (order.customer_id) {
          dailyData[dateStr].customers.add(order.customer_id);
        }
      }
    });

    // Convert to arrays
    const dates = Object.keys(dailyData).sort();
    const revenue: number[] = [];
    const orders: number[] = [];
    const customers: number[] = [];
    const avgOrderValue: number[] = [];

    dates.forEach((date) => {
      const day = dailyData[date];
      revenue.push(day.revenue);
      orders.push(day.orders);
      customers.push(day.customers.size);
      avgOrderValue.push(day.orders > 0 ? day.revenue / day.orders : 0);
    });

    const response: TrendResponse = {
      revenue,
      orders,
      customers,
      avgOrderValue,
      dates,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Unexpected error in trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
