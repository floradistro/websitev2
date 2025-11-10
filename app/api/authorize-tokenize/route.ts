import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { cardNumber, expMonth, expYear, cvv, customerEmail, customerName } =
      await request.json();

    // In production, this would call Authorize.net Customer Profiles API
    // For now, we'll simulate tokenization for development

    // Validate card number format
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid card number",
        },
        { status: 400 },
      );
    }

    // Validate expiry
    if (!expMonth || !expYear) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expiry date",
        },
        { status: 400 },
      );
    }

    // Simulate Authorize.net API response
    // In production, would call:
    // POST https://api.authorize.net/xml/v1/request.api
    // Using Customer Profile ID and Payment Profile ID

    const paymentProfileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      paymentProfileId: paymentProfileId,
      customerProfileId: `customer_${customerEmail.split("@")[0]}`,
      message: "Card tokenized successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Tokenization error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to tokenize card",
      },
      { status: 500 },
    );
  }
}
