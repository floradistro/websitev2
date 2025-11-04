import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get total customers (vendors using WhaleTools)
    const { count: totalCustomers } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get active trials (vendors created in last 30 days without payment)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeTrials } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('is_active', true);

    // Get churned this month (vendors that became inactive this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: churnedThisMonth } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .gte('updated_at', startOfMonth.toISOString());

    // Get active users (users who logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: activeToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', today.toISOString());

    // Get active this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: activeThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', weekAgo.toISOString());

    // Get active this month
    const { count: activeThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', startOfMonth.toISOString());

    // Calculate MRR/ARR
    // TODO: When you add subscription pricing, calculate actual MRR
    // For now, we'll use placeholder logic
    const avgRevenuePerCustomer = 0; // Set your pricing here when ready
    const mrr = (totalCustomers || 0) * avgRevenuePerCustomer;
    const arr = mrr * 12;

    // System health metrics
    const uptime = 99.9; // TODO: Connect to actual monitoring service
    const apiResponseTime = 120; // TODO: Calculate from actual API logs
    const errorRate = 0.01; // TODO: Calculate from error logs

    const metrics = {
      // Revenue
      mrr,
      arr,

      // Customers
      totalCustomers: totalCustomers || 0,
      activeTrials: activeTrials || 0,
      churnedThisMonth: churnedThisMonth || 0,

      // Activity
      activeToday: activeToday || 0,
      activeThisWeek: activeThisWeek || 0,
      activeThisMonth: activeThisMonth || 0,

      // System
      uptime,
      apiResponseTime,
      errorRate
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
