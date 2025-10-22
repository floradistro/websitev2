import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔵 DELETE /api/admin/products called');
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const forceDelete = searchParams.get('force') === 'true';

    console.log('📦 Product ID:', productId, 'Force:', forceDelete);

    if (!productId) {
      console.error('❌ No product ID provided');
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get product details
    console.log('🔍 Fetching product details...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, wordpress_id')
      .eq('id', productId);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json({ error: `Database error: ${fetchError.message}` }, { status: 500 });
    }

    if (!products || products.length === 0) {
      console.error('❌ Product not found:', productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];
    console.log('✅ Product found:', product.name, 'WordPress ID:', product.wordpress_id);

    // Check if product has inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity, location:location_id(name)')
      .eq('product_id', product.wordpress_id);

    if (inventory && inventory.length > 0 && !forceDelete) {
      const totalQty = inventory.reduce((sum, inv) => sum + parseFloat(inv.quantity || '0'), 0);
      
      if (totalQty > 0) {
        const locationsList = inventory
          .filter(inv => parseFloat(inv.quantity || '0') > 0)
          .map(inv => `${inv.location?.name || 'Unknown'}: ${inv.quantity}g`)
          .join(', ');
        
        return NextResponse.json({ 
          error: `Cannot delete product with existing inventory. Current stock: ${totalQty}g at ${inventory.length} location(s). (${locationsList})`,
          has_inventory: true,
          inventory_count: inventory.length,
          total_quantity: totalQty
        }, { status: 400 });
      }
    }

    console.log('🗑️ Admin deleting product:', product.name, 'ID:', productId, 'Force:', forceDelete);

    // If force delete, remove all inventory first
    if (forceDelete && inventory && inventory.length > 0) {
      console.log('⚠️ Force deleting inventory for product:', product.name);
      
      // Create stock movements for audit trail
      for (const inv of inventory) {
        await supabase
          .from('stock_movements')
          .insert({
            inventory_id: inv.id,
            product_id: product.wordpress_id,
            movement_type: 'adjustment',
            quantity: -parseFloat(inv.quantity || '0'),
            quantity_before: parseFloat(inv.quantity || '0'),
            quantity_after: 0,
            reason: 'Product deleted by admin (force)',
            notes: `Product "${product.name}" force deleted with inventory`
          });
      }
      
      // Delete all inventory records
      await supabase
        .from('inventory')
        .delete()
        .eq('product_id', product.wordpress_id);
      
      console.log('✅ Inventory deleted for product:', product.name);
    }

    // Delete the product (will cascade to related records)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('❌ Error deleting product:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ Product deleted successfully:', product.name);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

