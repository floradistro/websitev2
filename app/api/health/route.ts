import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Health check endpoint for monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    // Test database connection
    const startTime = Date.now();
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single();
    const dbLatency = Date.now() - startTime;
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      throw error;
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency: `${dbLatency}ms`
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    }, { status: 503 });
  }
}

