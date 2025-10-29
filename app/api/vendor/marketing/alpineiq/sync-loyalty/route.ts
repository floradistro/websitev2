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

    // Get optional limit from request body
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50; // Default to 50 to avoid timeout

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

    // Get loyalty audience info
    console.log('📊 Getting Alpine IQ loyalty program info...');
    const audienceInfo = await alpineiq.getLoyaltyAudienceInfo();

    if (!audienceInfo) {
      return NextResponse.json({
        success: false,
        error: 'No loyalty program found in Alpine IQ',
      });
    }

    console.log(`✅ Found ${audienceInfo.totalMembers} loyalty members in Alpine IQ`);

    // Get customers who have ordered from this vendor
    // Since customers are platform-level (no vendor_id), we need to find them through orders
    console.log(`📥 Finding customers who have ordered from this vendor (limit ${limit})...`);

    // Query: Get unique customer IDs from orders that have items from this vendor
    const { data: orderData, error: orderError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('vendor_id', vendorId)
      .limit(1000); // Get a large sample of orders

    if (orderError || !orderData || orderData.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No orders found for this vendor',
        audienceInfo,
      });
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderData.map(item => item.order_id))];

    // Get customers from those orders
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id')
      .in('id', orderIds)
      .not('customer_id', 'is', null);

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No customers found in orders',
        audienceInfo,
      });
    }

    // Get unique customer IDs
    const customerIds = [...new Set(orders.map(o => o.customer_id))].slice(0, limit);

    // Now get customer details
    const { data: customers } = await supabase
      .from('customers')
      .select('id, email, phone, first_name, last_name')
      .in('id', customerIds)
      .not('email', 'is', null);

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No customers with email addresses found',
        audienceInfo,
      });
    }

    console.log(`👥 Found ${customers.length} customers to sync`);

    const members = [];
    // Look up each customer in Alpine IQ
    for (const customer of customers) {
      try {
        const loyaltyData = await alpineiq.lookupCustomerLoyalty(customer.email);

        if (loyaltyData) {
          members.push({
            customerId: customer.id,
            ...loyaltyData,
          });
        }
      } catch (error) {
        console.error(`Failed to lookup ${customer.email}:`, error);
      }
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'None of your customers were found in Alpine IQ loyalty program',
        audienceInfo,
        customersChecked: customers.length,
      });
    }

    console.log(`✅ Found ${members.length} customers with loyalty data`);

    // Sync each member's loyalty data
    let synced = 0;
    let errors = 0;
    const results = [];

    for (const member of members) {
      try {
        // Upsert loyalty data
        const { error: loyaltyError } = await supabase
          .from('customer_loyalty')
          .upsert({
            customer_id: member.customerId,
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
      customersChecked: customers.length,
      totalLoyaltyMembers: audienceInfo.totalMembers,
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
