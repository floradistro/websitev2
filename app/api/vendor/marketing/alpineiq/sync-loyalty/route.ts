/**
 * Alpine IQ Loyalty Data Sync
 * Syncs customer loyalty data from Alpine IQ to local database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    // Get vendor's Alpine IQ config
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    if (!vendor || (vendor as any).marketing_provider !== 'alpineiq') {
      return NextResponse.json(
        { error: 'Vendor not configured for Alpine IQ' },
        { status: 400 }
      );
    }

    // Initialize Alpine IQ client
    const alpineiq = createAlpineIQClient((vendor as any).marketing_config);

    // Test connection
    const connected = await alpineiq.testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: 'Failed to connect to Alpine IQ' },
        { status: 500 }
      );
    }

    // Fetch all loyalty members from Alpine IQ
    console.log('📥 Fetching loyalty members from Alpine IQ...');
    const members = await alpineiq.getLoyaltyMembers();

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No loyalty members found',
      });
    }

    console.log(`📊 Found ${members.length} loyalty members`);

    // Sync each member
    let synced = 0;
    let errors = 0;
    const results = [];

    for (const member of members) {
      try {
        // Find or create customer in local database
        let { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', member.email)
          .eq('vendor_id', vendorId)
          .single();

        if (!customer) {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              vendor_id: vendorId,
              email: member.email,
              phone: member.phone,
              first_name: member.firstName,
              last_name: member.lastName,
              birthdate: member.birthdate,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create customer:', createError);
            errors++;
            continue;
          }

          customer = newCustomer;
        }

        // Upsert loyalty data
        const { error: loyaltyError } = await supabase
          .from('customer_loyalty')
          .upsert({
            customer_id: customer.id,
            vendor_id: vendorId,
            provider: 'alpineiq',
            points_balance: member.points || 0,
            tier_name: member.tier || 'Member',
            tier_level: member.tierLevel || 1,
            lifetime_points: member.lifetimePoints || 0,
            alpineiq_customer_id: member.id,
            last_synced_at: new Date().toISOString(),
          });

        if (loyaltyError) {
          console.error('Failed to sync loyalty data:', loyaltyError);
          errors++;
        } else {
          synced++;
          results.push({
            email: member.email,
            points: member.points,
            tier: member.tier,
          });
        }
      } catch (error) {
        console.error('Error processing member:', error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: members.length,
      sample: results.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Loyalty sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync loyalty data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
