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

    // Get vendor's inventory from Supabase ONLY
    const supabase = getServiceSupabase();
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        location:location_id(id, name, city, state)
      `)
      .eq('vendor_id', vendorId);

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get product names separately
    const productIds = [...new Set(inventory.map(inv => inv.product_id))];
    const { data: products } = await supabase
      .from('products')
      .select('wordpress_id, name, featured_image_storage, featured_image, price')
      .in('wordpress_id', productIds);
    
    const productMap = new Map(products?.map(p => [p.wordpress_id, p]) || []);
    
    // Map to expected format for vendor UI
    const mappedInventory = (inventory || []).map(inv => {
      const product = productMap.get(inv.product_id);
      
      return {
        id: inv.id,
        inventory_id: inv.id, // UUID
        product_id: inv.product_id,
        product_name: product?.name || 'Unknown Product',
        quantity: inv.quantity,
        location_name: inv.location?.name || 'Unknown Location',
        location_id: inv.location_id,
        stock_status: inv.stock_status,
        unit_cost: inv.unit_cost,
        available_quantity: inv.available_quantity,
        image: product?.featured_image_storage || product?.featured_image || null,
        price: product?.price || 0
      };
    });

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

