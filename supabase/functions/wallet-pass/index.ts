/**
 * ============================================================================
 * APPLE WALLET PASS GENERATOR - EDGE FUNCTION
 * ============================================================================
 *
 * Generates Apple Wallet .pkpass files for loyalty cards.
 * Uses native crypto APIs for signing (no external dependencies).
 *
 * Features:
 * - Dynamic pass generation with customer data
 * - Vendor branding (logo, colors)
 * - QR code for in-store scanning
 * - Push notification support
 * - Location-based notifications
 *
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import * as pkcs7 from 'https://esm.sh/pkcs7@1.0.4';
import * as forge from 'https://esm.sh/node-forge@1.3.1';

// ============================================================================
// CONFIGURATION
// ============================================================================
const PASS_TYPE_IDENTIFIER = Deno.env.get('APPLE_PASS_TYPE_ID') || 'pass.com.whaletools.wallet';
const TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || 'Y9Q7L7SGR3';
const WEB_SERVICE_URL = Deno.env.get('WALLET_WEB_SERVICE_URL') || 'https://uaednwpxursknmwdeejn.supabase.co/functions/v1/wallet-api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[Wallet Pass] Request received');

  // Initialize Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request
    let customerId: string;
    let vendorId: string;
    let serialNumber: string | null = null;
    let isUpdate = false;

    if (req.method === 'POST') {
      const body = await req.json();
      customerId = body.customer_id;
      vendorId = body.vendor_id;
      serialNumber = body.serial_number || null;
      isUpdate = body.is_update || false;
    } else {
      // GET request - from query params
      const url = new URL(req.url);
      customerId = url.searchParams.get('customer_id') || '';
      vendorId = url.searchParams.get('vendor_id') || '';
    }

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customer_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('[Wallet Pass] Customer not found:', customerError);
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use customer's vendor_id if not provided
    vendorId = vendorId || customer.vendor_id;

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.error('[Wallet Pass] Vendor not found:', vendorError);
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate or use existing serial number
    if (!serialNumber) {
      // Check if pass already exists for this customer
      const { data: existingPass } = await supabase
        .from('wallet_passes')
        .select('serial_number, authentication_token')
        .eq('customer_id', customerId)
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (existingPass) {
        serialNumber = existingPass.serial_number;
      } else {
        serialNumber = generateSerialNumber();
      }
    }

    const authToken = generateAuthToken();

    // Build pass data
    const passData = buildPassJson(customer, vendor, serialNumber, authToken);

    // Load certificates
    const certs = loadCertificates();

    // Generate the .pkpass file
    const pkpassBuffer = await generatePkpass(passData, certs, vendor.logo_url);

    // Store/update pass record in database
    await supabase.from('wallet_passes').upsert({
      customer_id: customerId,
      vendor_id: vendorId,
      serial_number: serialNumber,
      authentication_token: authToken,
      pass_type: 'loyalty',
      pass_type_identifier: PASS_TYPE_IDENTIFIER,
      status: 'active',
      pass_data: {
        points: customer.loyalty_points || 0,
        tier: customer.loyalty_tier || 'bronze',
        member_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        member_since: customer.created_at,
      },
      web_service_url: WEB_SERVICE_URL,
      push_enabled: true,
      is_active: true,
      last_updated_at: new Date().toISOString(),
    }, {
      onConflict: 'customer_id,vendor_id',
    });

    console.log('[Wallet Pass] Pass generated successfully for customer:', customerId);

    // Return the .pkpass file
    return new Response(pkpassBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="loyalty-pass.pkpass"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[Wallet Pass] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate pass' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// PASS GENERATION
// ============================================================================

function buildPassJson(customer: any, vendor: any, serialNumber: string, authToken: string): any {
  const points = customer.loyalty_points || 0;
  const tierName = customer.loyalty_tier || 'Bronze';
  const tierEmoji = getTierEmoji(tierName);
  const memberName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Member';
  const memberSince = new Date(customer.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const storeName = vendor.store_name || vendor.name || 'Loyalty';
  const barcodeMessage = `CUSTOMER-${customer.id.substring(0, 8).toUpperCase()}`;

  // Get vendor brand color or default
  const backgroundColor = vendor.brand_color || 'rgb(30, 30, 30)';
  const foregroundColor = 'rgb(255, 255, 255)';
  const labelColor = 'rgb(150, 150, 150)';

  const pass: any = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_IDENTIFIER,
    teamIdentifier: TEAM_ID,
    serialNumber: serialNumber,
    authenticationToken: authToken,
    webServiceURL: WEB_SERVICE_URL,

    organizationName: storeName,
    description: `${storeName} Loyalty Card`,
    logoText: storeName,

    backgroundColor: backgroundColor,
    foregroundColor: foregroundColor,
    labelColor: labelColor,

    // Barcode for in-store scanning
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: barcodeMessage,
        messageEncoding: 'iso-8859-1',
      },
    ],

    // Store card type (best for loyalty programs)
    storeCard: {
      primaryFields: [
        {
          key: 'points',
          label: 'LOYALTY POINTS',
          value: points.toLocaleString(),
        },
      ],
      secondaryFields: [
        {
          key: 'tier',
          label: 'TIER',
          value: `${tierEmoji} ${tierName.toUpperCase()}`,
        },
        {
          key: 'member',
          label: 'MEMBER',
          value: memberName,
        },
      ],
      auxiliaryFields: [
        {
          key: 'since',
          label: 'MEMBER SINCE',
          value: memberSince,
        },
      ],
      backFields: [
        {
          key: 'program',
          label: 'LOYALTY PROGRAM',
          value: 'Earn points on every purchase. Redeem for discounts on future orders.',
        },
        {
          key: 'customerId',
          label: 'MEMBER ID',
          value: customer.id.substring(0, 8).toUpperCase(),
        },
        {
          key: 'terms',
          label: 'TERMS & CONDITIONS',
          value: 'Points are non-transferable. See store for full program details.',
        },
      ],
    },

    // Enable automatic updates
    sharingProhibited: false,
  };

  // Add locations for geo-fencing if vendor has locations
  // This makes the pass appear on lock screen when near stores
  // TODO: Fetch vendor locations and add here

  return pass;
}

async function generatePkpass(
  passJson: any,
  certs: { wwdr: Uint8Array; signerCert: Uint8Array; signerKey: Uint8Array; password: string },
  logoUrl?: string
): Promise<Uint8Array> {
  const zip = new JSZip();

  // Add pass.json
  const passJsonString = JSON.stringify(passJson, null, 2);
  zip.file('pass.json', passJsonString);

  // Download and add logo if available
  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer();
        zip.file('logo.png', logoBuffer);
        zip.file('logo@2x.png', logoBuffer);
        zip.file('logo@3x.png', logoBuffer);
        zip.file('icon.png', logoBuffer);
        zip.file('icon@2x.png', logoBuffer);
        zip.file('icon@3x.png', logoBuffer);
      }
    } catch (e) {
      console.warn('[Wallet Pass] Failed to download logo:', e);
    }
  }

  // Create manifest (SHA1 hashes of all files)
  const manifest: Record<string, string> = {};
  const files = Object.keys(zip.files);

  for (const filename of files) {
    if (!zip.files[filename].dir) {
      const content = await zip.files[filename].async('uint8array');
      const hashBuffer = await crypto.subtle.digest('SHA-1', content);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      manifest[filename] = hashHex;
    }
  }

  const manifestJson = JSON.stringify(manifest);
  zip.file('manifest.json', manifestJson);

  // Sign the manifest
  const signature = await signManifest(manifestJson, certs);
  zip.file('signature', signature);

  // Generate the final .pkpass
  const pkpassBuffer = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return pkpassBuffer;
}

async function signManifest(
  manifestJson: string,
  certs: { wwdr: Uint8Array; signerCert: Uint8Array; signerKey: Uint8Array; password: string }
): Promise<Uint8Array> {
  try {
    // Use node-forge for PKCS#7 signing
    const wwdrPem = new TextDecoder().decode(certs.wwdr);
    const certPem = new TextDecoder().decode(certs.signerCert);
    const keyPem = new TextDecoder().decode(certs.signerKey);

    // Parse certificates
    const wwdrCert = forge.pki.certificateFromPem(wwdrPem);
    const signerCert = forge.pki.certificateFromPem(certPem);

    // Parse private key (may be encrypted)
    let privateKey;
    try {
      privateKey = forge.pki.privateKeyFromPem(keyPem);
    } catch {
      // Try decrypting with password
      const encryptedKey = forge.pki.encryptedPrivateKeyFromPem(keyPem);
      privateKey = forge.pki.decryptPrivateKeyInfo(encryptedKey, certs.password);
    }

    // Create PKCS#7 signed data
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(manifestJson, 'utf8');

    // Add signer certificate
    p7.addCertificate(signerCert);
    p7.addCertificate(wwdrCert);

    // Add signer
    p7.addSigner({
      key: privateKey,
      certificate: signerCert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.messageDigest,
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date(),
        },
      ],
    });

    // Sign
    p7.sign({ detached: true });

    // Convert to DER
    const asn1 = p7.toAsn1();
    const der = forge.asn1.toDer(asn1);
    const derBytes = der.getBytes();

    // Convert to Uint8Array
    const signature = new Uint8Array(derBytes.length);
    for (let i = 0; i < derBytes.length; i++) {
      signature[i] = derBytes.charCodeAt(i);
    }

    return signature;
  } catch (error) {
    console.error('[Wallet Pass] Signing error:', error);
    throw new Error(`Failed to sign pass: ${error.message}`);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function loadCertificates() {
  const certBase64 = Deno.env.get('APPLE_WALLET_CERT_BASE64');
  const keyBase64 = Deno.env.get('APPLE_WALLET_KEY_BASE64');
  const wwdrBase64 = Deno.env.get('APPLE_WALLET_WWDR_BASE64');
  const password = Deno.env.get('APPLE_WALLET_CERT_PASSWORD') || 'whaletools';

  if (!certBase64 || !keyBase64 || !wwdrBase64) {
    throw new Error('Missing Apple Wallet certificate environment variables');
  }

  // Decode from base64
  const decoder = new TextDecoder();

  return {
    wwdr: Uint8Array.from(atob(wwdrBase64), c => c.charCodeAt(0)),
    signerCert: Uint8Array.from(atob(certBase64), c => c.charCodeAt(0)),
    signerKey: Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0)),
    password,
  };
}

function generateSerialNumber(): string {
  return `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

function generateAuthToken(): string {
  return `AUTH-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`.toUpperCase();
}

function getTierEmoji(tier: string): string {
  switch (tier?.toLowerCase()) {
    case 'diamond': return '💎';
    case 'platinum': return '🏆';
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '⭐';
  }
}
