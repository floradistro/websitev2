import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * AI Insights API
 *
 * Tim Cook: "I want Claude to analyze my business data and tell me what I should focus on.
 * Show me trends, opportunities, and potential issues before they become problems."
 *
 * Uses Claude to analyze analytics data and provide intelligent business insights:
 * - Revenue trends and patterns
 * - Customer behavior analysis
 * - Product performance insights
 * - Profit optimization opportunities
 * - Risk alerts and anomalies
 * - Actionable recommendations
 */

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'neutral';
    percentChange: number;
  };
  orders: {
    current: number;
    previous: number;
    avgOrderValue: number;
  };
  customers: {
    current: number;
    previous: number;
    newCustomerRate: number;
  };
  profit: {
    grossProfit: number;
    grossMarginPercent: number;
    netProfit: number;
    netMarginPercent: number;
  };
  categoryPerformance: Array<{
    category: string;
    revenue: number;
    items: number;
    avgPrice: number;
    margin: number;
  }>;
  topProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
}

interface AIInsight {
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action?: string;
}

async function fetchAnalyticsData(
  vendorId: string,
  startDate: string,
  endDate: string,
  comparisonStartDate: string,
  comparisonEndDate: string,
): Promise<AnalyticsData> {
  // Fetch current period metrics
  const { data: currentOrders } = await supabase
    .from('orders')
    .select('id, total, customer_id, created_at')
    .eq('vendor_id', vendorId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .in('status', ['completed', 'fulfilled', 'paid']);

  // Fetch comparison period metrics
  const { data: previousOrders } = await supabase
    .from('orders')
    .select('id, total, customer_id')
    .eq('vendor_id', vendorId)
    .gte('created_at', comparisonStartDate)
    .lte('created_at', comparisonEndDate)
    .in('status', ['completed', 'fulfilled', 'paid']);

  // Fetch order items for detailed analysis
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      unit_price,
      quantity,
      line_total,
      product:products!inner (
        primary_category_id,
        category:categories (
          slug,
          name
        )
      )
    `)
    .eq('vendor_id', vendorId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Calculate metrics
  const currentRevenue = currentOrders?.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0) || 0;
  const previousRevenue = previousOrders?.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0) || 0;
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  const currentCustomers = new Set(currentOrders?.map(o => o.customer_id)).size;
  const previousCustomers = new Set(previousOrders?.map(o => o.customer_id)).size;

  const avgOrderValue = currentOrders && currentOrders.length > 0
    ? currentRevenue / currentOrders.length
    : 0;

  // Calculate profit metrics
  let totalCogs = 0;
  const categoryStats: Record<string, { revenue: number; items: number; cogs: number }> = {};

  orderItems?.forEach((item: any) => {
    const revenue = parseFloat(item.line_total || '0');
    const categorySlug = item.product?.category?.slug || 'other';
    const categoryName = item.product?.category?.name || 'Other';

    // Apply category-based margins
    let costPercent = 0.45;
    if (categorySlug === 'flower') costPercent = 0.50;
    else if (['concentrates', 'vapes', 'cartridges'].includes(categorySlug)) costPercent = 0.45;
    else if (['edibles', 'beverages', 'tinctures'].includes(categorySlug)) costPercent = 0.40;

    const itemCogs = revenue * costPercent;
    totalCogs += itemCogs;

    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { revenue: 0, items: 0, cogs: 0 };
    }
    categoryStats[categoryName].revenue += revenue;
    categoryStats[categoryName].items += 1;
    categoryStats[categoryName].cogs += itemCogs;
  });

  const grossProfit = currentRevenue - totalCogs;
  const grossMarginPercent = currentRevenue > 0 ? (grossProfit / currentRevenue) * 100 : 0;
  const operatingExpenses = currentRevenue * 0.35;
  const netProfit = grossProfit - operatingExpenses;
  const netMarginPercent = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0;

  // Get top products
  const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {};
  orderItems?.forEach((item: any) => {
    const id = item.product_id;
    if (!productRevenue[id]) {
      productRevenue[id] = {
        name: item.product_name,
        revenue: 0,
        quantity: 0,
      };
    }
    productRevenue[id].revenue += parseFloat(item.line_total || '0');
    productRevenue[id].quantity += parseFloat(item.quantity || '0');
  });

  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Category performance
  const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    revenue: stats.revenue,
    items: stats.items,
    avgPrice: stats.items > 0 ? stats.revenue / stats.items : 0,
    margin: stats.revenue > 0 ? ((stats.revenue - stats.cogs) / stats.revenue) * 100 : 0,
  }));

  return {
    revenue: {
      current: currentRevenue,
      previous: previousRevenue,
      trend: revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'neutral',
      percentChange: revenueChange,
    },
    orders: {
      current: currentOrders?.length || 0,
      previous: previousOrders?.length || 0,
      avgOrderValue,
    },
    customers: {
      current: currentCustomers,
      previous: previousCustomers,
      newCustomerRate: currentCustomers > 0 && previousCustomers > 0
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
        : 0,
    },
    profit: {
      grossProfit,
      grossMarginPercent,
      netProfit,
      netMarginPercent,
    },
    categoryPerformance: categoryPerformance.sort((a, b) => b.revenue - a.revenue),
    topProducts,
  };
}

async function generateInsights(data: AnalyticsData): Promise<AIInsight[]> {
  const prompt = `You are a cannabis retail business analyst. Analyze the following business metrics and provide 4-6 key insights.

**Business Metrics:**

Revenue:
- Current Period: $${data.revenue.current.toFixed(2)}
- Previous Period: $${data.revenue.previous.toFixed(2)}
- Change: ${data.revenue.percentChange > 0 ? '+' : ''}${data.revenue.percentChange.toFixed(1)}%

Orders:
- Current: ${data.orders.current} orders
- Previous: ${data.orders.previous} orders
- Avg Order Value: $${data.orders.avgOrderValue.toFixed(2)}

Customers:
- Current: ${data.customers.current}
- Previous: ${data.customers.previous}
- New Customer Rate: ${data.customers.newCustomerRate > 0 ? '+' : ''}${data.customers.newCustomerRate.toFixed(1)}%

Profitability:
- Gross Profit: $${data.profit.grossProfit.toFixed(2)} (${data.profit.grossMarginPercent.toFixed(1)}% margin)
- Net Profit: $${data.profit.netProfit.toFixed(2)} (${data.profit.netMarginPercent.toFixed(1)}% margin)

Top Categories by Revenue:
${data.categoryPerformance.slice(0, 5).map(c =>
  `- ${c.category}: $${c.revenue.toFixed(2)} (${c.items} items, ${c.margin.toFixed(1)}% margin)`
).join('\n')}

Top Products:
${data.topProducts.slice(0, 5).map(p =>
  `- ${p.name}: $${p.revenue.toFixed(2)} (${p.quantity} sold)`
).join('\n')}

**Your Task:**
Provide 4-6 actionable business insights in JSON format. Each insight should follow this structure:

{
  "type": "trend" | "opportunity" | "alert" | "recommendation",
  "priority": "high" | "medium" | "low",
  "title": "Brief title (5-8 words)",
  "description": "Clear explanation of the insight (20-40 words)",
  "impact": "Business impact or significance (10-20 words)",
  "action": "Specific action to take (optional, 10-20 words)"
}

Focus on:
1. Revenue trends and growth opportunities
2. Customer behavior patterns
3. Product/category performance
4. Profit optimization
5. Potential risks or concerns
6. Competitive advantages

Return ONLY a valid JSON array of insights, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const insights = JSON.parse(content.text);
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);

    // Fallback insights if AI fails
    return [
      {
        type: 'trend',
        priority: 'high',
        title: data.revenue.trend === 'up' ? 'Revenue Growing Strong' : 'Revenue Declining',
        description: `Revenue is ${data.revenue.trend === 'up' ? 'up' : 'down'} ${Math.abs(data.revenue.percentChange).toFixed(1)}% compared to the previous period.`,
        impact: data.revenue.trend === 'up'
          ? 'Positive momentum indicates successful business strategies.'
          : 'Declining revenue requires immediate attention and strategy adjustment.',
        action: data.revenue.trend === 'up'
          ? 'Continue current strategies and explore expansion opportunities.'
          : 'Analyze factors contributing to decline and implement corrective measures.',
      },
      {
        type: 'opportunity',
        priority: 'medium',
        title: 'Top Category Performance',
        description: `${data.categoryPerformance[0]?.category || 'Top category'} generates the most revenue with ${data.categoryPerformance[0]?.margin.toFixed(1)}% margin.`,
        impact: 'Strong category performance provides foundation for growth.',
        action: 'Expand inventory in high-performing categories to maximize revenue.',
      },
    ];
  }
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
    const comparisonType = searchParams.get('comparison_type') || 'previous_period';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Calculate comparison period dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();

    let comparisonStart: Date;
    let comparisonEnd: Date;

    if (comparisonType === 'week_over_week') {
      comparisonStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      comparisonEnd = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (comparisonType === 'month_over_month') {
      comparisonStart = new Date(start);
      comparisonStart.setMonth(comparisonStart.getMonth() - 1);
      comparisonEnd = new Date(end);
      comparisonEnd.setMonth(comparisonEnd.getMonth() - 1);
    } else {
      // Previous period (default)
      comparisonStart = new Date(start.getTime() - duration);
      comparisonEnd = new Date(start.getTime() - 1);
    }

    // Fetch all analytics data
    const analyticsData = await fetchAnalyticsData(
      vendorId,
      startDate,
      endDate,
      comparisonStart.toISOString(),
      comparisonEnd.toISOString(),
    );

    // Generate AI insights
    const insights = await generateInsights(analyticsData);

    return NextResponse.json(
      {
        insights,
        metadata: {
          period: { start: startDate, end: endDate },
          comparisonPeriod: {
            start: comparisonStart.toISOString(),
            end: comparisonEnd.toISOString(),
          },
          generatedAt: new Date().toISOString(),
          dataPoints: {
            revenue: analyticsData.revenue.current,
            orders: analyticsData.orders.current,
            customers: analyticsData.customers.current,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[ERROR] AI Insights API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
