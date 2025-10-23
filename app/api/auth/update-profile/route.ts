import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Update customer profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Build update object
    const updates: any = {};
    if (updateData.firstName) updates.first_name = updateData.firstName;
    if (updateData.lastName) updates.last_name = updateData.lastName;
    if (updateData.phone) updates.phone = updateData.phone;
    if (updateData.billing) updates.billing_address = updateData.billing;
    if (updateData.shipping) updates.shipping_address = updateData.shipping;
    if (updateData.avatar_url) updates.avatar_url = updateData.avatar_url;
    
    updates.updated_at = new Date().toISOString();
    
    const { data: customer, error: updateError } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    const user = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
      billing: customer.billing_address,
      shipping: customer.shipping_address,
      avatar_url: customer.avatar_url
    };
    
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Update failed. Please try again.' },
      { status: 500 }
    );
  }
}

