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

    console.log('📂 Fetching categories for vendor:', vendorId);

    // Method 1: Fetch categories used by vendor's products (any status)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        product_categories(
          category:categories(name)
        )
      `)
      .eq('vendor_id', vendorId);

    if (productsError) {
      console.error('❌ Error fetching products for categories:', productsError);
    }

    // Extract unique categories from products
    const categorySet = new Set<string>();
    products?.forEach((product: any) => {
      product.product_categories?.forEach((pc: any) => {
        if (pc.category?.name) {
          categorySet.add(pc.category.name);
        }
      });
    });

    console.log('✅ Found categories from products:', [...categorySet]);

    // Method 2: Also fetch ALL active global categories as a fallback
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching all categories:', categoriesError);
    } else {
      console.log('📋 All available categories:', allCategories?.map(c => c.name));

      // Add all global categories to the set (so vendors can see all available categories)
      allCategories?.forEach((cat: any) => {
        if (cat.name) {
          categorySet.add(cat.name);
        }
      });
    }

    const categories = [...categorySet].sort();

    console.log('✅ Returning categories:', categories);

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('❌ Error in categories API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
