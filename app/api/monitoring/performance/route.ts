/**
 * Performance Monitoring API Endpoint
 * Provides real-time performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitor } from '@/lib/performance-monitor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'summary';

    let data;

    switch (type) {
      case 'summary':
        data = monitor.getSummary();
        break;

      case 'operations':
        data = monitor.getAllStats();
        break;

      case 'cache':
        const timeWindow = parseInt(searchParams.get('window') || '300000');
        data = monitor.getCacheStats(timeWindow);
        break;

      case 'operation':
        const operation = searchParams.get('name');
        if (!operation) {
          return NextResponse.json(
            { error: 'Operation name required' },
            { status: 400 }
          );
        }
        data = monitor.getStats(operation);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance metrics',
      },
      { status: 500 }
    );
  }
}
