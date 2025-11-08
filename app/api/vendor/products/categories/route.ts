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

    // PERFORMANCE FIX: Fetch ONLY vendor categories (active ones) in a single query
    // No need to scan all products - categories table is the source of truth
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching vendor categories:', categoriesError);
      return NextResponse.json(
        { success: false, error: categoriesError.message },
        { status: 500 }
      );
    }

    const categories = (allCategories || []).map(c => c.name).filter(Boolean);

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
