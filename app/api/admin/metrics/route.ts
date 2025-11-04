import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[range] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total customers (vendors)
    const { count: totalCustomers } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get previous period for growth calculation
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const { count: previousCustomers } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('created_at', startDate.toISOString());

    // Calculate customer growth
    const customerGrowth = previousCustomers && previousCustomers > 0
      ? (((totalCustomers || 0) - previousCustomers) / previousCustomers) * 100
      : 0;

    // Get active trials
    const { count: activeTrials } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .eq('is_active', true);

    // Get churned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: churnedThisMonth } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .gte('updated_at', startOfMonth.toISOString());

    // Get active users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', today.toISOString());

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: activeThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', weekAgo.toISOString());

    const { count: activeThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', startOfMonth.toISOString());

    // Generate mock revenue data (replace with actual when you add payments)
    const revenueData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      revenueData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 1000) // Replace with actual revenue
      });
    }

    // Generate hourly activity data
    const activityData = [];
    for (let hour = 0; hour < 24; hour++) {
      activityData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        users: Math.floor(Math.random() * (activeToday || 0))
      });
    }

    // Calculate metrics
    const avgRevenuePerCustomer = 0; // Set your pricing
    const mrr = (totalCustomers || 0) * avgRevenuePerCustomer;
    const arr = mrr * 12;

    // Mock MRR growth (replace with actual calculation)
    const mrrGrowth = customerGrowth;

    const metrics = {
      // Revenue
      mrr,
      arr,
      mrrGrowth,

      // Customers
      totalCustomers: totalCustomers || 0,
      activeTrials: activeTrials || 0,
      churnedThisMonth: churnedThisMonth || 0,
      customerGrowth: parseFloat(customerGrowth.toFixed(1)),

      // Activity
      activeToday: activeToday || 0,
      activeThisWeek: activeThisWeek || 0,
      activeThisMonth: activeThisMonth || 0,

      // Engagement (mock data - implement actual tracking)
      avgSessionDuration: 1800, // 30 minutes in seconds
      featuresUsedPerUser: 5.2,

      // System
      uptime: 99.9,
      apiResponseTime: 120,
      errorRate: 0.01,

      // Chart data
      revenueData,
      customerData: revenueData.map(d => ({ date: d.date, customers: Math.floor(Math.random() * 10) })),
      activityData
    };

    return NextResponse.json({ metrics });

  } catch (error: any) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load metrics' },
      { status: 500 }
    );
  }
}
