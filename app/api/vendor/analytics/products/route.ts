import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vendor/analytics/products
 * Returns product performance analytics
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get product sales data
    const { data: productSales, error: salesError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        line_total,
        orders!inner(order_date, status)
      `)
      .eq('vendor_id', vendorId)
      .eq('orders.status', 'completed')
      .gte('orders.order_date', startDate.toISOString());

    if (salesError) throw salesError;

    // Aggregate by product
    const productMap = new Map();
    
    (productSales || []).forEach((item: any) => {
      const productId = item.product_id;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: item.product_name,
          units_sold: 0,
          revenue: 0,
          orders: 0
        });
      }
      
      const product = productMap.get(productId);
      product.units_sold += parseFloat(item.quantity || '0');
      product.revenue += parseFloat(item.line_total || '0');
      product.orders += 1;
    });

    // Convert to array and sort
    const products = Array.from(productMap.values())
      .map(p => ({
        ...p,
        avgOrderValue: p.orders > 0 ? p.revenue / p.orders : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Get top performers
    const topPerformers = products.slice(0, 10);

    // Get underperformers (products with sales but low revenue)
    const underperformers = products
      .filter(p => p.orders > 0)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5);

    // Get inventory status for these products
    const productIds = [...topPerformers, ...underperformers]
      .map(p => p.product_id)
      .filter(id => id);

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('product_id, quantity, low_stock_threshold')
      .in('product_id', productIds)
      .eq('vendor_id', vendorId);

    // Map inventory to products
    const inventoryMap = new Map();
    (inventoryData || []).forEach(inv => {
      inventoryMap.set(inv.product_id, {
        stock: inv.quantity,
        lowStockThreshold: inv.low_stock_threshold,
        isLowStock: inv.quantity <= (inv.low_stock_threshold || 0)
      });
    });

    // Add inventory info to products
    const enrichProducts = (prods: any[]) => prods.map(p => ({
      ...p,
      inventory: inventoryMap.get(p.product_id) || {
        stock: null,
        lowStockThreshold: null,
        isLowStock: false
      }
    }));

    // Calculate category breakdown (if we have category data)
    const categoryMap = new Map();
    products.forEach(p => {
      // Simplified - would need to join with products table for real categories
      const category = 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, revenue: 0, units: 0 });
      }
      const cat = categoryMap.get(category);
      cat.revenue += p.revenue;
      cat.units += p.units_sold;
    });

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: {
        topPerformers: enrichProducts(topPerformers),
        underperformers: enrichProducts(underperformers),
        categoryBreakdown,
        summary: {
          totalProducts: products.length,
          totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
          totalUnitsSold: products.reduce((sum, p) => sum + p.units_sold, 0),
          avgRevenuePerProduct: products.length > 0 
            ? products.reduce((sum, p) => sum + p.revenue, 0) / products.length 
            : 0
        }
      }
    });

  } catch (error: any) {
    console.error('Vendor product analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}




