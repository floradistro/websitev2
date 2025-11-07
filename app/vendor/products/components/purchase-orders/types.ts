/**
 * Shared TypeScript types for Purchase Orders
 */

export interface POItem {
  id: string;
  product_id: string;
  quantity: number;
  quantity_received?: number;
  quantity_remaining?: number;
  unit_price: number;
  line_total?: number;
  receive_status?: string;
  product?: {
    id?: string;
    name: string;
    sku?: string;
  };
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  po_type?: 'inbound' | 'outbound';
  status: string;
  total?: number;
  created_at?: string;
  location?: { name: string };
  supplier?: { external_name: string };
  wholesale_customer?: { external_company_name: string };
  items: POItem[];
}
