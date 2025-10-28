import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔵 Auto-assigning default pricing blueprints...');

    const supabase = getServiceSupabase();

    // 1. Get the default pricing blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from('pricing_tier_blueprints')
      .select('id, name, slug')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json({
        success: false,
        error: 'No default pricing blueprint found'
      }, { status: 404 });
    }

    console.log(`✅ Using blueprint: "${blueprint.name}"`);

    // 2. Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, vendor_id, status');

    if (productsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch products'
      }, { status: 500 });
    }

    console.log(`📦 Found ${products?.length || 0} products`);

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products to assign',
        assigned: 0
      });
    }

    // 3. Check which products already have assignments
    const { data: existingAssignments } = await supabase
      .from('product_pricing_assignments')
      .select('product_id')
      .in('product_id', products.map(p => p.id));

    const assignedProductIds = new Set((existingAssignments || []).map((a: any) => a.product_id));
    const productsWithoutAssignments = products.filter(p => !assignedProductIds.has(p.id));

    console.log(`✅ ${assignedProductIds.size} products already assigned`);
    console.log(`🔄 ${productsWithoutAssignments.length} products need assignment`);

    if (productsWithoutAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All products already have pricing assignments',
        assigned: 0,
        total: products.length
      });
    }

    // 4. Create assignments for products without them
    const assignments = productsWithoutAssignments.map(product => ({
      product_id: product.id,
      blueprint_id: blueprint.id,
      price_overrides: {},
      is_active: true
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('product_pricing_assignments')
      .insert(assignments)
      .select();

    if (insertError) {
      console.error('❌ Error creating assignments:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create assignments',
        details: insertError.message
      }, { status: 500 });
    }

    console.log(`✅ Created ${inserted?.length || 0} pricing assignments`);

    return NextResponse.json({
      success: true,
      message: 'Pricing blueprints assigned successfully',
      assigned: inserted?.length || 0,
      total: products.length,
      blueprint: {
        name: blueprint.name,
        slug: blueprint.slug
      }
    });

  } catch (error: any) {
    console.error('❌ Assignment error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
