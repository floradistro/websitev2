import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch all published products with their categories via relation
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        product_categories(
          category:categories(name)
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching products for categories:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Extract unique categories from the nested structure
    const categorySet = new Set<string>();
    products?.forEach((product: any) => {
      product.product_categories?.forEach((pc: any) => {
        if (pc.category?.name) {
          categorySet.add(pc.category.name);
        }
      });
    });

    const categories = [...categorySet].sort();

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
