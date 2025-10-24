import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET - Fetch single vendor details for admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const { id: vendorId } = await params;
    
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        *,
        products:products(count)
      `)
      .eq('id', vendorId)
      .single();
    
    if (error) {
      console.error('Get vendor error:', error);
      return NextResponse.json(
        { error: 'Vendor not found', details: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      vendor 
    });
    
  } catch (error: any) {
    console.error('Get vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to get vendor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update vendor details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const { id: vendorId } = await params;
    const body = await request.json();
    
    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.store_name !== undefined) updates.store_name = body.store_name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.address !== undefined) updates.address = body.address;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state;
    if (body.zip !== undefined) updates.zip = body.zip;
    if (body.status !== undefined) updates.status = body.status;
    
    const { data: vendor, error: updateError } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update vendor error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vendor', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vendor
    });
    
  } catch (error: any) {
    console.error('Update vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor', details: error.message },
      { status: 500 }
    );
  }
}

