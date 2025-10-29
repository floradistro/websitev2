/**
 * Marketing Automation API
 * Create and manage automation rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    // Get automation rules
    const { data: rules, error } = await supabase
      .from('marketing_automation_rules')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Automation rules fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch automation rules', message: error.message },
        { status: 500 }
      );
    }

    // Get stats for each rule
    const rulesWithStats = await Promise.all(
      (rules || []).map(async (rule) => {
        // In a real implementation, query campaign_events for stats
        const stats = {
          triggered_count: 0,
          sent_count: 0,
          conversion_count: 0,
        };

        return {
          ...rule,
          stats,
        };
      })
    );

    return NextResponse.json(rulesWithStats);
  } catch (error: any) {
    console.error('Automation API error:', error);
    return NextResponse.json(
      { error: 'Failed to load automation rules', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, trigger_type, trigger_config, action_type, action_config, is_active } = body;

    // Validate required fields
    if (!name || !trigger_type || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger_type, action_type' },
        { status: 400 }
      );
    }

    // Create automation rule
    const { data: rule, error: createError } = await supabase
      .from('marketing_automation_rules')
      .insert({
        vendor_id: vendorId,
        name,
        trigger_type,
        trigger_config: trigger_config || {},
        action_type,
        action_config: action_config || {},
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Automation rule creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create automation rule', message: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    console.error('Automation rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule', message: error.message },
      { status: 500 }
    );
  }
}
