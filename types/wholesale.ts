// ================================================================
// WHOLESALE SYSTEM TYPES
// ================================================================

export interface Supplier {
  id: string;
  vendor_id: string;
  supplier_vendor_id: string | null;

  // External supplier info
  external_name: string | null;
  external_company: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;

  // Business
  tax_id: string | null;
  payment_terms: string | null;
  currency: string;

  is_active: boolean;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface WholesaleCustomer {
  id: string;
  vendor_id: string;
  customer_vendor_id: string | null;

  // External customer info
  external_company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Business details
  business_type: string | null;
  tax_id: string | null;
  resale_certificate: string | null;

  // Shipping address
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string;

  // Billing address
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;
  billing_country: string;

  // Pricing & terms
  pricing_tier: string | null;
  discount_percent: number;
  payment_terms: string | null;
  credit_limit: number | null;
  currency: string;

  is_active: boolean;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;

  po_type: 'inbound' | 'outbound';

  supplier_id: string | null;
  wholesale_customer_id: string | null;
  location_id: string | null;

  status: 'draft' | 'sent' | 'confirmed' | 'in_transit' | 'received' | 'fulfilled' | 'cancelled';

  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;

  ordered_at: string | null;
  expected_delivery_date: string | null;
  received_at: string | null;
  fulfilled_at: string | null;

  payment_terms: string | null;
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_due_date: string | null;

  shipping_method: string | null;
  tracking_number: string | null;
  carrier: string | null;

  internal_notes: string | null;
  customer_notes: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  supplier?: Supplier;
  wholesale_customer?: WholesaleCustomer;
  items?: PurchaseOrderItem[];
  payments?: PurchaseOrderPayment[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;

  product_id: string;
  variant_id: string | null;

  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;

  quantity_received: number;
  quantity_fulfilled: number;

  notes: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  product?: any; // Will be Product type
  variant?: any; // Will be ProductVariant type
}

export interface PurchaseOrderPayment {
  id: string;
  purchase_order_id: string;

  amount: number;
  payment_method: string;
  payment_date: string;

  reference_number: string | null;
  notes: string | null;

  created_by: string | null;
  created_at: string;
}

export interface InventoryReservation {
  id: string;

  product_id: string;
  variant_id: string | null;
  location_id: string;

  reservation_type: 'purchase_order' | 'order';
  reference_id: string;

  quantity: number;
  status: 'active' | 'fulfilled' | 'cancelled';
  expires_at: string | null;

  created_at: string;
  updated_at: string;
}

// ================================================================
// CREATE/UPDATE TYPES
// ================================================================

export interface CreateSupplierInput {
  supplier_vendor_id?: string;
  external_name?: string;
  external_company?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
}

export interface CreateWholesaleCustomerInput {
  customer_vendor_id?: string;
  external_company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  business_type?: string;
  tax_id?: string;
  resale_certificate?: string;

  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;

  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;

  pricing_tier?: string;
  discount_percent?: number;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  po_type: 'inbound' | 'outbound';
  supplier_id?: string;
  wholesale_customer_id?: string;
  location_id?: string;

  items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    tax_rate?: number;
  }[];

  shipping?: number;
  discount?: number;

  expected_delivery_date?: string;
  payment_terms?: string;
  shipping_method?: string;

  internal_notes?: string;
  customer_notes?: string;
}
