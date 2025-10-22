import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get category pricing assignments for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id is required' },
        { status: 400 }
      );
    }

    // Get all products for the vendor with their categories
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        primary_category:categories!primary_category_id(
          id,
          name
        )
      `)
      .eq('vendor_id', vendorId);

    if (productsError) throw productsError;

    // Get all product pricing assignments for this vendor's products
    const productIds = products?.map(p => p.id) || [];
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('product_pricing_assignments')
      .select(`
        product_id,
        blueprint_id,
        blueprint:pricing_tier_blueprints (
          id,
          name
        )
      `)
      .in('product_id', productIds)
      .eq('is_active', true);

    if (assignmentsError) throw assignmentsError;

    // Group assignments by category
    const categoryAssignments: Record<string, Set<string>> = {};
    
    products?.forEach(product => {
      const categoryName = product.primary_category?.name;
      if (!categoryName) return;
      
      if (!categoryAssignments[categoryName]) {
        categoryAssignments[categoryName] = new Set();
      }
      
      assignments
        ?.filter(a => a.product_id === product.id)
        .forEach(a => {
          if (a.blueprint_id) {
            categoryAssignments[categoryName].add(a.blueprint_id);
          }
        });
    });

    // Convert Sets to arrays for response
    const formattedAssignments = Object.entries(categoryAssignments).map(([category, blueprintIds]) => ({
      category,
      blueprint_ids: Array.from(blueprintIds)
    }));

    return NextResponse.json({
      success: true,
      assignments: formattedAssignments
    });
  } catch (error: any) {
    console.error('Error fetching category pricing assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Assign pricing tier to all products in a category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor_id, category, blueprint_id, assign = true } = body;

    if (!vendor_id || !category || !blueprint_id) {
      return NextResponse.json(
        { success: false, error: 'vendor_id, category, and blueprint_id are required' },
        { status: 400 }
      );
    }

    // Get category ID from name
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', category)
      .single();

    if (categoryError || !categories) {
      return NextResponse.json({
        success: false,
        error: `Category "${category}" not found`
      }, { status: 404 });
    }

    // Get all products in this category for this vendor
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('primary_category_id', categories.id);

    if (productsError) throw productsError;

    const productIds = products?.map(p => p.id) || [];

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found in this category'
      });
    }

    if (assign) {
      // Assign pricing tier to all products in category
      // First, check which products already have this assignment
      const { data: existing, error: existingError } = await supabase
        .from('product_pricing_assignments')
        .select('product_id')
        .in('product_id', productIds)
        .eq('blueprint_id', blueprint_id);

      if (existingError) throw existingError;

      const existingProductIds = existing?.map(e => e.product_id) || [];
      const newProductIds = productIds.filter(id => !existingProductIds.includes(id));

      if (newProductIds.length > 0) {
        const assignments = newProductIds.map(product_id => ({
          product_id,
          blueprint_id,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('product_pricing_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      // Activate any inactive assignments
      if (existingProductIds.length > 0) {
        const { error: updateError } = await supabase
          .from('product_pricing_assignments')
          .update({ is_active: true })
          .in('product_id', existingProductIds)
          .eq('blueprint_id', blueprint_id);

        if (updateError) throw updateError;
      }
    } else {
      // Deactivate pricing tier for all products in category
      const { error: deactivateError } = await supabase
        .from('product_pricing_assignments')
        .update({ is_active: false })
        .in('product_id', productIds)
        .eq('blueprint_id', blueprint_id);

      if (deactivateError) throw deactivateError;
    }

    return NextResponse.json({
      success: true,
      message: `Pricing tier ${assign ? 'assigned to' : 'removed from'} ${productIds.length} products in ${category}`
    });
  } catch (error: any) {
    console.error('Error updating category pricing assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
