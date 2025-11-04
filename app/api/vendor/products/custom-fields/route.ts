import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET - Get all unique custom field names from vendor's products
 */
export async function GET(request: NextRequest) {
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get all products with custom_fields
    const { data: products, error } = await supabase
      .from('products')
      .select('custom_fields')
      .eq('vendor_id', vendorId)
      .not('custom_fields', 'is', null);

    if (error) {
      console.error('Error fetching products for custom fields:', error);
      throw error;
    }

    // Extract all unique custom field keys
    const fieldSet = new Set<string>();

    products?.forEach((product: any) => {
      if (product.custom_fields && typeof product.custom_fields === 'object') {
        Object.keys(product.custom_fields).forEach(key => {
          fieldSet.add(key);
        });
      }
    });

    const customFields = Array.from(fieldSet).sort();

    return NextResponse.json({
      success: true,
      customFields
    });

  } catch (error: any) {
    console.error('Custom fields API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch custom fields' },
      { status: 500 }
    );
  }
}
