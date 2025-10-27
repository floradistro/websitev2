import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { locationId, userId, openingCash = 0, vendorId } = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId' },
        { status: 400 }
      );
    }

    // Check if there's already an open session
    const { data: existing } = await supabase
      .from('pos_sessions')
      .select('id, session_number')
      .eq('location_id', locationId)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Session already open', session: existing },
        { status: 409 }
      );
    }

    // Get location details
    const { data: location } = await supabase
      .from('locations')
      .select('vendor_id, slug')
      .eq('id', locationId)
      .single();

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Generate session number
    const locationCode = location.slug.substring(0, 3).toUpperCase();
    const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Get next sequence for today
    const { data: todaySessions } = await supabase
      .from('pos_sessions')
      .select('session_number')
      .eq('location_id', locationId)
      .gte('opened_at', new Date().toISOString().split('T')[0])
      .order('opened_at', { ascending: false });

    const sequence = (todaySessions?.length || 0) + 1;
    const sessionNumber = `POS-${locationCode}-${dateCode}-${sequence.toString().padStart(3, '0')}`;

    // Get a user_id (test mode: use any staff member if userId not provided)
    let finalUserId = userId;
    if (!userId) {
      const { data: anyUser } = await supabase
        .from('users')
        .select('id')
        .eq('vendor_id', location.vendor_id)
        .limit(1)
        .maybeSingle();
      
      finalUserId = anyUser?.id;
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: 'No valid user found. Create a POS staff member first.' },
        { status: 400 }
      );
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('pos_sessions')
      .insert({
        location_id: locationId,
        vendor_id: vendorId || location.vendor_id,
        user_id: finalUserId,
        session_number: sessionNumber,
        status: 'open',
        opening_cash: openingCash,
        total_sales: 0,
        total_transactions: 0,
        metadata: {
          opened_via: 'pos_register',
          opened_at_timestamp: Date.now(),
          test_mode: !userId,
        },
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session', details: sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      message: `Session ${sessionNumber} opened successfully`,
    });
  } catch (error: any) {
    console.error('Error in open session endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

