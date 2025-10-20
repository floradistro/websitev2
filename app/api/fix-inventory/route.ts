import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";

export async function GET(request: NextRequest) {
  try {
    // Call a direct SQL insertion PHP file
    const response = await axios.get(
      `${baseUrl}/wp-content/plugins/flora-inventory-matrix/quick-inventory-insert.php?vendor_id=2&location_id=45&products=41821,41819,41817,41815,41802,41796&t=${Date.now()}`
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inventory records created',
      data: response.data 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data 
    }, { status: 500 });
  }
}
