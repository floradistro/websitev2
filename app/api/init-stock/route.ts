import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    
    // Update WooCommerce product stock directly
    const response = await axios.put(
      `${baseUrl}/wp-json/wc/v3/products/${productId}`,
      {
        stock_quantity: 0,
        stock_status: 'instock',
        manage_stock: true
      },
      {
        auth: {
          username: ck,
          password: cs
        }
      }
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Stock initialized',
      product_id: productId
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data 
    }, { status: 500 });
  }
}
