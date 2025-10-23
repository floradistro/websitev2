import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown', latency: 0 },
      api: { status: 'healthy', latency: 0 },
      cache: { status: 'healthy', latency: 0 },
      storage: { status: 'unknown', latency: 0 }
    }
  };

  try {
    // Database check
    const dbStart = Date.now();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: dbError } = await supabase.from('vendors').select('id').limit(1);
    checks.checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      latency: Date.now() - dbStart
    };

    // Storage check
    const storageStart = Date.now();
    const { error: storageError } = await supabase.storage.listBuckets();
    checks.checks.storage = {
      status: storageError ? 'unhealthy' : 'healthy',
      latency: Date.now() - storageStart
    };

    // Overall status
    const allHealthy = Object.values(checks.checks).every(check => check.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(checks, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    checks.status = 'unhealthy';
    return NextResponse.json({
      ...checks,
      error: error.message
    }, { status: 503 });
  }
}
