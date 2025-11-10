import { z } from "zod";

/**
 * Product validation schemas using Zod
 * These schemas enforce type safety and validation at the API boundary
 */

// Product visibility types
export const productVisibilitySchema = z.enum(["internal", "marketplace"]);

// Product status types
export const productStatusSchema = z.enum(["draft", "pending", "published", "rejected"]);

// Product type
export const productTypeSchema = z.enum(["simple", "variable"]);

// Stock status
export const stockStatusSchema = z.enum(["instock", "outofstock", "onbackorder"]);

// Pricing tier schema
export const pricingTierSchema = z.object({
  weight: z.string().optional(),
  qty: z.number().positive(),
  price: z.union([z.string(), z.number()]),
  label: z.string().optional(),
  unit: z.string().optional(),
  break_id: z.string().optional(),
  sort_order: z.number().optional(),
});

// Product attribute schema (for variable products)
export const productAttributeSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string()),
  visible: z.boolean().optional(),
  variation: z.boolean().optional(),
});

// Product variant schema
export const productVariantSchema = z.object({
  name: z.string().min(1),
  attributes: z.record(z.string(), z.string()),
  price: z.union([z.string(), z.number()]),
  sku: z.string().optional(),
  stock: z.union([z.string(), z.number()]).optional(),
  manage_stock: z.boolean().optional(),
});

// Custom fields schema (vendor autonomy - validated JSON values)
// SECURITY: Prevent XSS by validating field values
export const customFieldsSchema = z.record(
  z.string().max(100, "Field name too long"),
  z.union([
    z.string().max(5000, "Field value too long"),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string().max(500)),
    z.array(z.number()),
  ]),
);

// Field visibility schema
export const fieldVisibilitySchema = z.record(z.string(), z.boolean());

// Create product request schema
export const createProductSchema = z
  .object({
    // Required fields
    name: z.string().min(1, "Product name is required").max(255),

    // Category
    category: z.string().optional(),
    category_id: z.string().uuid().optional(),

    // Basic info
    description: z.string().max(5000).optional(),
    slug: z.string().optional(),
    sku: z.string().max(100).optional(),

    // Pricing
    // SECURITY: Validate positive numbers, prevent negative prices
    price: z
      .union([
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        z.number().positive("Price must be positive").max(999999.99),
      ])
      .optional(),
    regular_price: z
      .union([
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
        z.number().positive("Price must be positive").max(999999.99),
      ])
      .optional(),
    cost_price: z
      .union([
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cost format"),
        z.number().nonnegative("Cost cannot be negative").max(999999.99),
      ])
      .optional(),

    // Stock
    // SECURITY: Validate non-negative stock quantities
    initial_quantity: z
      .union([
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
        z.number().nonnegative("Quantity cannot be negative").max(9999999),
      ])
      .optional(),
    stock_quantity: z
      .union([
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
        z.number().nonnegative("Quantity cannot be negative").max(9999999),
      ])
      .optional(),
    manage_stock: z.boolean().optional(),
    stock_status: stockStatusSchema.optional(),
    backorders_allowed: z.boolean().optional(),
    low_stock_amount: z.number().nonnegative("Low stock amount cannot be negative").max(9999999).optional(),

    // Product type and visibility
    product_type: productTypeSchema.default("simple"),
    product_visibility: productVisibilitySchema.default("internal"),
    status: productStatusSchema.optional(),

    // Media
    // SECURITY: Validate image URLs for proper format and reasonable length
    image_urls: z.array(z.string().url().max(2000)).max(20, "Too many images").optional(),
    featured_image_storage: z.string().max(2000).optional(),
    image_gallery_storage: z.array(z.string().max(2000)).max(20, "Too many images").optional(),
    coa_url: z.string().url().max(2000).optional(),

    // Variable product attributes
    attributes: z.array(productAttributeSchema).optional(),
    variants: z.array(productVariantSchema).optional(),

    // Pricing
    pricing_mode: z.enum(["single", "tiered"]).default("single"),
    pricing_tiers: z.array(pricingTierSchema).optional(),
    pricing_blueprint_id: z.string().uuid().optional(),
    pricing_template_id: z.string().uuid().optional(), // Alias for pricing_blueprint_id

    // Custom fields (VENDOR AUTONOMY)
    custom_fields: customFieldsSchema.optional(),

    // Field visibility
    field_visibility: fieldVisibilitySchema.optional(),

    // Meta data (deprecated fields for backwards compatibility)
    // SECURITY: Add max length constraints to prevent DoS
    thc_percentage: z.string().max(10).optional(),
    cbd_percentage: z.string().max(10).optional(),
    strain_type: z.string().max(50).optional(),
    lineage: z.string().max(500).optional(),
    terpenes: z.string().max(1000).optional(),
    effects: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // If product_type is 'variable', attributes and variants are required
      if (data.product_type === "variable") {
        return (
          data.attributes && data.attributes.length > 0 && data.variants && data.variants.length > 0
        );
      }
      return true;
    },
    {
      message: "Variable products must have attributes and variants",
      path: ["product_type"],
    },
  )
  .refine(
    (data) => {
      // If pricing_mode is 'tiered', pricing_tiers must be provided
      if (data.pricing_mode === "tiered") {
        return data.pricing_tiers && data.pricing_tiers.length > 0;
      }
      return true;
    },
    {
      message: "Tiered pricing mode requires at least one pricing tier",
      path: ["pricing_mode"],
    },
  )
  .refine(
    (data) => {
      // Either category or category_id must be provided
      return data.category || data.category_id;
    },
    {
      message: "Either category name or category_id is required",
      path: ["category"],
    },
  );

