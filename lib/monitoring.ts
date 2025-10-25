/**
 * Performance Monitoring & Observability
 * Track key metrics for scalability and debugging
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(name: string) {
    const relevant = this.metrics.filter(m => m.name === name);
    
    if (relevant.length === 0) {
      return null;
    }

    const values = relevant.map(m => m.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: relevant.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all metrics for export (e.g., to Prometheus/Grafana)
   */
  getMetrics(since?: number) {
    if (since) {
      return this.metrics.filter(m => m.timestamp > since);
    }
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Global monitor instance
export const monitor = new PerformanceMonitor();

/**
 * Key metrics to track
 */
export const Metrics = {
  // API Performance
  API_RESPONSE_TIME: 'api.response_time',
  API_ERROR_RATE: 'api.error_rate',
  
  // Database
  DB_QUERY_TIME: 'db.query_time',
  DB_CONNECTION_TIME: 'db.connection_time',
  
  // Cache
  CACHE_HIT_RATE: 'cache.hit_rate',
  CACHE_MISS_RATE: 'cache.miss_rate',
  
  // Tenant
  TENANT_REQUEST_COUNT: 'tenant.request_count',
  TENANT_RESPONSE_TIME: 'tenant.response_time',
  
  // Component Rendering
  COMPONENT_RENDER_TIME: 'component.render_time',
  PAGE_LOAD_TIME: 'page.load_time',
};

/**
 * Helper to track API endpoint performance
 */
export async function trackAPICall<T>(
  endpoint: string,
  fn: () => Promise<T>,
  vendorId?: string
): Promise<T> {
  return monitor.time(
    Metrics.API_RESPONSE_TIME,
    fn,
    { endpoint, vendor_id: vendorId || 'unknown' }
  );
}

/**
 * Helper to track database query performance
 */
export async function trackQuery<T>(
  queryName: string,
  fn: () => Promise<T>,
  vendorId?: string
): Promise<T> {
  return monitor.time(
    Metrics.DB_QUERY_TIME,
    fn,
    { query: queryName, vendor_id: vendorId || 'unknown' }
  );
}

/**
 * Log slow operations for investigation
 */
const SLOW_THRESHOLD = 1000; // 1 second

export function logIfSlow(operation: string, duration: number, threshold = SLOW_THRESHOLD) {
  if (duration > threshold) {
    console.warn(`⚠️ Slow operation detected: ${operation} took ${duration.toFixed(0)}ms`);
    
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or similar
    }
  }
}

/**
 * Export metrics for external monitoring
 */
export function getPrometheusMetrics(): string {
  const metrics: string[] = [];
  
  // Get all unique metric names
  const names = new Set(monitor.getMetrics().map(m => m.name));
  
  for (const name of names) {
    const summary = monitor.getSummary(name);
    if (summary) {
      metrics.push(`# TYPE ${name.replace(/\./g, '_')} summary`);
      metrics.push(`${name.replace(/\./g, '_')}_count ${summary.count}`);
      metrics.push(`${name.replace(/\./g, '_')}_avg ${summary.avg.toFixed(2)}`);
      metrics.push(`${name.replace(/\./g, '_')}_p95 ${summary.p95.toFixed(2)}`);
      metrics.push(`${name.replace(/\./g, '_')}_p99 ${summary.p99.toFixed(2)}`);
    }
  }
  
  return metrics.join('\n');
}

/**
 * Health check endpoint data
 */
export function getHealthStatus() {
  const apiSummary = monitor.getSummary(Metrics.API_RESPONSE_TIME);
  const dbSummary = monitor.getSummary(Metrics.DB_QUERY_TIME);
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    memory: process.memoryUsage ? process.memoryUsage() : null,
    metrics: {
      api: apiSummary,
      database: dbSummary,
    }
  };
}

