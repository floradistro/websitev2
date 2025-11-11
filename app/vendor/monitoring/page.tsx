"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface PerformanceData {
  healthScore: number;
  operations: Record<string, OperationStats>;
  cache: CacheStats;
  timestamp: number;
}

interface OperationStats {
  operation: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface CacheStats {
  total: number;
  hits: number;
  misses: number;
  hitRate: number;
  timeWindow?: number;
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/monitoring/performance?type=summary");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white">Loading performance metrics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-red-500">Failed to load performance metrics</div>
      </div>
    );
  }

  const healthColor =
    data.healthScore >= 90
      ? "text-green-500"
      : data.healthScore >= 70
        ? "text-yellow-500"
        : "text-red-500";

  const healthBg =
    data.healthScore >= 90
      ? "bg-green-500/20"
      : data.healthScore >= 70
        ? "bg-yellow-500/20"
        : "bg-red-500/20";

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Performance Monitoring
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time application performance metrics
            </p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              autoRefresh
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {autoRefresh ? "🟢 Auto-Refresh ON" : "⚪ Auto-Refresh OFF"}
          </button>
        </div>

        {/* Health Score */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-300">
                  System Health Score
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Overall application performance health
                </p>
              </div>
              <div className={`${healthBg} px-8 py-4 rounded-lg`}>
                <div className={`text-5xl font-bold ${healthColor}`}>
                  {data.healthScore}
                </div>
                <div className="text-sm text-gray-400 text-center mt-1">
                  / 100
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cache Metrics */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Cache Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-400">Hit Rate</div>
                <div className="text-3xl font-bold text-green-500 mt-1">
                  {data.cache.hitRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Requests</div>
                <div className="text-3xl font-bold text-white mt-1">
                  {data.cache.total.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Cache Hits</div>
                <div className="text-3xl font-bold text-green-500 mt-1">
                  {data.cache.hits.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Cache Misses</div>
                <div className="text-3xl font-bold text-red-500 mt-1">
                  {data.cache.misses.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Operations Performance */}
        <Card className="bg-gray-900 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Operation Performance
            </h2>
            <div className="space-y-4">
              {Object.entries(data.operations).length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No operation metrics available yet
                </div>
              ) : (
                Object.entries(data.operations).map(([name, stats]) => (
                  <div
                    key={name}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-white">{name}</div>
                        <div className="text-sm text-gray-400">
                          {stats.count} measurements
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Average</div>
                        <div className="text-xl font-bold text-white">
                          {stats.avg.toFixed(2)}ms
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Min</div>
                        <div className="font-semibold text-green-500">
                          {stats.min.toFixed(2)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">P50</div>
                        <div className="font-semibold text-white">
                          {stats.p50.toFixed(2)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">P95</div>
                        <div className="font-semibold text-yellow-500">
                          {stats.p95.toFixed(2)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">P99</div>
                        <div className="font-semibold text-orange-500">
                          {stats.p99.toFixed(2)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Max</div>
                        <div className="font-semibold text-red-500">
                          {stats.max.toFixed(2)}ms
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          Last updated:{" "}
          {new Date(data.timestamp).toLocaleTimeString()}
          {autoRefresh && " • Auto-refreshing every 5 seconds"}
        </div>
      </div>
    </div>
  );
}
