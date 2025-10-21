import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Get all employees for this vendor
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading employees:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, employees: data || [] });
  } catch (error: any) {
    console.error('Error in vendor employees API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    const body = await request.json();
    const { action, ...data } = body;
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    if (action === 'create') {
      const { email, first_name, last_name, role, phone, employee_id } = data;
      
      if (!email || !first_name || !last_name) {
        return NextResponse.json({
          success: false,
          error: 'Email, first name, and last name are required'
        }, { status: 400 });
      }
      
      try {
        // Step 1: Create user in Supabase Auth
        const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!123';
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
            role: role || 'pos_staff'
          }
        });
        
        if (authError) {
          console.error('Error creating auth user:', authError);
          return NextResponse.json({ 
            success: false, 
            error: `Failed to create login: ${authError.message}` 
          }, { status: 400 });
        }
        
        // Step 2: Create employee in users table
        const { data: employee, error: dbError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authUser.user.id,
            email,
            first_name,
            last_name,
            role: role || 'pos_staff',
            vendor_id: vendorId,
            phone,
            employee_id,
            status: 'active',
            login_enabled: true
          })
          .select()
          .single();
        
        if (dbError) {
          console.error('Error creating employee in database:', dbError);
          // Cleanup: delete auth user if database insert fails
          await supabase.auth.admin.deleteUser(authUser.user.id);
          return NextResponse.json({ 
            success: false, 
            error: `Database error: ${dbError.message}` 
          }, { status: 400 });
        }
        
        // Step 3: Send password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
        });
        
        if (resetError) {
          console.warn('Failed to send password reset email:', resetError);
        }
        
        return NextResponse.json({
          success: true,
          employee,
          message: `${first_name} ${last_name} added successfully. Password reset email sent to ${email}.`
        });
        
      } catch (error: any) {
        console.error('Error in employee creation:', error);
        return NextResponse.json({ 
          success: false, 
          error: error.message || 'Failed to create employee' 
        }, { status: 500 });
      }
    }
    
    if (action === 'update') {
      const { employee_id, first_name, last_name, phone, role, employee_id: empId } = data;
      
      if (!employee_id) {
        return NextResponse.json({
          success: false,
          error: 'employee_id is required'
        }, { status: 400 });
      }
      
      // Verify employee belongs to vendor
      const { data: emp, error: verifyError } = await supabase
        .from('users')
        .select('vendor_id')
        .eq('id', employee_id)
        .single();
      
      if (verifyError || emp?.vendor_id !== vendorId) {
        return NextResponse.json({
          success: false,
          error: 'Employee not found or access denied'
        }, { status: 403 });
      }
      
      const updatePayload: any = {};
      if (first_name !== undefined) updatePayload.first_name = first_name;
      if (last_name !== undefined) updatePayload.last_name = last_name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (role !== undefined) updatePayload.role = role;
      if (empId !== undefined) updatePayload.employee_id = empId;
      
      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', employee_id)
        .eq('vendor_id', vendorId);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Employee updated successfully'
      });
    }
    
    if (action === 'toggle_status') {
      const { employee_id, status } = data;
      
      if (!employee_id || !status) {
        return NextResponse.json({
          success: false,
          error: 'employee_id and status are required'
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('users')
        .update({ status, login_enabled: status === 'active' })
        .eq('id', employee_id)
        .eq('vendor_id', vendorId);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Employee ${status === 'active' ? 'activated' : 'deactivated'}`
      });
    }
    
    if (action === 'assign_locations') {
      const { employee_id, location_ids } = data;
      
      if (!employee_id || !location_ids || !Array.isArray(location_ids)) {
        return NextResponse.json({
          success: false,
          error: 'employee_id and location_ids array are required'
        }, { status: 400 });
      }
      
      // Verify employee belongs to vendor
      const { data: emp, error: verifyError } = await supabase
        .from('users')
        .select('vendor_id')
        .eq('id', employee_id)
        .single();
      
      if (verifyError || emp?.vendor_id !== vendorId) {
        return NextResponse.json({
          success: false,
          error: 'Employee not found or access denied'
        }, { status: 403 });
      }
      
      // First, remove existing assignments
      await supabase
        .from('user_locations')
        .delete()
        .eq('user_id', employee_id);
      
      // Then add new assignments
      const assignments = location_ids.map(location_id => ({
        user_id: employee_id,
        location_id,
        can_sell: true,
        can_manage_inventory: true
      }));
      
      const { error } = await supabase
        .from('user_locations')
        .insert(assignments);
      
      if (error) {
        console.error('Error assigning locations:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Locations assigned successfully'
      });
    }
    
    if (action === 'delete') {
      const { employee_id } = data;
      
      if (!employee_id) {
        return NextResponse.json({
          success: false,
          error: 'employee_id is required'
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', employee_id)
        .eq('vendor_id', vendorId);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Employee removed successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error in vendor employees API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

