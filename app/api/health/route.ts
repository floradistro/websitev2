import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    status: "healthy",
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    },
    checks: {
      database: { status: "unknown", latency: 0 },
      api: { status: "healthy", latency: 0 },
      cache: { status: "healthy", latency: 0 },
      storage: { status: "unknown", latency: 0 },
    },
  };

  // Check for missing environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    checks.status = "unhealthy";
    return NextResponse.json(
      {
        success: false,
        ...checks,
        error: "Missing required environment variables",
        missing: {
          supabaseUrl: !process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
      { status: 503 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Database check
    const dbStart = Date.now();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: dbError } = await supabase.from("vendors").select("id").limit(1);
    checks.checks.database = {
      status: dbError ? "unhealthy" : "healthy",
      latency: Date.now() - dbStart,
    };

    // Storage check
    const storageStart = Date.now();
    const { error: storageError } = await supabase.storage.listBuckets();
    checks.checks.storage = {
      status: storageError ? "unhealthy" : "healthy",
      latency: Date.now() - storageStart,
    };

    // Overall status
    const allHealthy = Object.values(checks.checks).every((check) => check.status === "healthy");
    checks.status = allHealthy ? "healthy" : "degraded";

    return NextResponse.json(
      {
        success: true,
        ...checks,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const err = toError(error);
    checks.status = "unhealthy";
    return NextResponse.json(
      {
        success: false,
        ...checks,
        error: err.message,
      },
      { status: 503 },
    );
  }
}
