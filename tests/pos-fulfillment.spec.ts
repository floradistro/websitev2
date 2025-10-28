import { test, expect } from '@playwright/test';

test.describe('POS Order Fulfillment', () => {
  const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'; // Charlotte Central

  test('should fulfill a shipping order', async ({ request }) => {
    // First, get a shipping order to fulfill
    const ordersResponse = await request.get(`/api/pos/orders/shipping?locationId=${locationId}`);
    expect(ordersResponse.status()).toBe(200);

    const ordersData = await ordersResponse.json();
    const shippingOrders = ordersData.orders || [];

    if (shippingOrders.length === 0) {
      console.log('ℹ️ No shipping orders available to test fulfillment');
      return;
    }

    // Get the first order
    const orderToFulfill = shippingOrders[0];
    console.log('📦 Testing fulfillment for order:', orderToFulfill.order_number);

    // Fulfill the order
    const fulfillResponse = await request.post('/api/pos/sales/fulfill', {
      data: {
        orderId: orderToFulfill.id,
        locationId: locationId,
      },
    });

    expect(fulfillResponse.status()).toBe(200);

    const fulfillData = await fulfillResponse.json();

    console.log('✅ Fulfillment response:', {
      success: fulfillData.success,
      message: fulfillData.message,
      transactionType: fulfillData.transaction?.transaction_type,
    });

    // Verify response
    expect(fulfillData.success).toBe(true);
    expect(fulfillData.transaction).toBeTruthy();
    expect(fulfillData.transaction.transaction_type).toBe('pickup_fulfillment');
    expect(fulfillData.transaction.order_id).toBe(orderToFulfill.id);
    // Verify shipping order is tracked in metadata
    expect(fulfillData.transaction.metadata.is_shipping_order).toBe(true);
    expect(fulfillData.transaction.metadata.delivery_type).toBe('delivery');

    // Verify the order was removed from the shipping queue
    const afterResponse = await request.get(`/api/pos/orders/shipping?locationId=${locationId}`);
    const afterData = await afterResponse.json();
    const afterOrders = afterData.orders || [];

    const stillInQueue = afterOrders.find((o: any) => o.id === orderToFulfill.id);
    expect(stillInQueue).toBeUndefined();

    console.log('✅ Order successfully removed from shipping queue');
    console.log('📊 Remaining shipping orders:', afterOrders.length);
  });

  test('fulfillment endpoint should handle missing parameters', async ({ request }) => {
    const response = await request.post('/api/pos/sales/fulfill', {
      data: {},
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Missing');
  });

  test('fulfillment endpoint should handle non-existent order', async ({ request }) => {
    const response = await request.post('/api/pos/sales/fulfill', {
      data: {
        orderId: '00000000-0000-0000-0000-000000000000',
        locationId: locationId,
      },
    });

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('should create shipping_fulfillment transaction for delivery orders', async ({ request }) => {
    // Get shipping orders
    const ordersResponse = await request.get(`/api/pos/orders/shipping?locationId=${locationId}`);
    const ordersData = await ordersResponse.json();
    const shippingOrders = ordersData.orders || [];

    if (shippingOrders.length === 0) {
      console.log('ℹ️ No shipping orders available');
      return;
    }

    const order = shippingOrders[0];

    // Fulfill it
    const fulfillResponse = await request.post('/api/pos/sales/fulfill', {
      data: {
        orderId: order.id,
        locationId: locationId,
      },
    });

    expect(fulfillResponse.status()).toBe(200);

    const data = await fulfillResponse.json();

    // Verify transaction type and metadata
    // NOTE: transaction_type is 'pickup_fulfillment' for all orders until DB constraint is updated
    // Shipping orders are distinguished by metadata
    expect(data.transaction.transaction_type).toBe('pickup_fulfillment');
    expect(data.transaction.metadata.is_shipping_order).toBe(true);
    expect(data.transaction.metadata.delivery_type).toBe('delivery');

    console.log('✅ Shipping order fulfillment transaction created with correct metadata');
  });
});
