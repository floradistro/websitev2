import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        vendors(store_name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading users:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, users: data || [] });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const supabase = getServiceSupabase();
    
    if (action === 'create') {
      const { 
        email,
        first_name,
        last_name,
        role = 'pos_staff',
        vendor_id,
        phone,
        employee_id
      } = data;
      
      if (!email || !first_name || !last_name) {
        return NextResponse.json({
          success: false,
          error: 'Email, first name, and last name are required'
        }, { status: 400 });
      }
      
      // Create user in users table
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          first_name,
          last_name,
          role,
          vendor_id: vendor_id || null,
          phone,
          employee_id,
          status: 'active',
          login_enabled: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        user,
        message: `User ${first_name} ${last_name} created successfully`
      });
    }
    
    if (action === 'update') {
      const { user_id, first_name, last_name, phone, role, employee_id } = data;
      
      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'user_id is required'
        }, { status: 400 });
      }
      
      const updatePayload: any = {};
      if (first_name !== undefined) updatePayload.first_name = first_name;
      if (last_name !== undefined) updatePayload.last_name = last_name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (role !== undefined) updatePayload.role = role;
      if (employee_id !== undefined) updatePayload.employee_id = employee_id;
      
      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user_id);
      
      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'User updated successfully'
      });
    }
    
    if (action === 'toggle_status') {
      const { user_id, status } = data;
      
      if (!user_id || !status) {
        return NextResponse.json({
          success: false,
          error: 'user_id and status are required'
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('users')
        .update({ status, login_enabled: status === 'active' })
        .eq('id', user_id);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: `User ${status === 'active' ? 'activated' : 'deactivated'}`
      });
    }
    
    if (action === 'delete') {
      const { user_id } = data;
      
      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'user_id is required'
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user_id);
      
      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Valid actions: create, update, toggle_status, delete'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

