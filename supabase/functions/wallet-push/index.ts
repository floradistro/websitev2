/**
 * ============================================================================
 * APPLE WALLET PUSH NOTIFICATION SERVICE - EDGE FUNCTION
 * ============================================================================
 *
 * Sends push notifications to Apple's APNs to trigger wallet pass updates.
 * This function is called by database triggers when customer points change.
 *
 * Flow:
 * 1. Points change triggers database function
 * 2. Database queues push notification
 * 3. This function processes the queue
 * 4. Sends empty push to APNs for each registered device
 * 5. Apple tells devices to fetch updated pass from wallet-api
 *
 * Note: Wallet pushes are "empty" - they just tell the device to refresh.
 * The actual pass data is fetched by the device via wallet-api.
 *
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// ============================================================================
// CONFIGURATION
// ============================================================================
const APNS_HOST_PRODUCTION = 'api.push.apple.com';
const APNS_HOST_SANDBOX = 'api.sandbox.push.apple.com';
const APNS_PORT = 443;

// Use production by default, can be overridden via env
const USE_SANDBOX = Deno.env.get('APNS_USE_SANDBOX') === 'true';
const APNS_HOST = USE_SANDBOX ? APNS_HOST_SANDBOX : APNS_HOST_PRODUCTION;

const PASS_TYPE_IDENTIFIER = Deno.env.get('APPLE_PASS_TYPE_ID') || 'pass.com.whaletools.wallet';
const TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || 'Y9Q7L7SGR3';

// APNs authentication key (P8 format) - for JWT-based auth
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID') || '';
const APNS_AUTH_KEY_BASE64 = Deno.env.get('APNS_AUTH_KEY_BASE64') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[Wallet Push] Processing push queue');

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get batch of pending pushes from queue
    const { data: pendingPushes, error: queueError } = await supabase.rpc(
      'process_wallet_push_queue',
      { p_batch_size: 100 }
    );

    if (queueError) {
      console.error('[Wallet Push] Queue fetch error:', queueError);
      throw queueError;
    }

    if (!pendingPushes || pendingPushes.length === 0) {
      console.log('[Wallet Push] No pending pushes');
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Wallet Push] Processing ${pendingPushes.length} push requests`);

    // Generate APNs JWT token (valid for 1 hour)
    const apnsToken = await generateApnsToken();

    let successCount = 0;
    let failCount = 0;

    // Process each push
    for (const push of pendingPushes) {
      const { queue_id, customer_id, push_type, payload, push_tokens } = push;

      if (!push_tokens || push_tokens.length === 0) {
        console.log(`[Wallet Push] No push tokens for customer ${customer_id}, skipping`);
        await supabase.rpc('mark_push_completed', { p_queue_id: queue_id });
        continue;
      }

      console.log(`[Wallet Push] Sending ${push_type} push for customer ${customer_id} to ${push_tokens.length} devices`);

      let pushSuccess = false;
      let lastError = '';

      // Send push to each registered device
      for (const pushToken of push_tokens) {
        if (!pushToken) continue;

        try {
          const success = await sendApnsPush(pushToken, apnsToken);
          if (success) {
            pushSuccess = true;
            console.log(`[Wallet Push] Push sent successfully to token: ${pushToken.substring(0, 20)}...`);
          }
        } catch (error) {
          lastError = error.message;
          console.error(`[Wallet Push] Push failed for token ${pushToken.substring(0, 20)}...:`, error.message);
        }
      }

      // Update queue status
      if (pushSuccess) {
        await supabase.rpc('mark_push_completed', { p_queue_id: queue_id });
        successCount++;

        // Update pass record
        await supabase
          .from('wallet_passes')
          .update({
            last_push_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })
          .eq('customer_id', customer_id);

        // Update device registration stats
        await supabase
          .from('wallet_device_registrations')
          .update({
            last_push_at: new Date().toISOString(),
            push_count: supabase.rpc('increment_push_count'),
          })
          .eq('customer_id', customer_id);
      } else {
        await supabase.rpc('mark_push_failed', {
          p_queue_id: queue_id,
          p_error: lastError || 'All push tokens failed',
        });
        failCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Wallet Push] Completed in ${duration}ms - Success: ${successCount}, Failed: ${failCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: pendingPushes.length,
      successCount,
      failCount,
      duration: `${duration}ms`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Wallet Push] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// APNs INTEGRATION
// ============================================================================

/**
 * Generate JWT token for APNs authentication
 * Uses ES256 algorithm as required by Apple
 */
async function generateApnsToken(): Promise<string> {
  if (!APNS_KEY_ID || !APNS_AUTH_KEY_BASE64) {
    throw new Error('APNs authentication not configured - missing APNS_KEY_ID or APNS_AUTH_KEY_BASE64');
  }

  // Decode the P8 key from base64
  const keyPem = atob(APNS_AUTH_KEY_BASE64);

  // Import the private key
  const privateKey = await jose.importPKCS8(keyPem, 'ES256');

  // Create JWT
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({
      alg: 'ES256',
      kid: APNS_KEY_ID,
    })
    .setIssuer(TEAM_ID)
    .setIssuedAt()
    .sign(privateKey);

  return jwt;
}

/**
 * Send empty push notification to APNs
 * For Wallet passes, the push is empty - it just signals the device to refresh
 */
async function sendApnsPush(pushToken: string, apnsToken: string): Promise<boolean> {
  const url = `https://${APNS_HOST}:${APNS_PORT}/3/device/${pushToken}`;

  // For Wallet passes, the payload is empty
  // The device will call our web service to get the updated pass
  const payload = {};

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${apnsToken}`,
      'apns-topic': PASS_TYPE_IDENTIFIER,
      'apns-push-type': 'background', // Wallet updates are background pushes
      'apns-priority': '5', // 5 = send when convenient (power efficient)
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 200) {
    return true;
  }

  // Handle error responses
  const errorBody = await response.text();
  let errorReason = 'Unknown error';

  try {
    const errorJson = JSON.parse(errorBody);
    errorReason = errorJson.reason || errorReason;
  } catch {
    // Body might not be JSON
  }

  // Common APNs error codes:
  // 400 BadDeviceToken - Token is invalid
  // 403 Forbidden - Certificate/key issues
  // 404 DeviceTokenNotForTopic - Token not for this pass type
  // 410 Unregistered - Device unregistered, should delete token
  // 429 TooManyRequests - Rate limited

  if (response.status === 410) {
    // Device unregistered - we should clean up this token
    console.log(`[Wallet Push] Device unregistered, token should be deleted: ${pushToken.substring(0, 20)}...`);
    // Note: Cleanup should be handled by caller or a separate process
  }

  throw new Error(`APNs error ${response.status}: ${errorReason}`);
}

// ============================================================================
// MANUAL TRIGGER ENDPOINT
// ============================================================================

/**
 * Can also be called directly to trigger a push for specific customer
 * POST body: { customer_id: "uuid" }
 */
async function handleManualPush(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const customerId = body.customer_id;

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customer_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get customer's vendor_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('vendor_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Queue a push
    const { error: queueError } = await supabase
      .from('wallet_push_queue')
      .insert({
        customer_id: customerId,
        vendor_id: customer.vendor_id,
        push_type: 'manual',
        priority: 1, // High priority for manual pushes
        payload: { triggered_at: new Date().toISOString() },
      });

    if (queueError) {
      throw queueError;
    }

    return new Response(JSON.stringify({ success: true, message: 'Push queued' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
