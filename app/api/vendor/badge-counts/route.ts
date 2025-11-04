import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Missing vendorId' }, { status: 400 });
    }

    const supabase = await createClient();

    // Count pending orders
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .in('status', ['pending', 'processing', 'ready']);

    // Count products with incomplete data (missing name or price)
    const { count: incompleteProductsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .or('name.is.null,regular_price.is.null');

    if (productsError) {
      console.error('Products count error:', productsError);
    }

    const badgeCounts = {
      orders: ordersCount || 0,
      products: incompleteProductsCount || 0,
    };

    return NextResponse.json({ success: true, badgeCounts });
  } catch (error) {
    console.error('Badge counts error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch badge counts' }, { status: 500 });
  }
}
