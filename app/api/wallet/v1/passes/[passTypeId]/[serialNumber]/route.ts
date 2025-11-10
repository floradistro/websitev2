/**
 * Apple Wallet Web Service API
 * Pass Update Endpoint
 *
 * GET /api/wallet/v1/passes/:passTypeId/:serialNumber
 * - Get the latest version of a pass
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { walletPassGenerator } from "@/lib/wallet/pass-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface RouteParams {
  params: Promise<{
    passTypeId: string;
    serialNumber: string;
  }>;
}

/**
 * GET - Retrieve updated pass
 */
export async function GET(request: NextRequest, segmentData: RouteParams) {
  const params = await segmentData.params;
  try {
    const { serialNumber } = params;
    const authHeader = request.headers.get("authorization");
    const authToken = authHeader?.replace("ApplePass ", "");

    if (!authToken) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    // Get pass with customer and vendor data
    const { data: pass, error: passError } = await supabase
      .from("wallet_passes")
      .select("*, customers(*), vendors(*)")
      .eq("serial_number", serialNumber)
      .eq("authentication_token", authToken)
      .eq("status", "active")
      .single();

    if (passError || !pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Check if pass has been modified since the If-Modified-Since header
    const ifModifiedSince = request.headers.get("if-modified-since");
    if (ifModifiedSince) {
      const modifiedSinceDate = new Date(ifModifiedSince);
      const lastUpdatedDate = new Date(pass.last_updated_at);

      if (lastUpdatedDate <= modifiedSinceDate) {
        // Pass hasn't been modified
        return new NextResponse(null, { status: 304 });
      }
    }

    // Generate updated pass
    const buffer = await walletPassGenerator.generatePass(
      pass.customers,
      pass.vendors,
      pass,
    );

    // Log event
    await supabase.from("wallet_pass_events").insert({
      pass_id: pass.id,
      customer_id: pass.customer_id,
      event_type: "updated",
    });

    // Return updated pass
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": new Date(pass.last_updated_at).toUTCString(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Pass retrieval error:", error);
    }
    return NextResponse.json(
      { error: "Failed to retrieve pass" },
      { status: 500 },
    );
  }
}
