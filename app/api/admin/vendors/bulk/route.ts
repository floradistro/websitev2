import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Bulk delete vendors
export async function DELETE(request: NextRequest) {
  try {
    const { vendor_ids } = await request.json();

    if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      return NextResponse.json(
        { error: 'vendor_ids array is required' },
        { status: 400 }
      );
    }

    // Call bulk delete function
    const { data, error } = await supabase.rpc('bulk_delete_vendors', {
      vendor_ids
    });

    if (error) {
      console.error('Bulk delete vendors error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = data || [];
    const successful = results.filter((r: any) => r.success);
    const failed = results.filter((r: any) => !r.success);

    return NextResponse.json({
      success: true,
      results: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        details: results
      }
    });
  } catch (error: any) {
    console.error('Bulk delete vendors error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk update vendor status
export async function PATCH(request: NextRequest) {
  try {
    const { vendor_ids, status } = await request.json();

    if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      return NextResponse.json(
        { error: 'vendor_ids array is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    // Call bulk update function
    const { data, error } = await supabase.rpc('bulk_update_vendor_status', {
      vendor_ids,
      new_status: status
    });

    if (error) {
      console.error('Bulk update vendors error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = data || [];
    const successful = results.filter((r: any) => r.success);
    const failed = results.filter((r: any) => !r.success);

    return NextResponse.json({
      success: true,
      results: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        details: results
      }
    });
  } catch (error: any) {
    console.error('Bulk update vendors error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