// Update product request schema (partial of create schema)
export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  sku: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),

  // Pricing (same security constraints as create)
  price: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
      z.number().positive("Price must be positive").max(999999.99),
    ])
    .optional(),
  regular_price: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
      z.number().positive("Price must be positive").max(999999.99),
    ])
    .optional(),
  cost_price: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cost format"),
      z.number().nonnegative("Cost cannot be negative").max(999999.99),
    ])
    .optional(),

  // Stock (same security constraints as create)
  stock_quantity: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
      z.number().nonnegative("Quantity cannot be negative").max(9999999),
    ])
    .optional(),
  manage_stock: z.boolean().optional(),
  stock_status: stockStatusSchema.optional(),
  backorders_allowed: z.boolean().optional(),
  low_stock_amount: z.number().nonnegative("Low stock amount cannot be negative").max(9999999).optional(),

  // Status and visibility
  status: productStatusSchema.optional(),
  product_visibility: productVisibilitySchema.optional(),

  // Media (same security constraints as create)
  featured_image_storage: z.string().max(2000).optional(),
  image_gallery_storage: z.array(z.string().max(2000)).max(20, "Too many images").optional(),

  // Pricing
  pricing_mode: z.enum(["single", "tiered"]).optional(),
  pricing_tiers: z.array(pricingTierSchema).optional(),
  pricing_blueprint_id: z.string().uuid().optional(),

  // Custom fields (full autonomy)
  custom_fields: customFieldsSchema.optional(),

  // Field visibility
  field_visibility: fieldVisibilitySchema.optional(),

  // Category
  primary_category_id: z.string().uuid().optional(),
});

// Bulk product import schema
export const bulkProductSchema = z.object({
  name: z.string().min(1),
  price: z.union([z.string(), z.number()]).optional(),
  cost_price: z.union([z.string(), z.number()]).optional(),
  pricing_mode: z.enum(["single", "tiered"]).default("single"),
  pricing_tiers: z.array(pricingTierSchema).optional(),
  custom_fields: customFieldsSchema.optional(),
  initial_quantity: z.union([z.string(), z.number()]).optional(),
});

// AI autofill request schema
export const aiAutofillRequestSchema = z.object({
  product_name: z.string().min(1),
  category: z.string().optional(),
  selectedFields: z.array(z.string()).min(1, "At least one field must be selected"),
  customPrompt: z.string().optional(),
});

// Bulk AI autofill request schema
export const bulkAIAutofillRequestSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.union([z.string(), z.number()]).optional(),
        cost: z.union([z.string(), z.number()]).optional(),
      }),
    )
    .min(1, "At least one product is required"),
  category: z.string(),
  selectedFields: z.array(z.string()).min(1, "At least one field must be selected"),
  customPrompt: z.string().optional(),
});

// Type exports (infer TypeScript types from schemas)
export type ProductVisibility = z.infer<typeof productVisibilitySchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type StockStatus = z.infer<typeof stockStatusSchema>;
export type PricingTier = z.infer<typeof pricingTierSchema>;
export type ProductAttribute = z.infer<typeof productAttributeSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type BulkProduct = z.infer<typeof bulkProductSchema>;
export type AIAutofillRequest = z.infer<typeof aiAutofillRequestSchema>;
export type BulkAIAutofillRequest = z.infer<typeof bulkAIAutofillRequestSchema>;

/**
 * Helper function to validate and parse request data
 * Returns parsed data on success, throws ZodError on failure
 */
export function validateProductData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns success/error object instead of throwing
 */
export function safeValidateProductData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}
