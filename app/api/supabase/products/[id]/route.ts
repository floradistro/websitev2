import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        primary_category:categories!primary_category_id(id, name, slug, description),
        vendor:vendors(id, store_name, slug, email, phone),
        product_categories(
          category:categories(id, name, slug)
        ),
        product_tag_relationships(
          tag:product_tags(id, name, slug)
        ),
        product_variations(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Flatten the data structure for easier use
    const product = {
      ...data,
      categories: data.product_categories?.map((pc: any) => pc.category) || [],
      tags: data.product_tag_relationships?.map((ptr: any) => ptr.tag) || [],
      variations: data.product_variations || []
    };
    
    // Remove the nested arrays
    delete product.product_categories;
    delete product.product_tag_relationships;
    delete product.product_variations;
    
    return NextResponse.json({
      success: true,
      product
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this product
    const { data: existing } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
    }
    
    // Build update object
    const updates: any = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.short_description !== undefined) updates.short_description = body.short_description;
    if (body.sku !== undefined) updates.sku = body.sku;
    if (body.type !== undefined) updates.type = body.type;
    if (body.status !== undefined) updates.status = body.status;
    if (body.regular_price !== undefined) updates.regular_price = parseFloat(body.regular_price);
    if (body.sale_price !== undefined) updates.sale_price = body.sale_price ? parseFloat(body.sale_price) : null;
    if (body.featured_image !== undefined) updates.featured_image = body.featured_image;
    if (body.image_gallery !== undefined) updates.image_gallery = body.image_gallery;
    if (body.attributes !== undefined) updates.attributes = body.attributes;
    if (body.blueprint_fields !== undefined) updates.blueprint_fields = body.blueprint_fields;
    if (body.manage_stock !== undefined) updates.manage_stock = body.manage_stock;
    if (body.stock_quantity !== undefined) updates.stock_quantity = parseFloat(body.stock_quantity);
    if (body.stock_status !== undefined) updates.stock_status = body.stock_status;
    if (body.weight !== undefined) updates.weight = body.weight ? parseFloat(body.weight) : null;
    if (body.featured !== undefined) updates.featured = body.featured;
    if (body.meta_data !== undefined) updates.meta_data = body.meta_data;
    
    // Update product
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Update categories if provided
    if (body.category_ids) {
      // Delete existing
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', id);
      
      // Insert new
      if (body.category_ids.length > 0) {
        const categoryLinks = body.category_ids.map((catId: string, index: number) => ({
          product_id: id,
          category_id: catId,
          is_primary: index === 0
        }));
        
        await supabase
          .from('product_categories')
          .insert(categoryLinks);
      }
    }
    
    return NextResponse.json({
      success: true,
      product: updated
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this product
    const { data: existing } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
    }
    
    // Delete product (cascades to categories, tags, etc.)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted'
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

