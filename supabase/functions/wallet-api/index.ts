/**
 * ============================================================================
 * APPLE WALLET WEB SERVICE API - EDGE FUNCTION
 * ============================================================================
 *
 * This implements Apple's required Web Service API for Wallet passes.
 * Apple devices call these endpoints to:
 * 1. Register for push notifications
 * 2. Unregister from push notifications
 * 3. Get list of updated passes
 * 4. Fetch updated pass content
 * 5. Log errors
 *
 * Reference: https://developer.apple.com/documentation/walletpasses/adding_a_web_service_to_update_passes
 *
 * Endpoints (Apple spec):
 * POST   /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
 * GET    /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
 * GET    /v1/passes/{passTypeIdentifier}/{serialNumber}
 * POST   /v1/log
 *
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// CONFIGURATION
// ============================================================================
const PASS_TYPE_IDENTIFIER = Deno.env.get('APPLE_PASS_TYPE_ID') || 'pass.com.whaletools.wallet';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  console.log(`[Wallet API] ${method} ${path}`);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ========================================================================
    // Route: POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    // Purpose: Register a device to receive push notifications for a pass
    // ========================================================================
    const registerMatch = path.match(
      /^\/v1\/devices\/([^\/]+)\/registrations\/([^\/]+)\/([^\/]+)$/
    );
    if (registerMatch && method === 'POST') {
      const [, deviceLibraryId, passTypeId, serialNumber] = registerMatch;
      const authToken = extractAuthToken(req);

      if (!authToken) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const body = await req.json();
      const pushToken = body.pushToken;

      if (!pushToken) {
        return new Response('Missing pushToken', { status: 400, headers: corsHeaders });
      }

      console.log(`[Wallet API] Registering device ${deviceLibraryId} for pass ${serialNumber}`);

      const { data, error } = await supabase.rpc('register_device_for_pass', {
        p_device_library_id: deviceLibraryId,
        p_pass_type_id: passTypeId,
        p_serial_number: serialNumber,
        p_push_token: pushToken,
        p_auth_token: authToken,
      });

      if (error) {
        console.error('[Wallet API] Registration error:', error);
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      if (!data?.success) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      // Return 201 for new registration, 200 for update
      return new Response(null, { status: 201, headers: corsHeaders });
    }

    // ========================================================================
    // Route: DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    // Purpose: Unregister a device from receiving push notifications
    // ========================================================================
    if (registerMatch && method === 'DELETE') {
      const [, deviceLibraryId, passTypeId, serialNumber] = registerMatch;
      const authToken = extractAuthToken(req);

      if (!authToken) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      console.log(`[Wallet API] Unregistering device ${deviceLibraryId} from pass ${serialNumber}`);

      const { data, error } = await supabase.rpc('unregister_device_for_pass', {
        p_device_library_id: deviceLibraryId,
        p_pass_type_id: passTypeId,
        p_serial_number: serialNumber,
        p_auth_token: authToken,
      });

      if (error) {
        console.error('[Wallet API] Unregistration error:', error);
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      if (!data?.success) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // ========================================================================
    // Route: GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
    // Purpose: Get serial numbers of passes registered for a device
    // ========================================================================
    const listPassesMatch = path.match(
      /^\/v1\/devices\/([^\/]+)\/registrations\/([^\/]+)$/
    );
    if (listPassesMatch && method === 'GET') {
      const [, deviceLibraryId, passTypeId] = listPassesMatch;

      // Get passesUpdatedSince from query params
      const passesUpdatedSince = url.searchParams.get('passesUpdatedSince');
      const updatedSince = passesUpdatedSince ? new Date(passesUpdatedSince) : null;

      console.log(`[Wallet API] Getting passes for device ${deviceLibraryId}, updated since: ${updatedSince}`);

      const { data: passes, error } = await supabase.rpc('get_passes_for_device', {
        p_device_library_id: deviceLibraryId,
        p_pass_type_id: passTypeId,
        p_updated_since: updatedSince?.toISOString() || null,
      });

      if (error) {
        console.error('[Wallet API] Get passes error:', error);
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      if (!passes || passes.length === 0) {
        // 204 No Content - no updates
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Find the latest update time
      const latestUpdate = passes.reduce((max: Date, p: any) => {
        const updated = new Date(p.last_updated);
        return updated > max ? updated : max;
      }, new Date(0));

      const response = {
        serialNumbers: passes.map((p: any) => p.serial_number),
        lastUpdated: latestUpdate.toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================================================
    // Route: GET /v1/passes/{passTypeIdentifier}/{serialNumber}
    // Purpose: Fetch the latest version of a pass
    // ========================================================================
    const getPassMatch = path.match(
      /^\/v1\/passes\/([^\/]+)\/([^\/]+)$/
    );
    if (getPassMatch && method === 'GET') {
      const [, passTypeId, serialNumber] = getPassMatch;
      const authToken = extractAuthToken(req);

      if (!authToken) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      console.log(`[Wallet API] Fetching pass ${serialNumber}`);

      // Get pass record
      const { data: passRecord, error: passError } = await supabase
        .from('wallet_passes')
        .select('*, customers(*), vendors(*)')
        .eq('serial_number', serialNumber)
        .eq('pass_type_identifier', passTypeId)
        .eq('authentication_token', authToken)
        .single();

      if (passError || !passRecord) {
        console.error('[Wallet API] Pass not found:', passError);
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      // Generate updated pass - call wallet-pass edge function
      const walletPassUrl = `${supabaseUrl}/functions/v1/wallet-pass`;
      const passResponse = await fetch(walletPassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          customer_id: passRecord.customer_id,
          vendor_id: passRecord.vendor_id,
          serial_number: serialNumber,
          is_update: true, // Flag to use existing serial number
        }),
      });

      if (!passResponse.ok) {
        console.error('[Wallet API] Failed to generate pass');
        return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
      }

      const passBuffer = await passResponse.arrayBuffer();

      // Update last_updated_at
      await supabase
        .from('wallet_passes')
        .update({ last_updated_at: new Date().toISOString() })
        .eq('serial_number', serialNumber);

      return new Response(passBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.pkpass',
          'Last-Modified': new Date().toUTCString(),
        },
      });
    }

    // ========================================================================
    // Route: POST /v1/log
    // Purpose: Log errors from Apple Wallet
    // ========================================================================
    if (path === '/v1/log' && method === 'POST') {
      const body = await req.json();
      console.log('[Wallet API] Error log from device:', JSON.stringify(body, null, 2));

      // Store in database for debugging
      await supabase.from('wallet_error_logs').insert({
        logs: body.logs || [],
        received_at: new Date().toISOString(),
      }).catch(() => {
        // Table might not exist, ignore
      });

      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // ========================================================================
    // Not Found
    // ========================================================================
    console.log(`[Wallet API] Route not found: ${method} ${path}`);
    return new Response('Not Found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('[Wallet API] Unexpected error:', error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract authentication token from Authorization header
 * Apple sends: "ApplePass <authenticationToken>"
 */
function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^ApplePass\s+(.+)$/);
  return match ? match[1] : null;
}
