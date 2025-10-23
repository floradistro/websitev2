import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * PUT - Update vendor product
 * Handles cost_price and dual unit system
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const updateData = await request.json();
    const supabase = getServiceSupabase();

    // Verify this product belongs to this vendor
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, vendor_id, name')
      .eq('id', productId)
      .eq('vendor_id', vendorId)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Product not found or access denied'
      }, { status: 404 });
    }

    console.log('🔵 Updating product:', existingProduct.name);

    // Prepare update payload
    const productUpdate: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (updateData.name !== undefined) productUpdate.name = updateData.name;
    if (updateData.description !== undefined) productUpdate.description = updateData.description;
    if (updateData.price !== undefined) productUpdate.regular_price = updateData.price ? parseFloat(updateData.price) : null;
    if (updateData.cost_price !== undefined) productUpdate.cost_price = updateData.cost_price ? parseFloat(updateData.cost_price) : null;
    if (updateData.quantity !== undefined) productUpdate.stock_quantity = updateData.quantity ? parseFloat(updateData.quantity) : null;

    // Build meta_data object for custom fields
    const meta_data: any = {};
    if (updateData.thc_percentage !== undefined) meta_data.thc_percentage = updateData.thc_percentage;
    if (updateData.cbd_percentage !== undefined) meta_data.cbd_percentage = updateData.cbd_percentage;
    if (updateData.strain_type !== undefined) meta_data.strain_type = updateData.strain_type;
    if (updateData.lineage !== undefined) meta_data.lineage = updateData.lineage;
    if (updateData.terpenes !== undefined) meta_data.terpenes = updateData.terpenes;
    if (updateData.effects !== undefined) meta_data.effects = updateData.effects;
    if (updateData.nose !== undefined) meta_data.nose = updateData.nose;
    if (updateData.taste !== undefined) meta_data.taste = updateData.taste;

    if (Object.keys(meta_data).length > 0) {
      productUpdate.meta_data = meta_data;
    }

    // Handle category if provided
    if (updateData.category) {
      // Category could be ID or name, handle both
      if (updateData.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's a UUID
        productUpdate.primary_category_id = updateData.category;
      } else {
        // It's a name, find the category ID
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('name', updateData.category)
          .single();
        
        if (category) {
          productUpdate.primary_category_id = category.id;
        }
      }
    }

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(productUpdate)
      .eq('id', productId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update product:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Product updated successfully:', updatedProduct.name);
    
    // Log cost change if cost_price was updated
    if (updateData.cost_price) {
      console.log(`💰 Cost price updated: $${updateData.cost_price} (Margin will be auto-calculated)`);
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Update product error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update product'
    }, { status: 500 });
  }
}

/**
 * DELETE - Delete vendor product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Delete product (only if belongs to vendor)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('vendor_id', vendorId);

    if (error) {
      console.error('❌ Failed to delete product:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Product deleted:', productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Delete product error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete product'
    }, { status: 500 });
  }
}
