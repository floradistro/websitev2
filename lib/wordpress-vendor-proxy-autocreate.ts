// Auto-create inventory helper
async function ensureInventoryRecord(productId: number) {
  const cacheBuster = `_t=${Date.now()}`;
  try {
    await vendorProxyRequest(
      `flora-vendors/v1/vendors/me/inventory/${productId}/set?${cacheBuster}`,
      'POST',
      { quantity: 0, reason: 'Auto-create inventory record' }
    );
  } catch (error) {
    // Ignore errors - record might already exist
  }
}

export async function adjustVendorInventoryProxyWithAutoCreate(productId: number, operation: 'add' | 'subtract', amount: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  try {
    const response = await vendorProxyRequest(
      `flora-vendors/v1/vendors/me/inventory/${productId}/adjust?${cacheBuster}`,
      'POST',
      { operation, amount, reason }
    );
    return response.data;
  } catch (error: any) {
    // If no inventory record, create one and retry
    if (error.response?.data?.code === 'no_inventory') {
      await ensureInventoryRecord(productId);
      // Retry the operation
      const response = await vendorProxyRequest(
        `flora-vendors/v1/vendors/me/inventory/${productId}/adjust?${cacheBuster}`,
        'POST',
        { operation, amount, reason }
      );
      return response.data;
    }
    throw error;
  }
}

export async function setVendorInventoryProxyWithAutoCreate(productId: number, quantity: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/inventory/${productId}/set?${cacheBuster}`,
    'POST',
    { quantity, reason }
  );
  return response.data;
}
