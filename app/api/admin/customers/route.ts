import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get recent vendors (WhaleTools customers)
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select(`
        id,
        store_name,
        email,
        created_at,
        is_active,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform to customer format
    const customers = vendors?.map(vendor => {
      // Determine status
      let status: 'active' | 'trial' | 'churned' = 'active';

      const createdDate = new Date(vendor.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!vendor.is_active) {
        status = 'churned';
      } else if (daysSinceCreated <= 30) {
        status = 'trial';
      }

      return {
        id: vendor.id,
        email: vendor.email,
        name: vendor.store_name,
        created_at: vendor.created_at,
        last_active: vendor.metadata?.last_login || null,
        plan: 'Standard', // TODO: Add plan field when you implement pricing tiers
        status
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
