import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    console.log('🔵 Inventory adjust - Vendor ID:', vendorId);
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { inventoryId, productId, adjustment, reason, locationId } = body;
    
    console.log('🔵 Adjust request:', { inventoryId, productId, adjustment, locationId });
    
    if (!productId || adjustment === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: productId, adjustment' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    let inventory: any = null;
    let isNew = false;
    
    // Try to get existing inventory by ID first (if provided and valid)
    if (inventoryId) {
      console.log('🔵 Looking up inventory by ID:', inventoryId);
      
      const { data: existingInventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', inventoryId)
        .eq('vendor_id', vendorId)
        .single();
      
      if (existingInventory) {
        console.log('✅ Found existing inventory by ID');
        inventory = existingInventory;
      } else {
        console.log('⚠️ Inventory ID not found, will try product lookup');
      }
    }
    
    // If no inventory found, find or create one using productId (UUID)
    if (!inventory) {
      console.log('🔵 Looking up product:', productId);
      
      // Verify product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, vendor_id')
        .eq('id', productId)
        .single();
      
      if (productError || !product) {
        console.error('❌ Product not found:', productError);
        return NextResponse.json({ 
          error: 'Product not found' 
        }, { status: 404 });
      }
      
      console.log('🔵 Product found:', product.name);
      
      // Get vendor's location (use provided locationId or vendor's primary location)
      let targetLocationId = locationId;
      
      if (!targetLocationId) {
        const { data: vendorLocation } = await supabase
          .from('locations')
          .select('id')
          .eq('vendor_id', vendorId)
          .eq('type', 'vendor')
          .limit(1)
          .single();
        
        if (!vendorLocation) {
          return NextResponse.json({ 
            error: 'No vendor location found. Please contact support to set up your warehouse location.' 
          }, { status: 404 });
        }
        
        targetLocationId = vendorLocation.id;
      }
      
      // Check if inventory already exists for this product at this location
      const { data: existingInv } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', targetLocationId)
        .single();
      
      if (existingInv) {
        console.log('✅ Found existing inventory record:', existingInv.id);
        inventory = existingInv;
      } else {
        // Create new inventory record
        const { data: newInventory, error: createError } = await supabase
          .from('inventory')
          .insert({
            product_id: productId,
            location_id: targetLocationId,
            vendor_id: vendorId,
            quantity: 0,
            low_stock_threshold: 10,
            notes: 'Created via inventory manager'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating inventory:', createError);
          return NextResponse.json({ error: createError.message, details: createError }, { status: 500 });
        }
        
        inventory = newInventory;
        isNew = true;
        console.log('✅ Created new inventory record:', inventory.id);
      }
    }
    
    // Final check - if still no inventory, return error
    if (!inventory) {
      return NextResponse.json({ 
        error: 'Could not find or create inventory record' 
      }, { status: 404 });
    }
    
    const currentQty = parseFloat(inventory.quantity || 0);
    const adjustmentAmount = parseFloat(adjustment);
    const newQty = currentQty + adjustmentAmount;
    
    if (newQty < 0) {
      return NextResponse.json({ 
        error: 'Cannot reduce inventory below 0' 
      }, { status: 400 });
    }
    
    // Update inventory
    const { data: updated, error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQty,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating inventory:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    console.log(`✅ Updated inventory: ${currentQty} → ${newQty}`);
    
    // Sync product's stock_quantity with inventory total
    const { data: product, error: productFetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', inventory.product_id)
      .single();
    
    if (productFetchError) {
      console.error('❌ Could not find product with ID:', inventory.product_id, productFetchError);
    } else if (product) {
      // Get total stock across all locations for this product
      const { data: allInventory, error: invFetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', inventory.product_id);
      
      if (invFetchError) {
        console.error('❌ Error fetching all inventory:', invFetchError);
      } else {
        const totalStock = allInventory?.reduce((sum, inv) => sum + parseFloat(inv.quantity || 0), 0) || 0;
        
        console.log(`🔵 Syncing product ${product.name} stock: ${totalStock}`);
        
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: totalStock,
            stock_status: totalStock > 0 ? 'in_stock' : 'out_of_stock',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (productUpdateError) {
          console.error('❌ Error updating product stock:', productUpdateError);
        } else {
          console.log(`✅ Product stock_quantity synced: ${totalStock}, status: ${totalStock > 0 ? 'in_stock' : 'out_of_stock'}`);
        }
      }
    }
    
    // Create stock movement record
    const movementType = adjustmentAmount > 0 ? 'purchase' : 'adjustment';
    
    await supabase
      .from('stock_movements')
      .insert({
        inventory_id: inventory.id,
        product_id: inventory.product_id,
        movement_type: movementType,
        quantity: Math.abs(adjustmentAmount),
        quantity_before: currentQty,
        quantity_after: newQty,
        to_location_id: adjustmentAmount > 0 ? inventory.location_id : null,
        from_location_id: adjustmentAmount < 0 ? inventory.location_id : null,
        reason: reason || 'Vendor inventory adjustment',
        metadata: { created_by: 'vendor', vendor_id: vendorId }
      })
      .select()
      .single();
    
    return NextResponse.json({
      success: true,
      inventory: updated,
      previous_quantity: currentQty,
      new_quantity: newQty,
      was_created: isNew
    });
    
  } catch (error: any) {
    console.error('❌ Inventory adjustment error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to adjust inventory',
      details: error.toString()
    }, { status: 500 });
  }
}
