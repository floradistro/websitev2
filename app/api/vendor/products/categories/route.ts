import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    console.log('📂 Fetching categories for vendor:', vendorId);

    // Method 1: Fetch categories used by vendor's products (any status)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        primary_category:categories!primary_category_id(name)
      `)
      .eq('vendor_id', vendorId);

    if (productsError) {
      console.error('❌ Error fetching products for categories:', productsError);
    }

    // Extract unique categories from products
    const categorySet = new Set<string>();
    products?.forEach((product: any) => {
      if (product.primary_category?.name) {
        categorySet.add(product.primary_category.name);
      }
    });

    console.log('✅ Found categories from products:', [...categorySet]);

    // Method 2: Also fetch ALL vendor-specific categories (not just used ones)
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching vendor categories:', categoriesError);
    } else {
      console.log('📋 Vendor-specific categories:', allCategories?.map(c => c.name));

      // Add all vendor categories to the set (so all available categories show up)
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
