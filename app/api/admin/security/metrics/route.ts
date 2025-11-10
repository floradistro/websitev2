/**
 * API: Security Metrics
 * GET /api/admin/security/metrics - Get security monitoring metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { securityMonitor } from "@/lib/security-monitor";
import { checkRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // RATE LIMIT: Admin endpoint
  const rateLimitResult = checkRateLimit(request, RateLimitConfigs.admin);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get security metrics
    const metrics = securityMonitor.getMetrics();

    return NextResponse.json({
      success: true,
      metrics: {
        bruteForceAttempts: metrics.bruteForceAttempts,
        rateLimitViolations: metrics.rateLimitViolations,
        timestamp: new Date().toISOString(),
      },
      rateLimits: {
        ai: RateLimitConfigs.ai,
        aiChat: RateLimitConfigs.aiChat,
        aiGeneration: RateLimitConfigs.aiGeneration,
        admin: RateLimitConfigs.admin,
        adminSensitive: RateLimitConfigs.adminSensitive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch security metrics",
      },
      { status: 500 },
    );
  }
}
