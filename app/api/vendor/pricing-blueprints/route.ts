/**
 * API: Vendor Pricing Blueprints (Multi-Tenant)
 * GET - Get vendor-specific blueprints only
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

    // Get only vendor-specific templates (renamed from blueprints)
    const { data: templates, error } = await supabase
      .from('pricing_tier_templates')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Transform templates to match old blueprint format for frontend compatibility
    const blueprints = (templates || []).map((template: any) => ({
      ...template,
      // Map default_tiers to price_breaks for frontend
      price_breaks: (template.default_tiers || []).map((tier: any) => ({
        break_id: tier.id,
        label: tier.label,
        qty: tier.quantity,
        unit: tier.unit,
        sort_order: tier.sort_order,
        default_price: tier.default_price, // Include configured price
        price: tier.default_price // Also include as 'price' for compatibility
      })),
      // Map category_id to applicable_to_categories array for frontend
      applicable_to_categories: template.category_id ? [template.category_id] : []
    }));

    return NextResponse.json({
      success: true,
      blueprints: blueprints || [],
      counts: {
        total: blueprints?.length || 0
      }
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
      .from('pricing_tier_templates')
      .select('slug')
      .eq('slug', baseSlug)
      .eq('vendor_id', vendorId)
      .single();

    if (existing) {
      finalSlug = `${baseSlug}-${Date.now()}`;
    }

    // Get next display order for this vendor
    const { data: lastBlueprint } = await supabase
      .from('pricing_tier_templates')
      .select('display_order')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = lastBlueprint ? lastBlueprint.display_order + 1 : 100;

    // Convert price_breaks to default_tiers format (templates store structure, not prices)
    const default_tiers = price_breaks.map((pb: any) => ({
      id: pb.break_id,
      label: pb.label,
      quantity: pb.qty,
      unit: pb.unit,
      default_price: null, // Templates don't store prices
      sort_order: pb.sort_order
    }));

    const { data: blueprint, error } = await supabase
      .from('pricing_tier_templates')
      .insert({
        name,
        slug: finalSlug,
        description: description || null,
        quality_tier: quality_tier || null, // Optional quality level
        default_tiers, // Store tier structure
        category_id: applicable_to_categories && applicable_to_categories.length > 0 ? applicable_to_categories[0] : null, // Single category
        display_order: displayOrder,
        is_active: true,
        vendor_id: vendorId // TRUE MULTI-TENANT: Vendor owns this template
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
      console.error('❌ PUT /api/vendor/pricing-blueprints - No vendor ID in headers');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 PUT /api/vendor/pricing-blueprints - Request body:', JSON.stringify(body, null, 2));

    const { id, name, description, tier_type, quality_tier, price_breaks, applicable_to_categories } = body;

    if (!id) {
      console.error('❌ PUT /api/vendor/pricing-blueprints - No blueprint ID provided');
      return NextResponse.json({ error: 'Blueprint ID is required' }, { status: 400 });
    }

    console.log('🔍 PUT /api/vendor/pricing-blueprints - Updating blueprint:', { id, vendorId, name });

    const supabase = getServiceSupabase();

    // Verify vendor owns this template
    const { data: existing, error: fetchError } = await supabase
      .from('pricing_tier_templates')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching existing blueprint:', fetchError);
      throw fetchError;
    }

    if (existing.vendor_id !== vendorId) {
      console.error('❌ Unauthorized: vendor', vendorId, 'trying to edit blueprint owned by', existing.vendor_id);
      return NextResponse.json(
        { error: 'Not authorized to edit this pricing blueprint' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (quality_tier !== undefined) updateData.quality_tier = quality_tier;
    if (price_breaks) {
      // Convert price_breaks to default_tiers format
      updateData.default_tiers = price_breaks.map((pb: any) => ({
        id: pb.break_id,
        label: pb.label,
        quantity: pb.qty,
        unit: pb.unit,
        default_price: null,
        sort_order: pb.sort_order
      }));
    }
    if (applicable_to_categories !== undefined) {
      updateData.category_id = applicable_to_categories && applicable_to_categories.length > 0 ? applicable_to_categories[0] : null;
    }

    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

    const { data: blueprint, error } = await supabase
      .from('pricing_tier_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }

    console.log('✅ Blueprint updated successfully:', blueprint.id);

    return NextResponse.json({
      success: true,
      blueprint,
      message: 'Pricing blueprint updated successfully'
    });
  } catch (error: any) {
    console.error('❌ PUT /api/vendor/pricing-blueprints - Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
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

    // Verify vendor owns this template
    const { data: existing, error: fetchError } = await supabase
      .from('pricing_tier_templates')
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

    // Check if template is being used by any products (check pricing_data for template_id)
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId)
      .contains('pricing_data', { template_id: blueprintId })
      .limit(1);

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pricing template that is in use by products' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active = false
    const { error } = await supabase
      .from('pricing_tier_templates')
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
