import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PUT - Update specific vendor pricing configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: configId } = await params;
    const body = await request.json();
    const { pricing_values, custom_price_breaks, display_unit, is_active, notes } = body;

    console.log('💰 PUT /api/vendor/pricing-config/[id]');
    console.log('  - configId:', configId);
    console.log('  - pricing_values:', JSON.stringify(pricing_values));
    console.log('  - display_unit:', display_unit);
    console.log('  - custom_price_breaks:', custom_price_breaks);

    // Build update object
    const updateData: any = {};
    if (pricing_values !== undefined) updateData.pricing_values = pricing_values;
    if (custom_price_breaks !== undefined) updateData.custom_price_breaks = custom_price_breaks;
    if (display_unit !== undefined) updateData.display_unit = display_unit;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    console.log('  - updateData to send:', JSON.stringify(updateData));

    const { data, error } = await supabase
      .from('vendor_pricing_configs')
      .update(updateData)
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating pricing config:', error);
      throw error;
    }

    console.log('✅ Pricing config updated:', configId);
    console.log('  - Returned data:', JSON.stringify(data));
    console.log('  - pricing_values field:', JSON.stringify(data?.pricing_values));

    return NextResponse.json({
      success: true,
      config: data
    });
  } catch (error: any) {
    console.error('❌ Error in PUT /api/vendor/pricing-config/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pricing config' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete specific vendor pricing configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: configId } = await params;

    const { error } = await supabase
      .from('vendor_pricing_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('❌ Error deleting pricing config:', error);
      throw error;
    }

    console.log('✅ Pricing config deleted:', configId);

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration deleted'
    });
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/vendor/pricing-config/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete pricing config' },
      { status: 500 }
    );
  }
}

