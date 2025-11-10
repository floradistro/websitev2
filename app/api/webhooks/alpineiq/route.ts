/**
 * AlpineIQ Webhook Endpoint
 * Receives campaign events from AlpineIQ (sends, opens, clicks, conversions)
 *
 * Setup Instructions:
 * 1. In AlpineIQ dashboard, go to Settings → API & Tracking
 * 2. Add webhook URL: https://yourdomain.com/api/webhooks/alpineiq
 * 3. Select events to track: campaign.sent, email.opened, email.clicked, sms.delivered, etc.
 * 4. Save webhook secret in environment variables: ALPINEIQ_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Verify webhook signature from AlpineIQ
 */
function verifySignature(signature: string | null, body: any): boolean {
  if (!signature || !process.env.ALPINEIQ_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Missing signature or webhook secret");
    }
    return false; // TODO: Enable this check once AlpineIQ provides signature method
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.ALPINEIQ_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Get our customer ID from AlpineIQ contact ID
 */
async function getCustomerIdFromAlpineIQ(alpineiqContactId: string): Promise<string | null> {
  const { data } = await supabase
    .from("alpineiq_customer_mapping")
    .select("customer_id")
    .eq("alpineiq_customer_id", alpineiqContactId)
    .single();

  return data?.customer_id || null;
}

/**
 * Handle campaign.sent event
 */
async function handleCampaignSent(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id, // Need to add vendor_id to webhook payload
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "sent",
    channel: data.channel || "email",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      sent_at: data.sent_at || new Date().toISOString(),
    },
    created_at: data.sent_at || new Date().toISOString(),
  });
}

/**
 * Handle email.opened event
 */
async function handleEmailOpened(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id,
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "opened",
    channel: "email",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      opened_at: data.opened_at || new Date().toISOString(),
      user_agent: data.user_agent,
      ip_address: data.ip_address,
    },
    created_at: data.opened_at || new Date().toISOString(),
  });
}

/**
 * Handle email.clicked event
 */
async function handleEmailClicked(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  // Record click event
  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id,
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "clicked",
    channel: "email",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      link_url: data.link_url,
      clicked_at: data.clicked_at || new Date().toISOString(),
      utm_campaign: data.utm_campaign,
      utm_source: data.utm_source || "alpineiq",
      utm_medium: data.utm_medium || "email",
    },
    created_at: data.clicked_at || new Date().toISOString(),
  });

  // Create customer session for attribution tracking
  if (customerId) {
    await supabase.from("customer_sessions").insert({
      vendor_id: data.vendor_id,
      customer_id: customerId,
      utm_source: data.utm_source || "alpineiq",
      utm_medium: data.utm_medium || "email",
      utm_campaign: data.utm_campaign || data.campaign_id,
      session_start: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  }
}

/**
 * Handle sms.delivered event
 */
async function handleSMSDelivered(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id,
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "delivered",
    channel: "sms",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      delivered_at: data.delivered_at || new Date().toISOString(),
      phone: data.phone,
    },
    created_at: data.delivered_at || new Date().toISOString(),
  });
}

/**
 * Handle email.bounced event
 */
async function handleEmailBounced(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id,
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "bounced",
    channel: "email",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      bounce_type: data.bounce_type, // hard, soft, etc.
      bounce_reason: data.bounce_reason,
      bounced_at: data.bounced_at || new Date().toISOString(),
    },
    created_at: data.bounced_at || new Date().toISOString(),
  });
}

/**
 * Handle email.unsubscribed event
 */
async function handleEmailUnsubscribed(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  await supabase.from("marketing_campaign_events").insert({
    vendor_id: data.vendor_id,
    campaign_id: data.campaign_id,
    campaign_type: "alpineiq",
    customer_id: customerId,
    event_type: "unsubscribed",
    channel: "email",
    metadata: {
      alpineiq_contact_id: data.customer_id || data.contactID,
      unsubscribed_at: data.unsubscribed_at || new Date().toISOString(),
    },
    created_at: data.unsubscribed_at || new Date().toISOString(),
  });
}

/**
 * Handle loyalty.points_redeemed event
 */
async function handlePointsRedeemed(data: any): Promise<void> {
  const customerId = await getCustomerIdFromAlpineIQ(data.customer_id || data.contactID);

  // Log the redemption in our system
  if (customerId) {
    await supabase.from("loyalty_transactions").insert({
      vendor_id: data.vendor_id,
      customer_id: customerId,
      type: "redeemed",
      points: -Math.abs(data.points), // Negative for redemption
      description: `AlpineIQ loyalty redemption: ${data.reward_name || "Unknown"}`,
      metadata: {
        alpineiq_contact_id: data.customer_id || data.contactID,
        reward_name: data.reward_name,
        redemption_id: data.redemption_id,
      },
    });
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log raw webhook for debugging

    // Verify webhook signature (if AlpineIQ provides it)
    const signature = request.headers.get("x-alpineiq-signature");
    // if (!verifySignature(signature, body)) {
    //   logger.error('Invalid webhook signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Handle different event types
    switch (body.event_type) {
      case "campaign.sent":
        await handleCampaignSent(body.data);
        break;

      case "email.opened":
      case "email.open":
        await handleEmailOpened(body.data);
        break;

      case "email.clicked":
      case "email.click":
        await handleEmailClicked(body.data);
        break;

      case "email.bounced":
      case "email.bounce":
        await handleEmailBounced(body.data);
        break;

      case "email.unsubscribed":
      case "email.unsubscribe":
        await handleEmailUnsubscribed(body.data);
        break;

      case "sms.delivered":
      case "text.delivered":
        await handleSMSDelivered(body.data);
        break;

      case "loyalty.points_redeemed":
      case "loyalty.redeemed":
        await handlePointsRedeemed(body.data);
        break;

      default:

      // Still return 200 to acknowledge receipt
    }

    return NextResponse.json({
      success: true,
      event_type: body.event_type,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Webhook error:", err);
    }
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * GET method for webhook verification (if AlpineIQ requires it)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    // Respond to webhook verification challenge
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    message: "AlpineIQ webhook endpoint",
    status: "active",
  });
}
