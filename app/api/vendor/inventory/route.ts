import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getServiceSupabase } from '@/lib/supabase/client';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const ck = process.env.WORDPRESS_CONSUMER_KEY || "";
const cs = process.env.WORDPRESS_CONSUMER_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    
    // STEP 1: Get vendor's assigned locations
    const { data: vendorLocations, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    if (locError) {
      console.error('Error fetching vendor locations:', locError);
      return NextResponse.json({ error: locError.message }, { status: 500 });
    }

    if (!vendorLocations || vendorLocations.length === 0) {
      // No locations assigned yet
      return NextResponse.json({
        success: true,
        inventory: []
      });
    }

    const locationIds = vendorLocations.map(loc => loc.id);

    console.log('🔵 Vendor locations:', locationIds);

    // STEP 2: Get ONLY vendor's inventory at their locations
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        location:location_id(id, name, city, state, type)
      `)
      .in('location_id', locationIds)
      .eq('vendor_id', vendorId); // ONLY show vendor's own products

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('🔵 Total inventory records at vendor locations:', inventory?.length || 0);

    // Get product names separately
    const productIds = [...new Set(inventory?.map(inv => inv.product_id) || [])];
    const { data: products } = await supabase
      .from('products')
      .select('wordpress_id, name, featured_image_storage, featured_image, price')
      .in('wordpress_id', productIds);
    
    const productMap = new Map(products?.map(p => [p.wordpress_id, p]) || []);
    
    // Map to expected format for vendor UI
    const mappedInventory = (inventory || []).map(inv => {
      const product = productMap.get(inv.product_id);
      const isVendorOwned = inv.vendor_id === vendorId;
      
      return {
        id: inv.id,
        inventory_id: inv.id, // UUID
        product_id: inv.product_id,
        product_name: product?.name || 'Unknown Product',
        quantity: inv.quantity,
        location_name: inv.location?.name || 'Unknown Location',
        location_id: inv.location_id,
        location_type: inv.location?.type || 'unknown',
        stock_status: inv.stock_status,
        unit_cost: inv.unit_cost,
        average_cost: inv.average_cost,
        available_quantity: inv.available_quantity,
        reserved_quantity: inv.reserved_quantity,
        image: product?.featured_image_storage || product?.featured_image || null,
        price: product?.price || 0,
        is_vendor_owned: isVendorOwned, // Flag to show if this is vendor's own inventory
        vendor_id: inv.vendor_id
      };
    });

    console.log('✅ Returning inventory:', mappedInventory.length, 'items');
    console.log('🔵 Vendor-owned:', mappedInventory.filter(i => i.is_vendor_owned).length);
    console.log('🔵 House inventory:', mappedInventory.filter(i => !i.is_vendor_owned).length);

    return NextResponse.json({
      success: true,
      inventory: mappedInventory
    });

  } catch (error: any) {
    console.error('Get inventory error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: error.response?.status || 500 }
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
    const inventoryId = searchParams.get('inventory_id');

    if (!inventoryId) {
      return NextResponse.json({ error: 'Inventory ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify the inventory record belongs to a location owned by this vendor
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        quantity,
        location:location_id(id, vendor_id)
      `)
      .eq('id', inventoryId)
      .single();

    if (fetchError || !inventory) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    // Check if this location belongs to the vendor
    const location = Array.isArray(inventory.location) ? inventory.location[0] : inventory.location;
    if (location?.vendor_id !== vendorId) {
      return NextResponse.json({ 
        error: 'Not authorized to delete this inventory record' 
      }, { status: 403 });
    }

    // Create stock movement record before deletion (for audit trail)
    await supabase
      .from('stock_movements')
      .insert({
        inventory_id: inventoryId,
        product_id: inventory.product_id,
        movement_type: 'adjustment',
        quantity: -inventory.quantity,
        quantity_before: inventory.quantity,
        quantity_after: 0,
        reason: 'Inventory record deleted by vendor',
        notes: 'Product removed from location inventory'
      });

    // Delete the inventory record
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', inventoryId);

    if (deleteError) {
      console.error('Error deleting inventory:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('✅ Inventory record deleted:', inventoryId);

    return NextResponse.json({
      success: true,
      message: 'Inventory record deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete inventory error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory' },
      { status: 500 }
    );
  }
}
