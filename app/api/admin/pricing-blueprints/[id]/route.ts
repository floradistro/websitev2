import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// PUT update pricing blueprint
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabase = getServiceSupabase();
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    if (!body.price_breaks || !Array.isArray(body.price_breaks) || body.price_breaks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one price break is required' },
        { status: 400 }
      );
    }
    
    // If this is set as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from('pricing_tier_blueprints')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id);
    }
    
    const { data, error } = await supabase
      .from('pricing_tier_blueprints')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        tier_type: body.tier_type || 'weight',
        price_breaks: body.price_breaks,
        is_active: body.is_active !== false,
        is_default: body.is_default || false,
        display_order: body.display_order || 0,
        applicable_to_categories: body.applicable_to_categories || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      blueprint: data
    });
    
  } catch (error: any) {
    console.error(`❌ Error updating pricing blueprint ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update pricing blueprint' },
      { status: 500 }
    );
  }
}

// DELETE pricing blueprint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getServiceSupabase();
    
    // Check if any vendors are using this blueprint
    const { data: vendorConfigs, error: checkError } = await supabase
      .from('vendor_pricing_configs')
      .select('id')
      .eq('blueprint_id', id)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (vendorConfigs && vendorConfigs.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete: This blueprint is being used by vendors. Deactivate it instead.' 
        },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('pricing_tier_blueprints')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'Pricing blueprint deleted'
    });
    
  } catch (error: any) {
    console.error(`❌ Error deleting pricing blueprint ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete pricing blueprint' },
      { status: 500 }
    );
  }
}

