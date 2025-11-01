import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// GET /api/pos/registers - Get registers for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get all registers for location
    const { data: registers, error } = await supabase
      .from('pos_registers')
      .select('*')
      .eq('location_id', locationId)
      .eq('status', 'active')
      .order('register_number');

    if (error) {
      console.error('Error fetching registers:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch registers', details: error.message },
        { status: 500 }
      );
    }

    // Fetch active sessions for these registers
    const registerIds = registers.map(r => r.id);
    const { data: sessions } = await supabase
      .from('pos_sessions')
      .select(`
        id,
        register_id,
        session_number,
        total_sales,
        opened_at,
        user_id,
        users(first_name, last_name)
      `)
      .in('register_id', registerIds)
      .eq('status', 'open');

    // Map sessions to registers
    const sessionsMap = new Map();
    (sessions || []).forEach(session => {
      sessionsMap.set(session.register_id, session);
    });

    // Format the response to include session data properly
    const formattedRegisters = registers.map(reg => {
      const session = sessionsMap.get(reg.id);

      return {
        ...reg,
        current_session: session ? {
          id: session.id,
          session_number: session.session_number,
          total_sales: session.total_sales || 0,
          started_at: session.opened_at,
          user_name: session.users ? `${session.users.first_name} ${session.users.last_name}` : undefined,
        } : undefined,
      };
    });

    console.log('✅ Fetched registers for location:', locationId, 'Count:', formattedRegisters?.length);
    return NextResponse.json({ registers: formattedRegisters });
  } catch (error: any) {
    console.error('Error in GET /api/pos/registers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pos/registers - Create new register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, vendorId, registerName, deviceName, deviceId } = body;

    if (!locationId || !vendorId || !registerName) {
      return NextResponse.json(
        { error: 'locationId, vendorId, and registerName are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Generate register number
    const { data: registerNumber } = await supabase
      .rpc('generate_register_number', { p_location_id: locationId })
      .single();

    // Create register
    const { data: register, error } = await supabase
      .from('pos_registers')
      .insert({
        location_id: locationId,
        vendor_id: vendorId,
        register_number: registerNumber,
        register_name: registerName,
        device_name: deviceName || 'Unnamed Device',
        device_id: deviceId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating register:', error);
      return NextResponse.json(
        { error: 'Failed to create register' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      register,
      message: `Register ${registerNumber} created successfully`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/pos/registers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

