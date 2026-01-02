import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Comparison Mode API
 *
 * Tim Cook: "I want to compare this week vs last week,
 * this month vs last month. Show me year-over-year growth."
 *
 * Returns comparison data for two periods:
 * - Current period
 * - Comparison period (previous period, same period last year, or custom)
 */

interface ComparisonMetrics {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface ComparisonPeriod {
  start: Date;
  end: Date;
  label: string;
}

interface ComparisonResponse {
  current: {
    period: ComparisonPeriod;
    metrics: ComparisonMetrics;
  };
  comparison: {
    period: ComparisonPeriod;
    metrics: ComparisonMetrics;
  };
  changes: {
    revenue: { value: number; percent: number };
    orders: { value: number; percent: number };
    customers: { value: number; percent: number };
    avgOrderValue: { value: number; percent: number };
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const currentStart = searchParams.get('current_start');
    const currentEnd = searchParams.get('current_end');
    const comparisonType = searchParams.get('comparison_type') || 'previous_period';
    const comparisonStart = searchParams.get('comparison_start'); // For custom
    const comparisonEnd = searchParams.get('comparison_end'); // For custom

    if (!currentStart || !currentEnd) {
      return NextResponse.json(
        { error: 'current_start and current_end are required' },
        { status: 400 }
      );
    }

    // Parse current period
    const currentStartDate = new Date(currentStart);
    const currentEndDate = new Date(currentEnd);
    const currentDays = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate comparison period
    let comparisonStartDate: Date;
    let comparisonEndDate: Date;
    let comparisonLabel: string;

    if (comparisonType === 'previous_period') {
      // Previous period (same length)
      comparisonEndDate = new Date(currentStartDate);
      comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
      comparisonStartDate = new Date(comparisonEndDate);
      comparisonStartDate.setDate(comparisonStartDate.getDate() - currentDays + 1);
      comparisonLabel = 'Previous Period';
    } else if (comparisonType === 'day_over_day') {
      // Yesterday
      comparisonStartDate = new Date(currentStartDate);
      comparisonStartDate.setDate(comparisonStartDate.getDate() - 1);
      comparisonEndDate = new Date(currentEndDate);
      comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
      comparisonLabel = 'Yesterday';
    } else if (comparisonType === 'week_over_week') {
      // Last week (7 days ago)
      comparisonStartDate = new Date(currentStartDate);
      comparisonStartDate.setDate(comparisonStartDate.getDate() - 7);
      comparisonEndDate = new Date(currentEndDate);
      comparisonEndDate.setDate(comparisonEndDate.getDate() - 7);
      comparisonLabel = 'Last Week';
    } else if (comparisonType === 'month_over_month') {
      // Last month
      comparisonStartDate = new Date(currentStartDate);
      comparisonStartDate.setMonth(comparisonStartDate.getMonth() - 1);
      comparisonEndDate = new Date(currentEndDate);
      comparisonEndDate.setMonth(comparisonEndDate.getMonth() - 1);
      comparisonLabel = 'Last Month';
    } else if (comparisonType === 'quarter_over_quarter') {
      // Last quarter (3 months ago)
      comparisonStartDate = new Date(currentStartDate);
      comparisonStartDate.setMonth(comparisonStartDate.getMonth() - 3);
      comparisonEndDate = new Date(currentEndDate);
      comparisonEndDate.setMonth(comparisonEndDate.getMonth() - 3);
      comparisonLabel = 'Last Quarter';
    } else if (comparisonType === 'same_period_last_year') {
      // Same period last year
      comparisonStartDate = new Date(currentStartDate);
      comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1);
      comparisonEndDate = new Date(currentEndDate);
      comparisonEndDate.setFullYear(comparisonEndDate.getFullYear() - 1);
      comparisonLabel = 'Same Period Last Year';
    } else if (comparisonType === 'custom' && comparisonStart && comparisonEnd) {
      // Custom period
      comparisonStartDate = new Date(comparisonStart);
      comparisonEndDate = new Date(comparisonEnd);
      comparisonLabel = 'Custom Period';
    } else {
      return NextResponse.json(
        { error: 'Invalid comparison_type or missing custom dates' },
        { status: 400 }
      );
    }

    // Fetch current period data
    const { data: currentData, error: currentError } = await supabase
      .from('orders')
      .select('total_amount, customer_id, status')
      .eq('vendor_id', vendorId)
      .gte('created_at', currentStartDate.toISOString())
      .lte('created_at', currentEndDate.toISOString())
      .in('status', ['completed', 'fulfilled', 'paid']);

    if (currentError) {
      console.error('Error fetching current period data:', currentError);
      return NextResponse.json(
        { error: 'Failed to fetch current period data' },
        { status: 500 }
      );
    }

    // Fetch comparison period data
    const { data: comparisonData, error: comparisonError } = await supabase
      .from('orders')
      .select('total_amount, customer_id, status')
      .eq('vendor_id', vendorId)
      .gte('created_at', comparisonStartDate.toISOString())
      .lte('created_at', comparisonEndDate.toISOString())
      .in('status', ['completed', 'fulfilled', 'paid']);

    if (comparisonError) {
      console.error('Error fetching comparison period data:', comparisonError);
      return NextResponse.json(
        { error: 'Failed to fetch comparison period data' },
        { status: 500 }
      );
    }

    // Calculate metrics for current period
    const currentRevenue = currentData?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;
    const currentOrders = currentData?.length || 0;
    const currentCustomers = new Set(currentData?.map(order => order.customer_id).filter(Boolean)).size;
    const currentAvgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    // Calculate metrics for comparison period
    const comparisonRevenue = comparisonData?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;
    const comparisonOrders = comparisonData?.length || 0;
    const comparisonCustomers = new Set(comparisonData?.map(order => order.customer_id).filter(Boolean)).size;
    const comparisonAvgOrderValue = comparisonOrders > 0 ? comparisonRevenue / comparisonOrders : 0;

    // Calculate changes
    const calculateChange = (current: number, previous: number) => {
      const value = current - previous;
      const percent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      return { value, percent };
    };

    const response: ComparisonResponse = {
      current: {
        period: {
          start: currentStartDate,
          end: currentEndDate,
          label: 'Current Period',
        },
        metrics: {
          revenue: currentRevenue,
          orders: currentOrders,
          customers: currentCustomers,
          avgOrderValue: currentAvgOrderValue,
        },
      },
      comparison: {
        period: {
          start: comparisonStartDate,
          end: comparisonEndDate,
          label: comparisonLabel,
        },
        metrics: {
          revenue: comparisonRevenue,
          orders: comparisonOrders,
          customers: comparisonCustomers,
          avgOrderValue: comparisonAvgOrderValue,
        },
      },
      changes: {
        revenue: calculateChange(currentRevenue, comparisonRevenue),
        orders: calculateChange(currentOrders, comparisonOrders),
        customers: calculateChange(currentCustomers, comparisonCustomers),
        avgOrderValue: calculateChange(currentAvgOrderValue, comparisonAvgOrderValue),
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[ERROR] Comparison API error:', error);
    console.error('[ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
