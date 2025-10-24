import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Reject wholesale application
 * Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    
    const { adminId, reason } = body;
    const { id: applicationId } = await params;
    
    if (!adminId || !reason) {
      return NextResponse.json(
        { error: 'Admin ID and rejection reason required' },
        { status: 400 }
      );
    }
    
    // Update application status
    const { data: application, error: updateError } = await supabase
      .from('wholesale_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: reason
      })
      .eq('id', applicationId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update application error:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject application', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Update customer status (trigger should do this, but let's ensure)
    await supabase
      .from('customers')
      .update({
        wholesale_application_status: 'rejected'
      })
      .eq('id', application.customer_id);
    
    return NextResponse.json({
      success: true,
      application
    });
    
  } catch (error: any) {
    console.error('Reject wholesale application error:', error);
    return NextResponse.json(
      { error: 'Failed to reject application', details: error.message },
      { status: 500 }
    );
  }
}

