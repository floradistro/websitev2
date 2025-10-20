import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    if (action === 'create_inventory_for_all_approved') {
      // Create inventory for products: 41819, 41817, 41815, 41802, 41796
      const products = [41819, 41817, 41815, 41802, 41796];
      const results = [];
      
      for (const productId of products) {
        try {
          // Use WooCommerce API to update product meta
          await axios.put(
            `${baseUrl}/wp-json/wc/v3/products/${productId}`,
            {
              meta_data: [
                { key: '_vendor_inventory_initialized', value: 'yes' },
                { key: '_stock_quantity', value: '0' },
                { key: '_stock_status', value: 'instock' }
              ]
            },
            {
              auth: { username: ck, password: cs }
            }
          );
          results.push({ product: productId, status: 'meta_updated' });
        } catch (e: any) {
          results.push({ product: productId, error: e.message });
        }
      }
      
      return NextResponse.json({ results });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
