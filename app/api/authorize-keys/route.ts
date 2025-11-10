import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    const clientKey = process.env.NEXT_PUBLIC_AUTHORIZENET_CLIENT_KEY;
    const apiLoginId = process.env.NEXT_PUBLIC_AUTHORIZENET_API_LOGIN_ID;
    const environment = process.env.NEXT_PUBLIC_AUTHORIZENET_ENVIRONMENT || "production";

    if (!clientKey || !apiLoginId) {
      throw new Error("Authorize.net keys not configured");
    }

    return NextResponse.json({
      success: true,
      clientKey: clientKey,
      apiLoginId: apiLoginId,
      environment: environment,
      useServerSide: false,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching Authorize.net keys:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
