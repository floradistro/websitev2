import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const urlValue =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || "MISSING";
    const anonKeyValue =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || "MISSING";

    let dbTest = "NOT_TESTED";
    let productCount = 0;
    let vendorCount = 0;
    let error = null;

    // Try to connect to Supabase
    if (hasUrl && hasAnonKey) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        // Test database connection
        const { data: products, error: prodError } = await supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("status", "published")
          .limit(1);

        if (prodError) {
          error = prodError.message;
          dbTest = "FAILED";
        } else {
          dbTest = "SUCCESS";
        }

        // Get counts
        const { count: pCount } = await supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("status", "published");
        productCount = pCount || 0;

        const { count: vCount } = await supabase
          .from("vendors")
          .select("id", { count: "exact" });
        vendorCount = vCount || 0;
      } catch (e: any) {
        error = e.message;
        dbTest = "ERROR";
      }
    }

    return NextResponse.json({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: hasUrl,
        hasAnonKey: hasAnonKey,
        hasServiceKey: hasServiceKey,
        urlPreview: urlValue,
        anonKeyPreview: anonKeyValue,
      },
      database: {
        connectionTest: dbTest,
        productCount,
        vendorCount,
        error,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
