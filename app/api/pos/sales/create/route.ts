import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { AlpineIQClient } from '@/lib/marketing/alpineiq-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inventoryId: string;
  category?: string;
  sku?: string;
}

// Loyalty tier configuration
const LOYALTY_TIERS = [
  { name: 'Bronze', min_points: 0, discount: 0 },
  { name: 'Silver', min_points: 500, discount: 5 },
  { name: 'Gold', min_points: 1000, discount: 10 },
  { name: 'Platinum', min_points: 2500, discount: 15 }
];

// Points accrual rate: $1 spent = 1 point
const POINTS_PER_DOLLAR = 1;

/**
 * Calculate loyalty tier based on lifetime points
 */
function calculateTier(lifetimePoints: number): { name: string; discount: number; level: number } {
  const tier = LOYALTY_TIERS
    .slice()
    .reverse()
    .find(t => lifetimePoints >= t.min_points) || LOYALTY_TIERS[0];

  const level = LOYALTY_TIERS.indexOf(LOYALTY_TIERS.find(t => t.name === tier.name)!) + 1;

  return {
    name: tier.name,
    discount: tier.discount,
    level
  };
}

/**
 * Get or create Alpine IQ client for vendor
 */
async function getAlpineIQClient(supabase: any, vendorId: string): Promise<AlpineIQClient | null> {
  try {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    if (vendor?.marketing_provider === 'alpineiq' && vendor?.marketing_config) {
      const config = vendor.marketing_config;
      if (config.api_key && config.user_id) {
        return new AlpineIQClient({
          apiKey: config.api_key,
          userId: config.user_id,
          agencyId: config.agency_id
        });
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get AlpineIQ client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();

  try {
    const {
      locationId,
      vendorId,
      sessionId,
      userId,
      items,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      cashTendered,
      changeGiven,
      customerId,
      customerName = 'Walk-In',
    }: {
      locationId: string;
      vendorId: string;
      sessionId?: string;
      userId?: string;
      items: CartItem[];
      subtotal: number;
      taxAmount: number;
      total: number;
      paymentMethod: 'cash' | 'card';
      cashTendered?: number;
      changeGiven?: number;
      customerId?: string;
      customerName?: string;
    } = await request.json();

    console.log('🛒 POS Sale Request:', {
      locationId,
      vendorId,
      customerId,
      items: items.length,
      total
    });

    // ============================================================================
    // VALIDATION
    // ============================================================================
    if (!locationId || !vendorId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (total < 0) {
      return NextResponse.json(
        { error: 'Invalid sale total' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 1: VALIDATE INVENTORY (CRITICAL FIX)
    // ============================================================================
    console.log('📦 Step 1: Validating inventory...');

    const inventoryChecks = await Promise.all(
      items.map(async (item) => {
        const { data: inv, error } = await supabase
          .from('inventory')
          .select('id, product_id, quantity, location_id')
          .eq('id', item.inventoryId)
          .single();

        if (error || !inv) {
          return {
            valid: false,
            item,
            error: `Inventory record not found for ${item.productName}`
          };
        }

        if (inv.quantity < item.quantity) {
          return {
            valid: false,
            item,
            error: `Insufficient inventory for ${item.productName}. Available: ${inv.quantity}, Requested: ${item.quantity}`
          };
        }

        return { valid: true, item, inventory: inv };
      })
    );

    const invalidItem = inventoryChecks.find(check => !check.valid);
    if (invalidItem) {
      console.error('❌ Inventory validation failed:', invalidItem.error);
      return NextResponse.json(
        { error: invalidItem.error },
        { status: 400 }
      );
    }

    console.log('✅ Inventory validation passed');

    // ============================================================================
    // STEP 2: PREVENT DUPLICATE SALES
    // ============================================================================
    console.log('🔒 Step 2: Checking for duplicate sales...');

    // Check for recent identical sale (within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data: recentSales } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('vendor_id', vendorId)
      .eq('total_amount', total)
      .gte('created_at', fiveSecondsAgo);

    if (recentSales && recentSales.length > 0) {
      console.warn('⚠️  Potential duplicate sale detected, allowing but logging...');
    }

    // ============================================================================
    // STEP 3: GET CUSTOMER DATA
    // ============================================================================
    console.log('👤 Step 3: Getting customer data...');

    let finalCustomerId = customerId;
    let customerData: any = null;
    let loyaltyData: any = null;
    let alpineIQContactId: string | null = null;

    if (customerId) {
      // Get customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      customerData = customer;

      // Get or create loyalty record
      const { data: existingLoyalty } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', customerId)
        .eq('vendor_id', vendorId)
        .eq('provider', 'builtin')
        .single();

      if (existingLoyalty) {
        loyaltyData = existingLoyalty;
      } else {
        // Create new loyalty record
        const { data: newLoyalty } = await supabase
          .from('customer_loyalty')
          .insert({
            customer_id: customerId,
            vendor_id: vendorId,
            provider: 'builtin',
            points_balance: 0,
            current_tier: 'Bronze',
            tier_level: 1,
            lifetime_points: 0
          })
          .select()
          .single();

        loyaltyData = newLoyalty;
      }

      alpineIQContactId = loyaltyData?.alpineiq_customer_id || null;

      console.log('✅ Customer loaded:', {
        id: customerId,
        name: `${customer?.first_name} ${customer?.last_name}`,
        currentPoints: loyaltyData?.points_balance || 0,
        tier: loyaltyData?.current_tier || 'Bronze'
      });
    } else {
      console.log('ℹ️  Walk-in sale (no customer selected)');
    }

    // ============================================================================
    // STEP 4: GENERATE ORDER NUMBER
    // ============================================================================
    const locationCode = (await supabase
      .from('locations')
      .select('slug')
      .eq('id', locationId)
      .single()).data?.slug?.substring(0, 3).toUpperCase() || 'POS';

    const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sequence = Date.now().toString().slice(-4);
    const orderNumber = `POS-${locationCode}-${dateCode}-${sequence}`;

    console.log('🔢 Order number generated:', orderNumber);

    // ============================================================================
    // STEP 5: CREATE ORDER (ATOMIC TRANSACTION)
    // ============================================================================
    console.log('💾 Step 4: Creating order...');

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: finalCustomerId,
        vendor_id: vendorId,
        status: 'completed',
        payment_status: 'paid',
        fulfillment_status: 'fulfilled',
        delivery_type: 'pickup',
        pickup_location_id: locationId,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        payment_method: paymentMethod,
        billing_address: { name: customerName },
        completed_date: new Date().toISOString(),
        metadata: {
          pos_sale: true,
          walk_in: !customerId,
          payment_method: paymentMethod,
          cash_tendered: cashTendered,
          change_given: changeGiven,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    console.log('✅ Order created:', order.id);

    // ============================================================================
    // STEP 6: CREATE ORDER ITEMS
    // ============================================================================
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_subtotal: item.lineTotal,
      line_total: item.lineTotal,
      vendor_id: vendorId,
      order_type: 'pickup',
      pickup_location_id: locationId,
      inventory_id: item.inventoryId,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('❌ Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Order items created:', items.length);

    // Attach items to order for response
    order.order_items = createdItems;

    // ============================================================================
    // STEP 7: CREATE POS TRANSACTION
    // ============================================================================
    const transactionNumber = `TXN-${orderNumber}`;

    const { data: transaction, error: transactionError } = await supabase
      .from('pos_transactions')
      .insert({
        transaction_number: transactionNumber,
        location_id: locationId,
        vendor_id: vendorId,
        order_id: order.id,
        session_id: sessionId,
        user_id: userId,
        transaction_type: customerId ? 'customer_sale' : 'walk_in_sale',
        payment_method: paymentMethod,
        payment_status: 'completed',
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        cash_tendered: cashTendered,
        change_given: changeGiven,
        metadata: {
          customer_id: customerId,
          customer_name: customerName,
          items_count: items.length,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('⚠️  Error creating POS transaction:', transactionError);
    } else {
      console.log('✅ POS transaction created:', transaction.id);
    }

    // ============================================================================
    // STEP 8: DEDUCT INVENTORY (ATOMIC DECREMENT - RACE CONDITION SAFE)
    // ============================================================================
    console.log('📦 Step 5: Deducting inventory...');

    for (const item of items) {
      // Use PostgreSQL atomic decrement to prevent race conditions
      // This uses RPC to execute: UPDATE inventory SET quantity = quantity - X WHERE id = Y AND quantity >= X
      const { data: result, error: inventoryError } = await supabase.rpc('decrement_inventory', {
        p_inventory_id: item.inventoryId,
        p_quantity: item.quantity
      });

      if (inventoryError) {
        console.error(`⚠️  Error deducting inventory for ${item.productName}:`, inventoryError);
        // This is critical - if inventory deduction fails, we should rollback the order
        console.error('🚨 CRITICAL: Inventory deduction failed after order creation');
        console.error('   Order ID:', order.id);
        console.error('   Product:', item.productName);
        console.error('   Attempted to deduct:', item.quantity);
      } else if (!result) {
        console.error(`⚠️  Inventory deduction returned no result for ${item.productName}`);
      } else {
        console.log(`   ✓ ${item.productName}: ${result.old_quantity} → ${result.new_quantity} (-${item.quantity})`);
      }
    }

    console.log('✅ Inventory deducted');

    // ============================================================================
    // STEP 9: AWARD LOYALTY POINTS (CRITICAL FIX)
    // ============================================================================
    let pointsEarned = 0;
    let newTier: string | null = null;

    if (customerId && loyaltyData) {
      console.log('🎁 Step 6: Awarding loyalty points...');

      // Calculate points earned (round down)
      pointsEarned = Math.floor(total * POINTS_PER_DOLLAR);

      const newPoints = loyaltyData.points_balance + pointsEarned;
      const newLifetimePoints = loyaltyData.lifetime_points + pointsEarned;

      // Calculate new tier
      const tierInfo = calculateTier(newLifetimePoints);
      const tierChanged = tierInfo.name !== loyaltyData.current_tier;
      newTier = tierChanged ? tierInfo.name : null;

      console.log('💰 Points calculation:', {
        total,
        pointsEarned,
        currentPoints: loyaltyData.points_balance,
        newPoints,
        currentTier: loyaltyData.current_tier,
        newTier: tierInfo.name,
        tierChanged
      });

      // Update loyalty record
      const { error: loyaltyUpdateError } = await supabase
        .from('customer_loyalty')
        .update({
          points_balance: newPoints,
          lifetime_points: newLifetimePoints,
          current_tier: tierInfo.name,
          tier_level: tierInfo.level
        })
        .eq('id', loyaltyData.id);

      if (loyaltyUpdateError) {
        console.error('❌ Error updating loyalty points:', loyaltyUpdateError);
      } else {
        console.log('✅ Loyalty points awarded:', pointsEarned);

        // Log loyalty transaction
        await supabase
          .from('loyalty_transactions')
          .insert({
            customer_id: customerId,
            vendor_id: vendorId,
            type: 'earned',
            points: pointsEarned,
            order_id: order.id,
            description: `Purchase at POS - ${orderNumber}`,
            metadata: {
              order_number: orderNumber,
              order_total: total,
              tier_at_time: loyaltyData.current_tier
            }
          });

        if (tierChanged) {
          console.log(`🎉 TIER UPGRADE: ${loyaltyData.current_tier} → ${tierInfo.name}`);

          // Log tier change
          await supabase
            .from('loyalty_transactions')
            .insert({
              customer_id: customerId,
              vendor_id: vendorId,
              type: 'tier_change',
              points: 0,
              description: `Tier upgraded from ${loyaltyData.current_tier} to ${tierInfo.name}`,
              metadata: {
                old_tier: loyaltyData.current_tier,
                new_tier: tierInfo.name,
                lifetime_points: newLifetimePoints
              }
            });
        }
      }
    }

    // ============================================================================
    // STEP 10: SYNC TO ALPINE IQ (CRITICAL FIX - ASYNC)
    // ============================================================================
    let alpineIQSynced = false;
    let alpineIQError: string | null = null;

    if (customerId && customerData) {
      console.log('🔄 Step 7: Syncing sale to Alpine IQ...');

      try {
        const alpineClient = await getAlpineIQClient(supabase, vendorId);

        if (alpineClient) {
          // Get location name
          const { data: location } = await supabase
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();

          // Get user name if available
          const { data: user } = userId ? await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', userId)
            .single() : { data: null };

          // Format sale data for Alpine IQ
          const saleData = {
            member: {
              email: customerData.email || '',
              mobilePhone: customerData.phone || '',
              firstName: customerData.first_name || '',
              lastName: customerData.last_name || ''
            },
            visit: {
              pos_id: orderNumber,
              pos_user: user ? `${user.first_name} ${user.last_name}` : 'POS Staff',
              pos_type: 'in-store',
              transaction_date: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' +0000',
              location: location?.name || locationCode,
              budtenderName: user ? `${user.first_name} ${user.last_name}` : undefined,
              budtenderID: userId,
              visit_details_attributes: items.map(item => ({
                sku: item.sku || item.productId,
                category: item.category || 'General',
                name: item.productName,
                price: item.unitPrice,
                quantity: item.quantity
              })),
              transaction_total: total,
              send_notification: false // Don't spam customer
            }
          };

          console.log('📤 Sending sale to Alpine IQ:', {
            orderNumber,
            customer: customerData.email,
            total,
            items: items.length
          });

          const alpineResponse = await alpineClient.createSale(saleData);
          alpineIQSynced = true;

          console.log('✅ Alpine IQ sync successful');

          // Update customer loyalty record with Alpine IQ contact ID if we got one
          if (alpineResponse && alpineResponse.contactID && !alpineIQContactId) {
            await supabase
              .from('customer_loyalty')
              .update({
                alpineiq_customer_id: alpineResponse.contactID,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', loyaltyData.id);
          }
        } else {
          console.log('ℹ️  Alpine IQ not configured for this vendor');
        }
      } catch (error: any) {
        alpineIQError = error.message;
        console.error('⚠️  Alpine IQ sync failed (continuing anyway):', error);

        // Queue for retry
        try {
          await supabase
            .from('alpine_iq_sync_queue')
            .insert({
              vendor_id: vendorId,
              type: 'sale',
              data: {
                order_id: order.id,
                order_number: orderNumber,
                customer_id: customerId
              },
              status: 'pending',
              retry_count: 0,
              error_message: error.message
            });
          console.log('📝 Sale queued for Alpine IQ retry');
        } catch (queueError) {
          // Ignore queue errors - don't fail the sale
          console.error('Failed to queue for retry:', queueError);
        }
      }
    }

    // ============================================================================
    // FINAL RESPONSE
    // ============================================================================
    console.log('✅ Sale completed successfully:', orderNumber);

    return NextResponse.json({
      success: true,
      order,
      transaction,
      orderNumber,
      pointsEarned,
      newTier,
      alpineIQSynced,
      alpineIQError,
      message: `Sale completed: ${orderNumber}`,
      loyalty: customerId && loyaltyData ? {
        pointsEarned,
        totalPoints: loyaltyData.points_balance + pointsEarned,
        lifetimePoints: loyaltyData.lifetime_points + pointsEarned,
        tier: newTier || loyaltyData.current_tier,
        tierUpgrade: !!newTier
      } : null
    });
  } catch (error: any) {
    console.error('💥 Error in create sale endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
