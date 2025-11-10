/**
 * Field Binding Resolver
 * Resolves field_bindings to actual data from context (product, vendor, etc.)
 */

export interface BindingContext {
  product?: any;
  vendor?: any;
  page?: any;
  [key: string]: any;
}

/**
 * Resolve field bindings to actual values
 */
export function resolveFieldBindings(
  fieldBindings: Record<string, string> = {},
  context: BindingContext = {},
): Record<string, any> {
  const resolved: Record<string, any> = {};

  Object.entries(fieldBindings).forEach(([propKey, bindingKey]) => {
    if (!bindingKey) return;

    // Resolve binding key to actual value
    const value = resolveBinding(bindingKey, context);
    if (value !== undefined && value !== null) {
      resolved[propKey] = value;
    }
  });

  return resolved;
}

/**
 * Resolve a single binding key to its value
 */
function resolveBinding(bindingKey: string, context: BindingContext): any {
  const { product, vendor } = context;

  switch (bindingKey) {
    // Product bindings
    case "product_name":
      return product?.name;

    case "product_price":
      return product?.price ? `$${product.price}` : null;

    case "product_description":
      return product?.description || product?.short_description;

    case "product_image":
      return product?.featured_image_storage || product?.featured_image;

    case "product_sku":
      return product?.sku;

    // Vendor bindings
    case "vendor_name":
      return vendor?.store_name || vendor?.name;

    case "vendor_tagline":
      return vendor?.store_tagline || vendor?.tagline;

    case "vendor_logo":
      return vendor?.logo_url;

    case "vendor_description":
      return vendor?.store_description || vendor?.description;

    // Default
    default:
      // Try direct property access
      if (bindingKey.startsWith("product.")) {
        const key = bindingKey.replace("product.", "");
        return product?.[key];
      }
      if (bindingKey.startsWith("vendor.")) {
        const key = bindingKey.replace("vendor.", "");
        return vendor?.[key];
      }
      return null;
  }
}
