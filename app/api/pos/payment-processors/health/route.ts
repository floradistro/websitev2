import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { DejavooClient } from "@/lib/payment-processors/dejavoo";

import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheckResult {
  processor_id: string;
  is_live: boolean;
  last_checked: string;
  error?: string;
}

/**
 * GET /api/pos/payment-processors/health
 * 
 * Lightweight health check for payment processors assigned to registers.
 * This performs a quick connectivity test WITHOUT sending test transactions.
 * 
 * Query params:
 * - locationId: Required. Check all processors for this location.
 * - processorId: Optional. Check specific processor only.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const processorId = searchParams.get("processorId");

    if (!locationId) {
      return NextResponse.json(
        { error: "locationId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get all payment processors for this location's registers
    let query = supabase
      .from("payment_processors")
      .select("id, processor_type, processor_name, dejavoo_authkey, dejavoo_tpn, environment, is_active")
      .eq("vendor_id", vendorId);

    if (processorId) {
      query = query.eq("id", processorId);
    } else {
      // Get processors assigned to registers at this location
      const { data: registers } = await supabase
        .from("pos_registers")
        .select("payment_processor_id")
        .eq("location_id", locationId)
        .eq("status", "active")
        .not("payment_processor_id", "is", null);

      if (!registers || registers.length === 0) {
        return NextResponse.json({ results: [] });
      }

      const processorIds = [...new Set(registers.map(r => r.payment_processor_id).filter(Boolean))];
      query = query.in("id", processorIds);
    }

    const { data: processors, error } = await query;

    if (error) {
      logger.error("Error fetching processors for health check:", error);
      return NextResponse.json(
        { error: "Failed to fetch processors" },
        { status: 500 }
      );
    }

    if (!processors || processors.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Perform health checks in parallel with timeout
    const healthCheckPromises = processors.map((processor) =>
      checkProcessorHealth(processor)
    );

    const results = await Promise.allSettled(healthCheckPromises);

    const healthResults: HealthCheckResult[] = results.map((result, index) => {
      const processor = processors[index];
      
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          processor_id: processor.id,
          is_live: false,
          last_checked: new Date().toISOString(),
          error: result.reason?.message || "Health check failed",
        };
      }
    });

    // Update database with results (fire and forget)
    updateProcessorHealthStatus(healthResults).catch((err) => {
      logger.error("Failed to update processor health status:", err);
    });

    return NextResponse.json({ results: healthResults });
  } catch (error) {
    logger.error("Error in payment processor health check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Perform lightweight health check on a payment processor
 * This is FAST and non-intrusive - doesn't send transactions to terminal
 */
async function checkProcessorHealth(processor: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    if (processor.processor_type === "dejavoo") {
      // For Dejavoo, we do a simple API connectivity check
      // We'll make a request to their status endpoint instead of processing a transaction
      const client = new DejavooClient({
        authKey: processor.dejavoo_authkey,
        tpn: processor.dejavoo_tpn,
        environment: processor.environment || "production",
      });

      // Simple timeout check - if API responds within 3 seconds, consider it live
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Health check timeout")), 3000)
      );

      // Lightweight ping by checking if we can construct a request
      // This verifies credentials and API endpoint without hitting the terminal
      const healthPromise = client.ping();

      await Promise.race([healthPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      logger.info(`✅ Processor ${processor.processor_name} is live (${duration}ms)`);

      return {
        processor_id: processor.id,
        is_live: true,
        last_checked: new Date().toISOString(),
      };
    }

    // For other processor types, just check if credentials exist
    return {
      processor_id: processor.id,
      is_live: processor.is_active,
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.warn(`⚠️ Processor ${processor.processor_name} is offline (${duration}ms):`, error);

    return {
      processor_id: processor.id,
      is_live: false,
      last_checked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Update database with health check results
 */
async function updateProcessorHealthStatus(results: HealthCheckResult[]) {
  const supabase = getServiceSupabase();

  for (const result of results) {
    await supabase
      .from("payment_processors")
      .update({
        last_health_check: result.last_checked,
        is_live: result.is_live,
        last_health_error: result.error || null,
      })
      .eq("id", result.processor_id);
  }
}

