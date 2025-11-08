import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/test-session-counter
 * Tests the increment_session_counter function
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    console.log('🧪 Testing increment_session_counter function...');

    // Step 1: Check if function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('increment_session_counter', {
        p_session_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID (won't match anything)
        p_counter_name: 'walk_in_sales',
        p_amount: 0
      });

    if (funcError) {
      if (funcError.message.includes('Could not find the function')) {
        return NextResponse.json({
          success: false,
          error: 'Function does not exist',
          message: 'The increment_session_counter function was not found in the database'
        }, { status: 404 });
      }

      // Other errors are OK for dummy test (like "no rows updated")
      console.log('✅ Function exists (error is expected for dummy test):', funcError.message);
    }

    // Step 2: Get an actual open session to test with
    const { data: sessions, error: sessionError } = await supabase
      .from('pos_sessions')
      .select('id, session_number, walk_in_sales, total_sales')
      .eq('status', 'open')
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Function exists and is callable',
        note: 'No open sessions to test with, but function is ready',
        functionExists: true
      });
    }

    const session = sessions[0];
    const beforeWalkIn = session.walk_in_sales;
    const beforeTotal = session.total_sales;

    console.log('📊 Before:', {
      session: session.session_number,
      walk_in_sales: beforeWalkIn,
      total_sales: beforeTotal
    });

    // Step 3: Test the function with a small amount
    const testAmount = 0.01;
    const { error: incrementError } = await supabase.rpc('increment_session_counter', {
      p_session_id: session.id,
      p_counter_name: 'walk_in_sales',
      p_amount: testAmount
    });

    if (incrementError) {
      console.error('❌ Increment failed:', incrementError);
      return NextResponse.json({
        success: false,
        error: 'Function call failed',
        details: incrementError.message
      }, { status: 500 });
    }

    // Step 4: Verify the update
    const { data: updatedSessions, error: verifyError } = await supabase
      .from('pos_sessions')
      .select('walk_in_sales, total_sales')
      .eq('id', session.id)
      .single();

    if (verifyError || !updatedSessions) {
      return NextResponse.json({
        success: false,
        error: 'Could not verify update',
        details: verifyError?.message
      }, { status: 500 });
    }

    const afterWalkIn = updatedSessions.walk_in_sales;
    const afterTotal = parseFloat(updatedSessions.total_sales);

    console.log('📊 After:', {
      walk_in_sales: afterWalkIn,
      total_sales: afterTotal
    });

    // Step 5: Rollback test (decrease counters back)
    await supabase
      .from('pos_sessions')
      .update({
        walk_in_sales: beforeWalkIn,
        total_sales: beforeTotal
      })
      .eq('id', session.id);

    console.log('✅ Test complete - counters rolled back');

    // Verify the function worked
    const walkInIncreased = afterWalkIn === beforeWalkIn + 1;
    const totalIncreased = Math.abs(afterTotal - (parseFloat(beforeTotal) + testAmount)) < 0.001;

    if (walkInIncreased && totalIncreased) {
      return NextResponse.json({
        success: true,
        message: '✅ increment_session_counter function is working correctly!',
        test: {
          session: session.session_number,
          before: {
            walk_in_sales: beforeWalkIn,
            total_sales: beforeTotal
          },
          after: {
            walk_in_sales: afterWalkIn,
            total_sales: afterTotal
          },
          expected: {
            walk_in_sales: beforeWalkIn + 1,
            total_sales: parseFloat(beforeTotal) + testAmount
          },
          walkInIncreased,
          totalIncreased
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Function did not update counters correctly',
        test: {
          before: { walk_in_sales: beforeWalkIn, total_sales: beforeTotal },
          after: { walk_in_sales: afterWalkIn, total_sales: afterTotal },
          walkInIncreased,
          totalIncreased
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
