import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - Vendor profit statistics
 * Returns margin analysis, inventory value, and profitability metrics
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch all products with cost tracking
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, cost_price, regular_price, price, stock_quantity, margin_percentage')
      .eq('vendor_id', vendorId)
      .not('cost_price', 'is', null)
      .gt('cost_price', 0);

    if (error) {
      console.error('Error fetching products for profit stats:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          total_products_with_cost: 0,
          average_margin: 0,
          total_inventory_cost: 0,
          total_potential_profit: 0,
          low_margin_products: 0,
          high_margin_products: 0
        }
      });
    }

    // Calculate statistics
    let totalMargin = 0;
    let totalInventoryCost = 0;
    let totalPotentialProfit = 0;
    let lowMarginCount = 0;
    let highMarginCount = 0;

    products.forEach(product => {
      const costPrice = product.cost_price || 0;
      const sellingPrice = product.price || product.regular_price || 0;
      const stock = product.stock_quantity || 0;
      
      // Calculate margin
      let margin = 0;
      if (costPrice > 0 && sellingPrice > 0) {
        margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
      }
      
      totalMargin += margin;
      
      // Count margin categories
      if (margin < 25) lowMarginCount++;
      if (margin >= 40) highMarginCount++;
      
      // Calculate values
      const inventoryCost = costPrice * stock;
      const potentialProfit = (sellingPrice - costPrice) * stock;
      
      totalInventoryCost += inventoryCost;
      totalPotentialProfit += potentialProfit;
    });

    const averageMargin = products.length > 0 ? totalMargin / products.length : 0;

    const stats = {
      total_products_with_cost: products.length,
      average_margin: Math.round(averageMargin * 10) / 10, // Round to 1 decimal
      total_inventory_cost: Math.round(totalInventoryCost * 100) / 100,
      total_potential_profit: Math.round(totalPotentialProfit * 100) / 100,
      low_margin_products: lowMarginCount,
      high_margin_products: highMarginCount
    };

    console.log('✅ Profit stats calculated for vendor:', vendorId, stats);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ Profit stats error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch profit stats'
    }, { status: 500 });
  }
}





