import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin token verification (supports admin and readonly roles)
function verifyAdminToken(token: string): { valid: boolean; role?: string; username?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const isValid = (decoded.role === 'admin' || decoded.role === 'readonly') && decoded.username;
    return {
      valid: isValid,
      role: decoded.role,
      username: decoded.username
    };
  } catch {
    return { valid: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const authResult = verifyAdminToken(token);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userRole = authResult.role;
    const isReadOnly = userRole === 'readonly';

    // Get vendors with product counts
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select(`
        id,
        store_name,
        email,
        created_at,
        status,
        metadata,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get product counts for each vendor
    const vendorIds = vendors?.map(v => v.id) || [];
    const { data: productCounts } = await supabase
      .from('products')
      .select('vendor_id')
      .in('vendor_id', vendorIds);

    // Count products per vendor
    const productCountMap: Record<string, number> = {};
    productCounts?.forEach(p => {
      productCountMap[p.vendor_id] = (productCountMap[p.vendor_id] || 0) + 1;
    });

    // Transform to customer format
    const customers = vendors?.map(vendor => {
      // Determine status
      let displayStatus: 'active' | 'trial' | 'churned' = 'active';

      const createdDate = new Date(vendor.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (vendor.status !== 'active') {
        displayStatus = 'churned';
      } else if (daysSinceCreated <= 30) {
        displayStatus = 'trial';
      }

      return {
        id: vendor.id,
        email: isReadOnly ? '•••@•••.•••' : vendor.email, // Hide emails for readonly users
        name: vendor.store_name,
        created_at: vendor.created_at,
        last_active: vendor.updated_at || vendor.created_at,
        plan: 'WhaleTools', // SaaS product name
        status: displayStatus,
        revenue: 0, // TODO: Track actual subscription revenue
        productsCount: productCountMap[vendor.id] || 0
      };
    }) || [];

    return NextResponse.json({ customers });

  } catch (error: any) {
    console.error('Admin customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load customers' },
      { status: 500 }
    );
  }
}
