"use client";

import { useEffect, useState, useRef } from 'react';
import { Activity, Database, Zap, TrendingUp, AlertCircle, CheckCircle, Cpu, Wifi, HardDrive, Gauge } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceStats {
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
  hitRate: string;
  hits: number;
  misses: number;
  total: number;
  sizes: {
    product: { size: number; max: number; ttl: number };
    vendor: { size: number; max: number; ttl: number };
    inventory: { size: number; max: number; ttl: number };
  };
}

interface MonitoringData {
  success: boolean;
  timestamp: string;
  health: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };
  performance: Record<string, PerformanceStats>;
  cache: CacheStats;
}

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [cacheHistory, setCacheHistory] = useState<any[]>([]);
  const animationRef = useRef<number | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/admin/performance-stats', { cache: 'no-store' });
        const data = await response.json();
        setStats(data);
        setLoading(false);
        
        // Update performance history for charts
        const timestamp = new Date().toLocaleTimeString();
        setPerformanceHistory(prev => {
          const newHistory = [...prev, {
            time: timestamp,
            responseTime: data.performance?.['Product List']?.avg || 0,
            cacheHit: parseFloat(data.cache?.hitRate || '0'),
            health: data.health?.score || 0
          }].slice(-20); // Keep last 20 data points
          return newHistory;
        });
        
        // Update cache history
        setCacheHistory(prev => {
          const newHistory = [...prev, {
            time: timestamp,
            hits: data.cache?.hits || 0,
            misses: data.cache?.misses || 0,
            hitRate: parseFloat(data.cache?.hitRate || '0')
          }].slice(-10);
          return newHistory;
        });
      } catch (error) {
        console.error('Error loading performance stats:', error);
        setLoading(false);
      }
    }

    loadStats();

    if (autoRefresh) {
      const interval = setInterval(loadStats, 2000); // Faster refresh for smoother animations
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Pulse animation for live indicator
  useEffect(() => {
    const animate = () => {
      setPulseAnimation(prev => (prev + 1) % 100);
      animationRef.current = requestAnimationFrame(animate);
    };
    if (autoRefresh) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoRefresh]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };

  const getPerformanceColor = (avg: number) => {
    if (avg < 50) return 'text-green-500';
    if (avg < 200) return 'text-yellow-500';
    if (avg < 500) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading monitoring data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">No monitoring data available</div>
      </div>
    );
  }

  // Prepare data for radial chart - monochrome
  const healthRadialData = stats ? [{
    name: 'Health',
    value: stats.health.score,
    fill: stats.health.score >= 90 ? '#ffffff' : stats.health.score >= 70 ? '#9ca3af' : '#6b7280'
  }] : [];

  // Prepare cache performance data for pie chart - monochrome
  const cacheData = stats ? [
    { name: 'Hits', value: stats.cache.hits, fill: '#ffffff' },
    { name: 'Misses', value: stats.cache.misses, fill: '#374151' }
  ] : [];

  // Custom tooltip styles - minimal and elegant
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/10 p-3">
          <p className="text-white/60 text-xs font-light">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-white/80 font-light">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Subtle, professional animations */}
      <style jsx>{`
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .subtle-pulse {
          animation: subtle-pulse 3s infinite;
        }
        .gentle-float {
          animation: gentle-float 4s ease-in-out infinite;
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Minimalist Header */}
      <div className="max-w-7xl mx-auto mb-12 fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
              Performance Monitor
            </h1>
            <p className="text-white/40 text-xs font-light tracking-wide">
              SYSTEM METRICS · {new Date(stats.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-5 py-2 text-[11px] font-light tracking-[0.2em] border transition-all ${
              autoRefresh
                ? 'text-white border-white/20 bg-white/5'
                : 'text-white/40 border-white/10 hover:text-white/60 hover:border-white/20'
            }`}
          >
            {autoRefresh ? 'LIVE' : 'PAUSED'}
          </button>
        </div>

        {/* Main Grid - Minimal and Professional */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {/* Health Score - Minimalist */}
          <div className="minimal-glass subtle-glow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em]">HEALTH</h3>
                <div className="w-1 h-1 bg-white/20 rounded-full subtle-pulse" />
              </div>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={healthRadialData}>
                    <RadialBar
                      dataKey="value"
                      cornerRadius={0}
                      fill={healthRadialData[0]?.fill}
                      background={{ fill: '#0a0a0a' }}
                    />
                    <text 
                      x="50%" 
                      y="45%" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="fill-white text-5xl font-thin"
                    >
                      {stats.health.score}
                    </text>
                    <text 
                      x="50%" 
                      y="65%" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="fill-white/40 text-[10px] font-light tracking-widest"
                    >
                      {stats.health.status?.toUpperCase()}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cache Performance - Clean Design */}
          <div className="minimal-glass subtle-glow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em]">CACHE</h3>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={cacheData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
                    stroke="none"
                  >
                    {cacheData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-white text-2xl font-thin">{stats.cache.hitRate}</div>
                  <div className="text-white/30 text-[10px] font-light tracking-wider">HIT RATE</div>
                </div>
                <div className="text-center">
                  <div className="text-white/60 text-2xl font-thin">{stats.cache.total}</div>
                  <div className="text-white/30 text-[10px] font-light tracking-wider">REQUESTS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Metrics - Ultra Minimal */}
          <div className="minimal-glass subtle-glow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em]">METRICS</h3>
                <div className={`w-1 h-1 rounded-full ${autoRefresh ? 'bg-white/60 subtle-pulse' : 'bg-white/20'}`} />
              </div>
              <div className="space-y-6">
                {Object.entries(stats.cache.sizes).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] mb-2">
                      <span className="text-white/30 uppercase tracking-wider">{key}</span>
                      <span className="text-white/60 font-light">{value.size} / {value.max}</span>
                    </div>
                    <div className="h-[2px] bg-black/50">
                      <div 
                        className="h-full bg-white/20 transition-all duration-1000"
                        style={{ width: `${(value.size / value.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Live Performance Chart - Minimal Line Graph */}
        {performanceHistory.length > 0 && (
          <div className="minimal-glass subtle-glow mb-8 fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em]">RESPONSE TIME</h3>
                <div className="text-white/40 text-[10px] font-light">MS</div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={performanceHistory}>
                  <defs>
                    <linearGradient id="whiteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#ffffff"
                    strokeWidth={1}
                    fill="url(#whiteGradient)"
                    animationDuration={300}
                  />
                  <XAxis 
                    dataKey="time" 
                    hide={true}
                  />
                  <YAxis 
                    hide={true}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      {/* Performance Stats Grid - Ultra Clean */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] mb-6">PERFORMANCE METRICS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Hit Rate */}
          <div className="minimal-glass p-6">
            <div className="mb-2">
              <span className="text-3xl font-thin text-white">
                {stats.cache.hitRate}
              </span>
            </div>
            <div className="text-white/30 text-[10px] font-light tracking-widest">HIT RATE</div>
            <div className="text-white/20 text-[10px] mt-2">
              {stats.cache.hits} / {stats.cache.total}
            </div>
          </div>

          {/* Product Cache */}
          <div className="minimal-glass p-6">
            <div className="mb-2">
              <span className="text-3xl font-thin text-white/80">
                {stats.cache.sizes.product.size}
              </span>
            </div>
            <div className="text-white/30 text-[10px] font-light tracking-widest">PRODUCTS</div>
            <div className="text-white/20 text-[10px] mt-2">
              MAX {stats.cache.sizes.product.max}
            </div>
          </div>

          {/* Vendor Cache */}
          <div className="minimal-glass p-6">
            <div className="mb-2">
              <span className="text-3xl font-thin text-white/80">
                {stats.cache.sizes.vendor.size}
              </span>
            </div>
            <div className="text-white/30 text-[10px] font-light tracking-widest">VENDORS</div>
            <div className="text-white/20 text-[10px] mt-2">
              MAX {stats.cache.sizes.vendor.max}
            </div>
          </div>

          {/* Inventory Cache */}
          <div className="minimal-glass p-6">
            <div className="mb-2">
              <span className="text-3xl font-thin text-white/80">
                {stats.cache.sizes.inventory.size}
              </span>
            </div>
            <div className="text-white/30 text-[10px] font-light tracking-widest">INVENTORY</div>
            <div className="text-white/20 text-[10px] mt-2">
              MAX {stats.cache.sizes.inventory.max}
            </div>
          </div>
        </div>
      </div>

      {/* API Performance - Minimal Table */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] mb-6">API PERFORMANCE</h2>
        {Object.keys(stats.performance).length === 0 ? (
          <div className="minimal-glass p-12 text-center">
            <div className="text-white/20 text-sm font-thin">No performance data available</div>
            <div className="text-white/10 text-[10px] mt-2 tracking-wider">
              METRICS WILL APPEAR AFTER API ACTIVITY
            </div>
          </div>
        ) : (
          <div className="minimal-glass overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="text-left p-4 text-white/30 text-[10px] font-light tracking-widest">OPERATION</th>
                  <th className="text-right p-4 text-white/30 text-[10px] font-light tracking-widest">AVG</th>
                  <th className="text-right p-4 text-white/30 text-[10px] font-light tracking-widest">P50</th>
                  <th className="text-right p-4 text-white/30 text-[10px] font-light tracking-widest">P95</th>
                  <th className="text-right p-4 text-white/30 text-[10px] font-light tracking-widest">P99</th>
                  <th className="text-right p-4 text-white/30 text-[10px] font-light tracking-widest">COUNT</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.performance).map(([operation, data], index) => (
                  <tr key={operation} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-white/60 text-xs font-light">{operation}</td>
                    <td className="p-4 text-right text-white/80 text-xs font-light">
                      {data.avg.toFixed(0)}ms
                    </td>
                    <td className="p-4 text-right text-white/60 text-xs font-light">
                      {data.p50.toFixed(0)}ms
                    </td>
                    <td className="p-4 text-right text-white/60 text-xs font-light">
                      {data.p95.toFixed(0)}ms
                    </td>
                    <td className="p-4 text-right text-white/60 text-xs font-light">
                      {data.p99.toFixed(0)}ms
                    </td>
                    <td className="p-4 text-right text-white/40 text-xs font-light">
                      {data.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

