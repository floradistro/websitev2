import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all pricing blueprints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('pricing_tier_blueprints')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blueprints: data || []
    });
  } catch (error: any) {
    console.error('Error fetching pricing blueprints:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new pricing blueprint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      tier_type = 'weight',
      price_breaks,
      is_active = true,
      is_default = false,
      display_order = 0,
      applicable_to_categories = []
    } = body;

    if (!name || !slug || !price_breaks) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and price_breaks are required' },
        { status: 400 }
      );
    }

    // Validate price_breaks structure
    if (!Array.isArray(price_breaks)) {
      return NextResponse.json(
        { success: false, error: 'price_breaks must be an array' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pricing_tier_blueprints')
      .insert({
        name,
        slug,
        description,
        tier_type,
        price_breaks,
        is_active,
        is_default,
        display_order,
        applicable_to_categories
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blueprint: data
    });
  } catch (error: any) {
    console.error('Error creating pricing blueprint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update pricing blueprint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Blueprint ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pricing_tier_blueprints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blueprint: data
    });
  } catch (error: any) {
    console.error('Error updating pricing blueprint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing blueprint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Blueprint ID is required' },
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
      message: 'Pricing blueprint deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting pricing blueprint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

