import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

/**
 * Vendor Orders API
 * Provides aggregated order data across all locations for a vendor
 * Supports filtering by location, order type, status, and date range
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  net_earnings: number;
  by_location: Record<string, LocationStats>;
  by_type: Record<string, number>;
}

interface LocationStats {
  order_count: number;
  revenue: number;
  commission: number;
  net_earnings: number;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);

    // Filters
    const locationId = searchParams.get('location'); // 'all' or specific location ID
    const orderType = searchParams.get('order_type'); // 'pickup' | 'delivery' | 'instore'
    const status = searchParams.get('status'); // 'pending' | 'processing' | 'completed' | 'cancelled'
    const dateRange = searchParams.get('date_range') || 'last_30_days';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const offset = (page - 1) * perPage;

    const supabase = getServiceSupabase();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'last_7_days':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last_30_days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last_90_days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all_time':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build base query - get orders that have items from this vendor
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        status,
        payment_status,
        fulfillment_status,
        delivery_type,
        total_amount,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        order_date,
        created_at,
        completed_date,
        pickup_location_id,
        shipping_address,
        tracking_number,
        tracking_url,
        shipping_carrier,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        order_items!inner (
          id,
          product_id,
          product_name,
          product_image,
          quantity,
          quantity_display,
          unit_price,
          line_total,
          vendor_id,
          commission_amount,
          commission_rate,
          order_type,
          tier_name,
          pickup_location_id,
          pickup_location_name
        )
      `, { count: 'exact' });

    // Filter by vendor (through order_items)
    ordersQuery = ordersQuery.eq('order_items.vendor_id', vendorId);

    // Filter by location if specified
    if (locationId && locationId !== 'all') {
      ordersQuery = ordersQuery.eq('pickup_location_id', locationId);
    }

    // Filter by order type (delivery_type on orders table)
    if (orderType) {
      if (orderType === 'instore') {
        ordersQuery = ordersQuery.eq('delivery_type', 'pickup');
      } else {
        ordersQuery = ordersQuery.eq('delivery_type', orderType);
      }
    }

    // Filter by status
    if (status) {
      ordersQuery = ordersQuery.eq('status', status);
    }

    // Filter by date range
    ordersQuery = ordersQuery.gte('order_date', startDate.toISOString());

    // Apply pagination and sorting
    ordersQuery = ordersQuery
      .order('order_date', { ascending: false })
      .range(offset, offset + perPage - 1);

    const { data: ordersData, error: ordersError, count } = await ordersQuery;

    if (ordersError) {
      console.error('❌ Error fetching vendor orders:', ordersError);
      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    // Get location names for orders that don't have them
    const locationIds = [...new Set(
      ordersData
        ?.map(o => o.pickup_location_id)
        .filter(Boolean) || []
    )];

    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', locationIds);

    const locationMap = new Map(
      locations?.map(l => [l.id, l.name]) || []
    );

    // Process orders and calculate vendor-specific totals
    const processedOrders = ordersData?.map(order => {
      // Filter order items to only include this vendor's items
      const vendorItems = order.order_items.filter(
        (item: any) => item.vendor_id === vendorId
      );

      // Calculate vendor-specific totals
      const vendorSubtotal = vendorItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.line_total || 0),
        0
      );

      const vendorCommission = vendorItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.commission_amount || 0),
        0
      );

      const vendorNetEarnings = vendorSubtotal - vendorCommission;

      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : 'Guest';

      const locationName =
        vendorItems[0]?.pickup_location_name ||
        (order.pickup_location_id ? locationMap.get(order.pickup_location_id) : null) ||
        'Online';

      // Determine order type
      const orderTypeLabel =
        order.delivery_type === 'pickup' ? 'Pickup' :
        order.delivery_type === 'delivery' ? 'Shipping' :
        vendorItems[0]?.order_type === 'pickup' ? 'Pickup' :
        'In-Store';

      return {
        id: order.id,
        orderNumber: order.order_number,
        date: order.order_date || order.created_at,
        customerName,
        customerEmail: customer?.email,
        customerPhone: customer?.phone,
        status: order.status || 'pending',
        fulfillmentStatus: order.fulfillment_status,
        paymentStatus: order.payment_status,
        orderType: orderTypeLabel,
        deliveryType: order.delivery_type,
        locationId: order.pickup_location_id,
        locationName,
        items: vendorItems.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productImage: item.product_image,
          quantity: item.quantity,
          quantityDisplay: item.quantity_display,
          unitPrice: parseFloat(item.unit_price || 0),
          lineTotal: parseFloat(item.line_total || 0),
          tierName: item.tier_name
        })),
        itemCount: vendorItems.length,
        vendorSubtotal,
        vendorCommission,
        vendorNetEarnings,
        // Shipping info (for delivery orders)
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        shippingCarrier: order.shipping_carrier,
        shippingAddress: order.shipping_address,
        completedDate: order.completed_date
      };
    }) || [];

    // Calculate aggregate statistics
    const stats: OrderStats = {
      total_orders: processedOrders.length,
      total_revenue: processedOrders.reduce((sum, o) => sum + o.vendorSubtotal, 0),
      total_commission: processedOrders.reduce((sum, o) => sum + o.vendorCommission, 0),
      net_earnings: processedOrders.reduce((sum, o) => sum + o.vendorNetEarnings, 0),
      by_location: {},
      by_type: {
        pickup: 0,
        delivery: 0,
        instore: 0
      }
    };

    // Group by location
    processedOrders.forEach(order => {
      const loc = order.locationName || 'Unknown';

      if (!stats.by_location[loc]) {
        stats.by_location[loc] = {
          order_count: 0,
          revenue: 0,
          commission: 0,
          net_earnings: 0
        };
      }

      stats.by_location[loc].order_count++;
      stats.by_location[loc].revenue += order.vendorSubtotal;
      stats.by_location[loc].commission += order.vendorCommission;
      stats.by_location[loc].net_earnings += order.vendorNetEarnings;

      // Count by type
      const typeKey = order.deliveryType === 'pickup' ? 'pickup' :
                     order.deliveryType === 'delivery' ? 'delivery' :
                     'instore';
      stats.by_type[typeKey]++;
    });

    const duration = performance.now() - startTime;

    console.log(`✅ Vendor orders loaded in ${duration.toFixed(2)}ms:`, {
      vendor: vendorId,
      orders: processedOrders.length,
      revenue: stats.total_revenue.toFixed(2),
      locations: Object.keys(stats.by_location).length
    });

    return NextResponse.json({
      success: true,
      orders: processedOrders,
      stats,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage)
      },
      filters: {
        location: locationId,
        order_type: orderType,
        status,
        date_range: dateRange
      }
    }, {
      headers: {
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ Vendor orders API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch vendor orders',
      orders: [],
      stats: {
        total_orders: 0,
        total_revenue: 0,
        total_commission: 0,
        net_earnings: 0,
        by_location: {},
        by_type: { pickup: 0, delivery: 0, instore: 0 }
      }
    }, { status: 500 });
  }
}
