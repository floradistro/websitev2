/**
 * User Context API
 * Returns user behavioral data for quantum state testing
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const cookieStore = await cookies();

  // Check for visit tracking cookie
  const visitCount = parseInt(cookieStore.get("visit_count")?.value || "1");
  const hasCart = cookieStore.get("has_cart")?.value === "true";
  const cartAbandoned = cookieStore.get("cart_abandoned")?.value === "true";

  const userContext = {
    visits: visitCount,
    cartAbandoned: cartAbandoned,
    hasCart: hasCart,
    device: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(userContext);
}

function getDeviceType() {
  // Server-side, return default
  // Client-side detection would happen in the component
  return "desktop";
}
