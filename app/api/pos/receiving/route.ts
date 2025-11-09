import { getServiceSupabase } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';

// GET /api/pos/receiving - Get purchase orders for a specific location (POS view)
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const locationId = searchParams.get('location_id');

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'location_id is required' },
        { status: 400 }
      );
    }

    // Get only INBOUND purchase orders for this location that need receiving
    // Statuses: ordered, confirmed, shipped, receiving (not 'received' or 'cancelled')
    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers!purchase_orders_supplier_id_fkey(
          id,
          external_name
        ),
        items:purchase_order_items!purchase_order_items_purchase_order_id_fkey(
          *,
          product:products!purchase_order_items_product_id_fkey(id, name, sku)
        )
      `)
      .eq('location_id', locationId)
      .eq('po_type', 'inbound')
      .in('status', ['ordered', 'confirmed', 'shipped', 'receiving'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching POs for POS:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter out POs where all items are fully received
    const activePOs = purchaseOrders.filter(po => {
      const hasReceivableItems = po.items?.some((item: any) =>
        (item.quantity_remaining || 0) > 0
      );
      return hasReceivableItems;
    });

    return NextResponse.json({
      success: true,
      data: activePOs,
      count: activePOs.length,
    });
  } catch (error: any) {
    console.error('Error in POS receiving API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
