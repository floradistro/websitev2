/**
 * API: Vendor Pricing Blueprints (Multi-Tenant)
 * GET - Get global blueprints + vendor-specific blueprints
 * POST - Create vendor-specific pricing blueprint
 * PUT - Update vendor-specific pricing blueprint
 * DELETE - Delete vendor-specific pricing blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // TRUE MULTI-TENANT: Return global blueprints (vendor_id IS NULL) + vendor-specific blueprints
    const { data: blueprints, error } = await supabase
      .from('pricing_tier_blueprints')
      .select('*')
      .or(`vendor_id.is.null,vendor_id.eq.${vendorId}`)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blueprints: blueprints || [],
      global_count: blueprints?.filter(b => !b.vendor_id).length || 0,
      custom_count: blueprints?.filter(b => b.vendor_id === vendorId).length || 0
    });
  } catch (error: any) {
    console.error('Get pricing blueprints error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pricing blueprints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      tier_type, // Pricing calculation method: weight, quantity, percentage, flat, custom
      quality_tier, // Quality level: exotic, top-shelf, mid-shelf, value
      context,
      price_breaks,
      applicable_to_categories
    } = body;

    if (!name || !context || !price_breaks) {
      return NextResponse.json(
        { error: 'Name, context, and price_breaks are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Create unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let finalSlug = baseSlug;
    const { data: existing } = await supabase
      .from('pricing_tier_blueprints')
      .select('slug')
      .eq('slug', baseSlug)
      .or(`vendor_id.is.null,vendor_id.eq.${vendorId}`)
      .single();

    if (existing) {
      finalSlug = `${baseSlug}-${Date.now()}`;
    }

    // Get next display order for this vendor
    const { data: lastBlueprint } = await supabase
      .from('pricing_tier_blueprints')
      .select('display_order')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = lastBlueprint ? lastBlueprint.display_order + 1 : 100;

    const { data: blueprint, error } = await supabase
      .from('pricing_tier_blueprints')
      .insert({
        name,
        slug: finalSlug,
        description: description || null,
        tier_type: tier_type || 'weight', // Default to weight-based pricing
        quality_tier: quality_tier || null, // Optional quality level
        context,
        price_breaks,
        applicable_to_categories: applicable_to_categories || [],
        display_order: displayOrder,
        is_active: true,
        vendor_id: vendorId // TRUE MULTI-TENANT: Vendor owns this blueprint
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Custom pricing blueprint created:', blueprint.name, 'for vendor:', vendorId);

    return NextResponse.json({
      success: true,
      blueprint,
      message: 'Custom pricing blueprint created successfully'
    });
  } catch (error: any) {
    console.error('Create pricing blueprint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pricing blueprint' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, tier_type, quality_tier, price_breaks, applicable_to_categories } = body;

    if (!id) {
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify vendor owns this blueprint
    const { data: existing, error: fetchError } = await supabase
      .from('pricing_tier_blueprints')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this pricing blueprint' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tier_type) updateData.tier_type = tier_type;
    if (quality_tier !== undefined) updateData.quality_tier = quality_tier;
    if (price_breaks) updateData.price_breaks = price_breaks;
    if (applicable_to_categories !== undefined) updateData.applicable_to_categories = applicable_to_categories;

    const { data: blueprint, error } = await supabase
      .from('pricing_tier_blueprints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blueprint,
      message: 'Pricing blueprint updated successfully'
    });
  } catch (error: any) {
    console.error('Update pricing blueprint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pricing blueprint' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('id');

    if (!blueprintId) {
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify vendor owns this blueprint
    const { data: existing, error: fetchError } = await supabase
      .from('pricing_tier_blueprints')
      .select('vendor_id')
      .eq('id', blueprintId)
      .single();

    if (fetchError) throw fetchError;

    if (existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this pricing blueprint' },
        { status: 403 }
      );
    }

    // Check if blueprint is being used by any vendor configs
    const { data: configs } = await supabase
      .from('vendor_pricing_configs')
      .select('id')
      .eq('blueprint_id', blueprintId)
      .limit(1);

    if (configs && configs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pricing blueprint that is in use' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active = false
    const { error } = await supabase
      .from('pricing_tier_blueprints')
      .update({ is_active: false })
      .eq('id', blueprintId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Pricing blueprint deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete pricing blueprint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pricing blueprint' },
      { status: 500 }
    );
  }
}
