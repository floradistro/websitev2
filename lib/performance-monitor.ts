/**
 * Performance Monitoring System
 * Tracks API response times, cache hit rates, and system health
 * Amazon/Apple-style performance monitoring
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CacheMetric {
  key: string;
  hit: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private cacheMetrics: CacheMetric[] = [];
  private maxMetricsPerOperation: number = 100;
  private maxCacheMetrics: number = 1000;

  /**
   * Start a performance timer for an operation
   * Returns a function to end the timer
   */
  startTimer(operation: string, metadata?: Record<string, any>): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      // Store metric
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }

      const operationMetrics = this.metrics.get(operation)!;
      operationMetrics.push(duration);

      // Keep only last N measurements for memory efficiency
      if (operationMetrics.length > this.maxMetricsPerOperation) {
        operationMetrics.shift();
      }

      // Log slow operations (>1 second)
      if (duration > 1000) {
        console.warn(
          `⚠️  SLOW OPERATION: ${operation} took ${duration.toFixed(2)}ms`,
          metadata,
        );
      } else if (duration > 500) {
      }

      return duration;
    };
  }

  /**
   * Record a cache hit or miss
   */
  recordCacheAccess(key: string, hit: boolean): void {
    this.cacheMetrics.push({
      key,
      hit,
      timestamp: Date.now(),
    });

    // Keep only recent metrics for memory efficiency
    if (this.cacheMetrics.length > this.maxCacheMetrics) {
      this.cacheMetrics.shift();
    }
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(operation: string) {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      operation,
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / measurements.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get statistics for all operations
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [operation, _] of this.metrics) {
      const operationStats = this.getStats(operation);
      if (operationStats) {
        stats[operation] = operationStats;
      }
    }
    return stats;
  }

  /**
   * Get cache hit rate statistics
   */
  getCacheStats(timeWindowMs: number = 300000) {
    // Default: last 5 minutes
    const now = Date.now();
    const recentMetrics = this.cacheMetrics.filter(
      (m) => now - m.timestamp < timeWindowMs,
    );

    if (recentMetrics.length === 0) {
      return {
        total: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
      };
    }

    const hits = recentMetrics.filter((m) => m.hit).length;
    const misses = recentMetrics.length - hits;

    return {
      total: recentMetrics.length,
      hits,
      misses,
      hitRate: (hits / recentMetrics.length) * 100,
      timeWindow: timeWindowMs,
    };
  }

  /**
   * Get performance summary for dashboard
   */
  getSummary() {
    const allStats = this.getAllStats();
    const cacheStats = this.getCacheStats();

    // Calculate overall health score (0-100)
    let healthScore = 100;

    // Penalize for slow operations
    Object.values(allStats).forEach((stat: any) => {
      if (stat.avg > 1000) healthScore -= 20;
      else if (stat.avg > 500) healthScore -= 10;
      else if (stat.avg > 200) healthScore -= 5;
    });

    // Bonus for good cache hit rate
    if (cacheStats.hitRate > 90) healthScore = Math.min(100, healthScore + 5);
    else if (cacheStats.hitRate < 50)
      healthScore = Math.max(0, healthScore - 10);

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      healthScore,
      operations: allStats,
      cache: cacheStats,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.cacheMetrics = [];
  }
}

// Export singleton instance
export const monitor = new PerformanceMonitor();

// Helper to wrap async functions with monitoring
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T,
): T {
  return (async (...args: any[]) => {
    const endTimer = monitor.startTimer(operation);
    try {
      const result = await fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }) as T;
}
