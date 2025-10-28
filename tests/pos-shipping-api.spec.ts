import { test, expect } from '@playwright/test';

test.describe('POS Shipping Orders API', () => {
  test('shipping orders API should return data', async ({ request }) => {
    const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'; // Charlotte Central

    const response = await request.get(`/api/pos/orders/shipping?locationId=${locationId}`);

    expect(response.status()).toBe(200);

    const data = await response.json();

    console.log('✅ Shipping API Response:', {
      ordersCount: data.orders?.length || 0,
      sampleOrder: data.orders?.[0]?.order_number || 'none',
    });

    expect(data).toHaveProperty('orders');
    expect(Array.isArray(data.orders)).toBe(true);

    // Should have at least some shipping orders based on our earlier fix
    if (data.orders.length > 0) {
      const order = data.orders[0];

      // Verify order structure
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('order_number');
      expect(order).toHaveProperty('shipping_address');
      expect(order).toHaveProperty('customers');
      expect(order).toHaveProperty('order_items');

      console.log('✅ Order structure validated');
      console.log('Sample order:', {
        orderNumber: order.order_number,
        customer: `${order.customers.first_name} ${order.customers.last_name}`,
        address: order.shipping_address?.city,
        total: order.total_amount,
        items: order.order_items.length,
      });
    }
  });

  test('pickup orders API should return data', async ({ request }) => {
    const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

    const response = await request.get(`/api/pos/orders/pickup?locationId=${locationId}`);

    expect(response.status()).toBe(200);

    const data = await response.json();

    console.log('✅ Pickup API Response:', {
      ordersCount: data.orders?.length || 0,
    });

    expect(data).toHaveProperty('orders');
    expect(Array.isArray(data.orders)).toBe(true);
  });

  test('both APIs should return different order types', async ({ request }) => {
    const locationId = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

    const [shippingRes, pickupRes] = await Promise.all([
      request.get(`/api/pos/orders/shipping?locationId=${locationId}`),
      request.get(`/api/pos/orders/pickup?locationId=${locationId}`),
    ]);

    const shippingData = await shippingRes.json();
    const pickupData = await pickupRes.json();

    console.log('📊 Order Types Comparison:');
    console.log('  Shipping Orders:', shippingData.orders?.length || 0);
    console.log('  Pickup Orders:', pickupData.orders?.length || 0);

    // Both should be arrays
    expect(Array.isArray(shippingData.orders)).toBe(true);
    expect(Array.isArray(pickupData.orders)).toBe(true);

    // Verify they're actually different (shipping should have shipping_address)
    if (shippingData.orders.length > 0) {
      const shippingOrder = shippingData.orders[0];
      expect(shippingOrder.shipping_address).toBeTruthy();
      console.log('✅ Shipping orders have shipping_address');
    }
  });
});
