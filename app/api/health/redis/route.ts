/**
 * Redis Health Check
 * Verifies Redis cache connectivity
 */

import { NextResponse } from "next/server";
import { redisCache } from "@/lib/redis-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = redisCache.getStats();

    // Try a simple set/get operation
    const testKey = "health:check";
    const testValue = { timestamp: Date.now() };

    await redisCache.set(testKey, testValue, 10);
    const retrieved = await redisCache.get(testKey);

    const isWorking = retrieved !== null;

    return NextResponse.json({
      success: true,
      status: isWorking ? "connected" : "fallback",
      isRedisConnected: stats.isRedisConnected,
      fallbackCacheSize: stats.fallbackCacheSize,
      testPassed: isWorking,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error.message || "Redis health check failed",
      },
      { status: 503 },
    );
  }
}
