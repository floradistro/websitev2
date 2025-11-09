/**
 * Individual Automation Rule API
 * Update or delete automation rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireVendor } from '@/lib/auth/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { is_active, name, trigger_config, action_config } = body;

    // Build update object
    const updates: any = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (name) updates.name = name;
    if (trigger_config) updates.trigger_config = trigger_config;
    if (action_config) updates.action_config = action_config;

    // Update rule
    const { data: rule, error: updateError } = await supabase
      .from('marketing_automation_rules')
      .update(updates)
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (updateError) {
      console.error('Automation rule update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update automation rule', message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Automation rule update error:', error);
    return NextResponse.json(
      { error: 'Failed to update automation rule', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { id } = await params;

    // Delete rule
    const { error: deleteError } = await supabase
      .from('marketing_automation_rules')
      .delete()
      .eq('id', id)
      .eq('vendor_id', vendorId);

    if (deleteError) {
      console.error('Automation rule deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete automation rule', message: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Automation rule deleted',
    });
  } catch (error: any) {
    console.error('Automation rule deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation rule', message: error.message },
      { status: 500 }
    );
  }
}
