import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Profit Metrics API
 *
 * Tim Cook: "Show me my actual profit, not just revenue.
 * I want to see gross margin, COGS, and net profit."
 *
 * Returns profit metrics calculated from sales data:
 * - Revenue (gross sales)
 * - COGS (Cost of Goods Sold)
 * - Gross Profit (Revenue - COGS)
 * - Gross Margin % ((Gross Profit / Revenue) * 100)
 * - Operating Expenses (estimated)
 * - Net Profit (Gross Profit - Operating Expenses)
 */

interface ProfitMetrics {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPercent: number;
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Fetch order items with product category info for margin calculation
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        unit_price,
        quantity,
        line_total,
        cost_per_unit,
        product:products!inner (
          primary_category_id,
          category:categories (
            slug
          )
        ),
        order:orders!inner (
          id,
          status,
          created_at
        )
      `)
      .eq('vendor_id', vendorId)
      .gte('order.created_at', startDate)
      .lte('order.created_at', endDate)
      .in('order.status', ['completed', 'fulfilled', 'paid']);

    if (error) {
      console.error('Error fetching order items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    // Calculate revenue
    const revenue = orderItems?.reduce((sum, item) => {
      return sum + parseFloat(item.line_total || '0');
    }, 0) || 0;

    // Calculate COGS using actual cost_per_unit if available,
    // otherwise estimate based on category margins
    let cogs = 0;
    const cogsByCategory: Record<string, { revenue: number; cogs: number }> = {};

    orderItems?.forEach((item: any) => {
      const itemRevenue = parseFloat(item.line_total || '0');
      const quantity = parseFloat(item.quantity || '0');

      // Try to use actual cost_per_unit first
      if (item.cost_per_unit && item.cost_per_unit > 0) {
        const itemCogs = parseFloat(item.cost_per_unit) * quantity;
        cogs += itemCogs;
      } else {
        // Estimate COGS based on industry-standard margins by category
        const categorySlug = item.product?.category?.slug || 'other';

        // Industry standard gross margins for cannabis retail:
        // Flower: 50% margin (cost = 50% of revenue)
        // Concentrates/Vapes: 55% margin (cost = 45% of revenue)
        // Edibles/Beverages: 60% margin (cost = 40% of revenue)
        // Other: 55% margin (cost = 45% of revenue)
        let costPercent = 0.45; // Default 55% margin

        if (categorySlug === 'flower') {
          costPercent = 0.50; // 50% margin
        } else if (['concentrates', 'vapes', 'cartridges'].includes(categorySlug)) {
          costPercent = 0.45; // 55% margin
        } else if (['edibles', 'beverages', 'tinctures'].includes(categorySlug)) {
          costPercent = 0.40; // 60% margin
        }

        const estimatedCogs = itemRevenue * costPercent;
        cogs += estimatedCogs;

        // Track by category for reporting
        if (!cogsByCategory[categorySlug]) {
          cogsByCategory[categorySlug] = { revenue: 0, cogs: 0 };
        }
        cogsByCategory[categorySlug].revenue += itemRevenue;
        cogsByCategory[categorySlug].cogs += estimatedCogs;
      }
    });

    // Calculate gross profit and margin
    const grossProfit = revenue - cogs;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Estimate operating expenses (typically 30-40% of revenue for cannabis retail)
    // This includes: rent, utilities, payroll, insurance, licenses, marketing, etc.
    const operatingExpensePercent = 0.35; // 35% of revenue
    const operatingExpenses = revenue * operatingExpensePercent;

    // Calculate net profit
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const metrics: ProfitMetrics = {
      revenue: Math.round(revenue * 100) / 100,
      cogs: Math.round(cogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      operatingExpenses: Math.round(operatingExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
    };

    // Add category breakdown for transparency
    const categoryBreakdown = Object.entries(cogsByCategory).map(([category, data]) => ({
      category,
      revenue: Math.round(data.revenue * 100) / 100,
      cogs: Math.round(data.cogs * 100) / 100,
      grossProfit: Math.round((data.revenue - data.cogs) * 100) / 100,
      marginPercent: data.revenue > 0 ? Math.round(((data.revenue - data.cogs) / data.revenue) * 1000) / 10 : 0,
    }));

    return NextResponse.json(
      {
        metrics,
        categoryBreakdown,
        metadata: {
          period: { start: startDate, end: endDate },
          orderItemsAnalyzed: orderItems?.length || 0,
          cogsMethod: 'hybrid', // Actual costs when available, estimated by category otherwise
          operatingExpensesNote: 'Estimated at 35% of revenue (industry standard)',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[ERROR] Profit API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
