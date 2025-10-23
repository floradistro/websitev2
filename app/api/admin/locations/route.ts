import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const type = searchParams.get('type');
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('locations')
      .select(`
        *,
        vendors(store_name, email, logo_url)
      `)
      .order('created_at', { ascending: false });
    
    // Filter by vendor if provided
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    
    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    // Only show vendor locations
    query = query.not('vendor_id', 'is', null);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Supabase error loading locations:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, locations: data || [] });
  } catch (error: any) {
    console.error('❌ Error in locations API:', error);
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
        vendor_id, 
        name, 
        slug,
        type = 'retail',
        address_line1, 
        address_line2,
        city, 
        state, 
        zip,
        phone,
        email,
        pos_enabled = true,
        pricing_tier = 'standard',
        monthly_fee = 49.99,
        billing_status = 'active'
      } = data;
      
      // Validate required fields
      if (!vendor_id || !name) {
        return NextResponse.json({ 
          success: false, 
          error: 'vendor_id and name are required' 
        }, { status: 400 });
      }
      
      // Generate slug if not provided
      const locationSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const { data: location, error } = await supabase
        .from('locations')
        .insert({
          vendor_id,
          name,
          slug: locationSlug,
          type,
          address_line1,
          address_line2,
          city,
          state,
          zip,
          phone,
          email,
          pos_enabled,
          pricing_tier,
          monthly_fee,
          billing_status,
          is_active: true,
          accepts_online_orders: true,
          accepts_transfers: true
        })
        .select(`
          *,
          vendors(store_name, email, logo_url)
        `)
        .single();
      
      if (error) {
        console.error('❌ Error creating location:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        location, 
        message: `Location ${name} created successfully` 
      });
    }
    
    if (action === 'update') {
      const { location_id, name, type, address_line1, address_line2, city, state, zip, phone, email, pos_enabled, pricing_tier, monthly_fee, billing_status } = data;
      
      if (!location_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'location_id is required' 
        }, { status: 400 });
      }
      
      console.log('🔵 Updating location:', location_id);
      console.log('🔵 Update data:', { name, type, address_line1, city, state, zip, phone, email, pos_enabled, pricing_tier, monthly_fee, billing_status });
      
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only update fields that are provided
      if (name !== undefined) updatePayload.name = name;
      if (type !== undefined) updatePayload.type = type;
      if (address_line1 !== undefined) updatePayload.address_line1 = address_line1;
      if (address_line2 !== undefined) updatePayload.address_line2 = address_line2;
      if (city !== undefined) updatePayload.city = city;
      if (state !== undefined) updatePayload.state = state;
      if (zip !== undefined) updatePayload.zip = zip;
      if (phone !== undefined) updatePayload.phone = phone;
      if (email !== undefined) updatePayload.email = email;
      if (pos_enabled !== undefined) updatePayload.pos_enabled = pos_enabled;
      if (pricing_tier !== undefined) updatePayload.pricing_tier = pricing_tier;
      if (monthly_fee !== undefined) updatePayload.monthly_fee = monthly_fee;
      if (billing_status !== undefined) updatePayload.billing_status = billing_status;
      
      console.log('🔵 Final update payload:', updatePayload);
      
      const { data: location, error } = await supabase
        .from('locations')
        .update(updatePayload)
        .eq('id', location_id)
        .select(`
          *,
          vendors(store_name, email, logo_url)
        `)
        .single();
      
      if (error) {
        console.error('❌ Error updating location:', error);
        return NextResponse.json({ success: false, error: error.message, details: error }, { status: 400 });
      }
      
      console.log('✅ Location updated successfully:', location);
      
      return NextResponse.json({ 
        success: true, 
        location, 
        message: 'Location updated successfully' 
      });
    }
    
    if (action === 'delete') {
      const { location_id } = data;
      
      if (!location_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'location_id is required' 
        }, { status: 400 });
      }
      
      // Check if this is a primary location
      const { data: location, error: fetchError } = await supabase
        .from('locations')
        .select('is_primary, name')
        .eq('id', location_id)
        .single();
      
      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 400 });
      }
      
      if (location.is_primary) {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot delete primary location. Set another location as primary first.' 
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', location_id);
      
      if (error) {
        console.error('❌ Error deleting location:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Location ${location.name} deleted successfully` 
      });
    }
    
    if (action === 'toggle_status') {
      const { location_id, is_active } = data;
      
      if (!location_id || is_active === undefined) {
        return NextResponse.json({ 
          success: false, 
          error: 'location_id and is_active are required' 
        }, { status: 400 });
      }
      
      const { data: location, error } = await supabase
        .from('locations')
        .update({ is_active })
        .eq('id', location_id)
        .select(`
          *,
          vendors(store_name, email, logo_url)
        `)
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        location, 
        message: `Location ${is_active ? 'activated' : 'deactivated'}` 
      });
    }
    
    if (action === 'set_primary') {
      const { location_id } = data;
      
      if (!location_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'location_id is required' 
        }, { status: 400 });
      }
      
      const { data: location, error } = await supabase
        .from('locations')
        .update({ is_primary: true, monthly_fee: 0 })
        .eq('id', location_id)
        .select(`
          *,
          vendors(store_name, email, logo_url)
        `)
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        location, 
        message: 'Primary location updated' 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action. Valid actions: create, update, delete, toggle_status, set_primary' 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Error in locations API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

