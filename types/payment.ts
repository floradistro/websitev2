/**
 * Payment and Order Type Definitions
 * Provides type safety for payment processing and order management
 */

export interface CartItem {
  id: string;
  product_id?: string;
  name: string;
  sku?: string;
  image?: string;
  price: string | number;
  quantity: string | number;
  vendor_id?: string;
  orderType?: "delivery" | "pickup";
  locationId?: string;
  locationName?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentToken {
  dataDescriptor?: string;
  dataValue: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
}

// Using the actual AuthorizeNet SDK type - import from the SDK
// This interface matches the TransactionResponse from authorizenet SDK
export interface AuthorizeNetTransactionResponse {
  getTransId(): string;
  [key: string]: any; // Allow other SDK methods
}

export interface OrderItem {
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  line_subtotal: number;
  line_total: number;
  tax_amount: number;
  vendor_id?: string;
  order_type?: string;
  pickup_location_id?: string;
  pickup_location_name?: string;
}
