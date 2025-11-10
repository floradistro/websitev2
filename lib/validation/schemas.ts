import { z } from "zod";

/**
 * Centralized validation schemas for API requests
 * Provides type-safe input validation and sanitization
 */

// ============================================================================
// Auth Schemas
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name required").max(100).trim(),
  lastName: z.string().min(1, "Last name required").max(100).trim(),
  phone: z.string().optional(),
});

// ============================================================================
// Product Schemas
// ============================================================================

export const ProductSchema = z.object({
  name: z.string().min(1, "Product name required").max(255).trim(),
  description: z.string().max(5000).optional(),
  slug: z.string().max(255).optional(),
  price: z.number().positive("Price must be positive").finite(),
  compare_at_price: z.number().positive().finite().optional().nullable(),
  cost: z
    .number()
    .nonnegative("Cost cannot be negative")
    .finite()
    .optional()
    .nullable(),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  primary_category_id: z
    .string()
    .uuid("Invalid category ID")
    .optional()
    .nullable(),
  barcode: z.string().max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  weight: z.number().nonnegative().finite().optional().nullable(),
  inventory_quantity: z
    .number()
    .int()
    .nonnegative("Inventory cannot be negative")
    .optional()
    .nullable(),
  track_inventory: z.boolean().optional(),
  allow_backorders: z.boolean().optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

export const BulkProductUpdateSchema = z.object({
  productIds: z
    .array(z.string().uuid())
    .min(1, "At least one product required"),
  updates: z
    .object({
      status: z.enum(["active", "draft", "archived"]).optional(),
      category_id: z.string().uuid().optional(),
      price: z.number().positive().finite().optional(),
      inventory_quantity: z.number().int().nonnegative().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one update field required",
    ),
});

// ============================================================================
// Order Schemas
// ============================================================================

export const OrderItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  product_name: z.string().min(1).max(255),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unit_price: z.number().positive("Price must be positive").finite(),
  price: z.number().positive().finite(),
  sku: z.string().max(100).optional().nullable(),
});

export const AddressSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  address: z.string().min(1).max(255).trim(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().min(2).max(50).trim(),
  zip: z.string().min(5).max(10).trim(),
  country: z.string().min(2).max(50).default("US"),
});

export const OrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  billing: AddressSchema,
  shipping: AddressSchema.optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  payment_method: z.enum(["credit_card", "cash", "check", "other"]).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const PaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").finite(),
  cardNumber: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
  expirationDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Invalid expiration date (MM/YY)"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV"),
  billing: AddressSchema,
  items: z.array(OrderItemSchema).min(1),
  customer_email: z.string().email().optional(),
});

// ============================================================================
// Customer Schemas
// ============================================================================

export const CustomerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  first_name: z.string().min(1).max(100).trim(),
  last_name: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  billing_address: z.record(z.string(), z.any()).optional().nullable(),
  shipping_address: z.record(z.string(), z.any()).optional().nullable(),
  is_wholesale_approved: z.boolean().optional(),
});

// ============================================================================
// Vendor Schemas
// ============================================================================

export const VendorSchema = z.object({
  store_name: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .trim(),
  email: z.string().email().toLowerCase().trim(),
  phone: z.string().max(20).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  vendor_type: z.enum(["standard", "premium", "enterprise"]).optional(),
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely parse and validate data with a schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (e: any) => `${e.path.join(".")}: ${e.message}`,
      );
      return { success: false, error: messages.join(", ") };
    }
    return { success: false, error: "Validation failed" };
  }
}

/**
 * Safe number parsing that validates the result
 */
export function parseNumber(value: any, defaultValue = 0): number {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return num;
}

/**
 * Safe integer parsing with bounds checking
 */
export function parseInteger(
  value: any,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return min;
  }
  return Math.max(min, Math.min(max, num));
}
