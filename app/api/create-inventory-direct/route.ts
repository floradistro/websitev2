import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export async function GET(request: NextRequest) {
  try {
    // Get all vendor 2 approved products and initialize them via WooCommerce
    const productIds = [41821, 41823, 41819, 41817, 41815, 41802, 41796, 41794, 41795];
    const results = [];
    
    for (const productId of productIds) {
      try {
        await axios.put(
          `${baseUrl}/wp-json/wc/v3/products/${productId}`,
          {
            stock_quantity: 0,
            stock_status: 'instock',
            manage_stock: true
          },
          {
            auth: { username: ck, password: cs }
          }
        );
        results.push({ product: productId, status: 'initialized' });
      } catch (e: any) {
        results.push({ product: productId, error: e.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'All products initialized'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
