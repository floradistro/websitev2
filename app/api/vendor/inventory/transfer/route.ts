import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { productId, fromLocationId, toLocationId, quantity, reason } = body;
    
    console.log('🔵 Transfer request:', { productId, fromLocationId, toLocationId, quantity });
    
    if (!productId || !fromLocationId || !toLocationId || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: productId, fromLocationId, toLocationId, quantity' 
      }, { status: 400 });
    }
    
    if (fromLocationId === toLocationId) {
      return NextResponse.json({ 
        error: 'Cannot transfer to the same location' 
      }, { status: 400 });
    }
    
    const transferQty = parseFloat(quantity);
    if (transferQty <= 0) {
      return NextResponse.json({ 
        error: 'Transfer quantity must be greater than 0' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify both locations belong to vendor
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('vendor_id', vendorId)
      .in('id', [fromLocationId, toLocationId]);
    
    if (locError || !locations || locations.length !== 2) {
      return NextResponse.json({ 
        error: 'One or both locations not found or not authorized' 
      }, { status: 403 });
    }
    
    const fromLocation = locations.find(l => l.id === fromLocationId);
    const toLocation = locations.find(l => l.id === toLocationId);
    
    // Get or create inventory records
    const { data: fromInventory, error: fromInvError } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('location_id', fromLocationId)
      .maybeSingle();
    
    if (fromInvError) {
      console.error('Error fetching from inventory:', fromInvError);
      return NextResponse.json({ error: fromInvError.message }, { status: 500 });
    }
    
    if (!fromInventory) {
      return NextResponse.json({ 
        error: 'No inventory found at source location' 
      }, { status: 404 });
    }
    
    const currentQty = parseFloat(fromInventory.quantity || 0);
    
    if (currentQty < transferQty) {
      return NextResponse.json({ 
        error: `Insufficient stock at ${fromLocation?.name}. Available: ${currentQty}g` 
      }, { status: 400 });
    }
    
    // Deduct from source location
    const newFromQty = currentQty - transferQty;
    
    const { error: fromUpdateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newFromQty,
        updated_at: new Date().toISOString()
      })
      .eq('id', fromInventory.id);
    
    if (fromUpdateError) {
      console.error('Error updating from inventory:', fromUpdateError);
      return NextResponse.json({ error: fromUpdateError.message }, { status: 500 });
    }
    
    console.log(`✅ Deducted ${transferQty}g from ${fromLocation?.name}: ${currentQty} → ${newFromQty}`);
    
    // Add to destination location (upsert)
    const { data: toInventory, error: toInvError } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('location_id', toLocationId)
      .maybeSingle();
    
    const toCurrentQty = toInventory ? parseFloat(toInventory.quantity || 0) : 0;
    const newToQty = toCurrentQty + transferQty;
    
    if (toInventory) {
      // Update existing
      const { error: toUpdateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: newToQty,
          updated_at: new Date().toISOString()
        })
        .eq('id', toInventory.id);
      
      if (toUpdateError) {
        console.error('Error updating to inventory:', toUpdateError);
        // Rollback from inventory
        await supabase
          .from('inventory')
          .update({ quantity: currentQty })
          .eq('id', fromInventory.id);
        
        return NextResponse.json({ error: toUpdateError.message }, { status: 500 });
      }
    } else {
      // Create new inventory record
      const { error: toCreateError } = await supabase
        .from('inventory')
        .insert({
          product_id: productId,
          location_id: toLocationId,
          vendor_id: vendorId,
          quantity: newToQty,
          low_stock_threshold: 10,
          notes: 'Created via transfer'
        });
      
      if (toCreateError) {
        console.error('Error creating to inventory:', toCreateError);
        // Rollback from inventory
        await supabase
          .from('inventory')
          .update({ quantity: currentQty })
          .eq('id', fromInventory.id);
        
        return NextResponse.json({ error: toCreateError.message }, { status: 500 });
      }
    }
    
    console.log(`✅ Added ${transferQty}g to ${toLocation?.name}: ${toCurrentQty} → ${newToQty}`);
    
    // Create stock movement record
    await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        movement_type: 'transfer',
        quantity: transferQty,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        reason: reason || `Transfer from ${fromLocation?.name} to ${toLocation?.name}`,
        metadata: { 
          created_by: 'vendor', 
          vendor_id: vendorId,
          from_qty_before: currentQty,
          from_qty_after: newFromQty,
          to_qty_before: toCurrentQty,
          to_qty_after: newToQty
        }
      });
    
    // Update product's total stock_quantity
    const { data: allInventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId);
    
    const totalStock = allInventory?.reduce((sum, inv) => sum + parseFloat(inv.quantity || 0), 0) || 0;
    
    await supabase
      .from('products')
      .update({ 
        stock_quantity: totalStock,
        stock_status: totalStock > 0 ? 'in_stock' : 'out_of_stock'
      })
      .eq('id', productId);
    
    return NextResponse.json({
      success: true,
      message: `Transferred ${transferQty}g from ${fromLocation?.name} to ${toLocation?.name}`,
      transfer: {
        quantity: transferQty,
        from_location: fromLocation?.name,
        to_location: toLocation?.name,
        from_qty_after: newFromQty,
        to_qty_after: newToQty
      }
    });
    
  } catch (error: any) {
    console.error('❌ Transfer error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to transfer inventory',
      details: error.toString()
    }, { status: 500 });
  }
}

