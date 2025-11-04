"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, TrendingUp, Activity, AlertCircle, CheckCircle,
  Clock, Zap, Eye, Target, BarChart3, ArrowUpRight, ArrowDownRight,
  Calendar, Layers, Package, ShoppingCart, Sparkles
} from 'lucide-react';
import { ds, cn } from '@/components/ds';
import dynamic from 'next/dynamic';

// Lazy load charts
const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => ({ default: m.Line })), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => ({ default: m.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => ({ default: m.Bar })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false });

interface SaaSMetrics {
  mrr: number;
  arr: number;
  totalCustomers: number;
  activeTrials: number;
  churnedThisMonth: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  uptime: number;
  apiResponseTime: number;
  errorRate: number;

  // Growth metrics
  mrrGrowth: number;
  customerGrowth: number;

  // Engagement
  avgSessionDuration: number;
  featuresUsedPerUser: number;

  // Revenue trends
  revenueData: Array<{ date: string; revenue: number }>;
  customerData: Array<{ date: string; customers: number }>;
  activityData: Array<{ hour: string; users: number }>;
}

interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_active: string | null;
  plan: string;
  status: 'active' | 'trial' | 'churned';
  revenue: number;
  productsCount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<SaaSMetrics>({
    mrr: 0, arr: 0, totalCustomers: 0, activeTrials: 0, churnedThisMonth: 0,
    activeToday: 0, activeThisWeek: 0, activeThisMonth: 0, uptime: 99.9,
    apiResponseTime: 120, errorRate: 0.01, mrrGrowth: 0, customerGrowth: 0,
    avgSessionDuration: 0, featuresUsedPerUser: 0,
    revenueData: [], customerData: [], activityData: []
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const auth = localStorage.getItem('admin-auth');
    if (!auth) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMetrics();
      loadCustomers();
    }
  }, [timeRange, isAuthenticated]);

  const loadMetrics = async () => {
    try {
      const res = await fetch(`/api/admin/metrics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn(ds.colors.bg.primary, "min-h-screen flex items-center justify-center")}>
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white mb-4"></div>
          <p className={cn(ds.typography.size.lg, ds.colors.text.primary, "font-semibold")}>Loading Dashboard...</p>
          <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>Fetching latest metrics</p>
        </div>
      </div>
    );
  }

  const topCustomers = customers
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className={cn(ds.colors.bg.primary, "min-h-screen")}>
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={cn(ds.typography.size.xl, ds.typography.weight.bold, ds.colors.text.primary, "mb-1")}>
                WhaleTools Command Center
              </h1>
              <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
                Real-time SaaS platform intelligence · Last updated {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    timeRange === range
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-8 py-8 space-y-8">

        {/* Hero Metrics - Revenue & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.colors.text.quaternary, "mb-2")}>
                    Monthly Recurring Revenue
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, ds.colors.text.primary)}>
                      ${metrics.mrr.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      {metrics.mrrGrowth >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <span className={cn(
                        "text-sm font-semibold",
                        metrics.mrrGrowth >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {Math.abs(metrics.mrrGrowth)}%
                      </span>
                    </div>
                  </div>
                  <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
                    ${metrics.arr.toLocaleString()} ARR · {metrics.totalCustomers} paying customers
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10">
                  <DollarSign className="w-8 h-8 text-green-400" strokeWidth={2} />
                </div>
              </div>

              {/* Revenue Chart */}
              {metrics.revenueData.length > 0 && (
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Customer Growth */}
          <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.colors.text.quaternary, "mb-2")}>
                  Total Customers
                </p>
                <div className="flex items-baseline gap-3">
                  <p className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, ds.colors.text.primary)}>
                    {metrics.totalCustomers}
                  </p>
                  <div className="flex items-center gap-1">
                    {metrics.customerGrowth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                    <span className={cn(
                      "text-sm font-semibold",
                      metrics.customerGrowth >= 0 ? "text-blue-400" : "text-red-400"
                    )}>
                      {Math.abs(metrics.customerGrowth)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
                <Users className="w-8 h-8 text-blue-400" strokeWidth={2} />
              </div>
            </div>

            {/* Customer Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>Active Trials</span>
                </div>
                <span className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                  {metrics.activeTrials}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>Churned (30d)</span>
                </div>
                <span className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                  {metrics.churnedThisMonth}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>Churn Rate</span>
                </div>
                <span className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                  {metrics.totalCustomers > 0
                    ? ((metrics.churnedThisMonth / metrics.totalCustomers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EngagementCard
            title="Active Today"
            value={metrics.activeToday}
            subtitle={`${metrics.activeThisWeek} this week`}
            icon={Activity}
            color="purple"
          />

          <EngagementCard
            title="Avg Session"
            value={`${Math.floor(metrics.avgSessionDuration / 60)}m`}
            subtitle={`${metrics.avgSessionDuration % 60}s per user`}
            icon={Clock}
            color="orange"
          />

          <EngagementCard
            title="Features Used"
            value={metrics.featuresUsedPerUser.toFixed(1)}
            subtitle="Per user average"
            icon={Layers}
            color="pink"
          />

          <EngagementCard
            title="Uptime"
            value={`${metrics.uptime}%`}
            subtitle={`${metrics.apiResponseTime}ms response`}
            icon={Zap}
            color="green"
          />
        </div>

        {/* Activity Heatmap & Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity by Hour */}
          <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
            <h3 className={cn(ds.typography.size.md, ds.typography.weight.semibold, ds.colors.text.primary, "mb-6")}>
              Activity by Hour
            </h3>
            {metrics.activityData.length > 0 && (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="hour"
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="users" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
            <h3 className={cn(ds.typography.size.md, ds.typography.weight.semibold, ds.colors.text.primary, "mb-6")}>
              Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className={cn(ds.colors.icon.quaternary, "w-10 h-10 mx-auto mb-3")} />
                  <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
                    No customers yet
                  </p>
                </div>
              ) : (
                topCustomers.map((customer, idx) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      "hover:bg-white/5 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        idx === 1 ? "bg-gray-400/20 text-gray-400" :
                        idx === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-white/5 text-white/40"
                      )}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>
                          {customer.name || customer.email}
                        </p>
                        <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                          {customer.productsCount} products
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, "text-green-400")}>
                        ${customer.revenue.toLocaleString()}
                      </p>
                      <StatusBadge status={customer.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* All Customers Table */}
        <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
          <h3 className={cn(ds.typography.size.md, ds.typography.weight.semibold, ds.colors.text.primary, "mb-6")}>
            All Customers
          </h3>

          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className={cn(ds.colors.icon.quaternary, "w-16 h-16 mx-auto mb-4")} />
              <p className={cn(ds.typography.size.lg, ds.typography.weight.semibold, ds.colors.text.primary, "mb-2")}>
                No customers yet
              </p>
              <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
                Your first signup will appear here! Ready to launch? 🚀
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg",
                    "border border-white/5 hover:border-white/10 hover:bg-white/[0.02]",
                    "transition-all duration-200"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      customer.status === 'active' ? 'bg-green-500/10' :
                      customer.status === 'trial' ? 'bg-blue-500/10' : 'bg-red-500/10'
                    )}>
                      <Users className={cn(
                        "w-6 h-6",
                        customer.status === 'active' ? 'text-green-400' :
                        customer.status === 'trial' ? 'text-blue-400' : 'text-red-400'
                      )} />
                    </div>

                    <div className="flex-1">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                        {customer.name || 'Unnamed Customer'}
                      </p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                        {customer.email}
                      </p>
                    </div>

                    <div className="text-center px-4">
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1")}>Products</p>
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                        {customer.productsCount}
                      </p>
                    </div>

                    <div className="text-center px-4">
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1")}>Revenue</p>
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, "text-green-400")}>
                        ${customer.revenue.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right px-4">
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1")}>Joined</p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right px-4">
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-1")}>Last Active</p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                        {customer.last_active
                          ? new Date(customer.last_active).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={customer.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Components
function EngagementCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400' }
  };

  const colorClass = colors[color as keyof typeof colors];

  return (
    <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-6")}>
      <div className="flex items-center justify-between mb-4">
        <p className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.colors.text.quaternary)}>
          {title}
        </p>
        <div className={cn("p-2 rounded-lg", colorClass.bg)}>
          <Icon size={18} strokeWidth={2} className={colorClass.text} />
        </div>
      </div>
      <p className={cn(ds.typography.size.xl, ds.typography.weight.bold, ds.colors.text.primary, "mb-1")}>
        {value}
      </p>
      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
        {subtitle}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'trial' | 'churned' }) {
  const styles = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    churned: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <span className={cn(
      "px-3 py-1.5 rounded-full text-xs font-semibold border uppercase tracking-wider",
      styles[status]
    )}>
      {status}
    </span>
  );
}
