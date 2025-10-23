import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// GET all pricing blueprints
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    const { data: blueprints, error } = await supabase
      .from('pricing_tier_blueprints')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      blueprints: blueprints || []
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching pricing blueprints:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pricing blueprints' },
      { status: 500 }
    );
  }
}

// POST create new pricing blueprint
export async function POST(request: NextRequest) {
  try {
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
        .eq('is_default', true);
    }
    
    const { data, error } = await supabase
      .from('pricing_tier_blueprints')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        tier_type: body.tier_type || 'weight',
        price_breaks: body.price_breaks,
        is_active: body.is_active !== false,
        is_default: body.is_default || false,
        display_order: body.display_order || 0,
        applicable_to_categories: body.applicable_to_categories || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      blueprint: data
    });
    
  } catch (error: any) {
    console.error('❌ Error creating pricing blueprint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create pricing blueprint' },
      { status: 500 }
    );
  }
}
