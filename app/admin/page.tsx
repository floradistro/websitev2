"use client";

import { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Activity,
  AlertCircle, CheckCircle, Clock, Zap
} from 'lucide-react';
import { ds, cn } from '@/components/ds';

// ============================================================================
// TYPES
// ============================================================================

interface SaaSMetrics {
  // Revenue
  mrr: number;
  arr: number;

  // Customers
  totalCustomers: number;
  activeTrials: number;
  churnedThisMonth: number;

  // Activity
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;

  // System
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
}

interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_active: string | null;
  plan: string;
  status: 'active' | 'trial' | 'churned';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SaaSMetrics>({
    mrr: 0,
    arr: 0,
    totalCustomers: 0,
    activeTrials: 0,
    churnedThisMonth: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0,
    uptime: 99.9,
    apiResponseTime: 120,
    errorRate: 0.01
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    loadCustomers();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
          <p className={cn(ds.colors.text.tertiary, "mt-4")}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(ds.colors.bg.primary, "min-h-screen p-8")}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary)}>
            WhaleTools Admin
          </h1>
          <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
            SaaS Platform Overview
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* MRR */}
          <MetricCard
            title="MRR"
            value={`$${metrics.mrr.toLocaleString()}`}
            subtitle={`$${metrics.arr.toLocaleString()} ARR`}
            icon={DollarSign}
            trend={null}
            color="green"
          />

          {/* Total Customers */}
          <MetricCard
            title="Customers"
            value={metrics.totalCustomers.toString()}
            subtitle={`${metrics.activeTrials} trials`}
            icon={Users}
            trend={null}
            color="blue"
          />

          {/* Active Users */}
          <MetricCard
            title="Active Today"
            value={metrics.activeToday.toString()}
            subtitle={`${metrics.activeThisWeek} this week`}
            icon={Activity}
            trend={null}
            color="purple"
          />

          {/* System Health */}
          <MetricCard
            title="Uptime"
            value={`${metrics.uptime}%`}
            subtitle={`${metrics.apiResponseTime}ms avg response`}
            icon={Zap}
            trend={null}
            color="orange"
          />
        </div>

        {/* Recent Customers */}
        <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-xl p-6")}>
          <h2 className={cn(ds.typography.size.md, ds.typography.weight.semibold, ds.colors.text.primary, "mb-6")}>
            Recent Customers
          </h2>

          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className={cn(ds.colors.icon.quaternary, "w-12 h-12 mx-auto mb-4")} />
              <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
                No customers yet. Your first signup will appear here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.slice(0, 10).map((customer) => (
                <div
                  key={customer.id}
                  className={cn(
                    ds.colors.bg.primary,
                    "border",
                    ds.colors.border.default,
                    "rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      customer.status === 'active' ? 'bg-green-500/10' :
                      customer.status === 'trial' ? 'bg-blue-500/10' : 'bg-red-500/10'
                    )}>
                      <Users className={cn(
                        "w-5 h-5",
                        customer.status === 'active' ? 'text-green-400' :
                        customer.status === 'trial' ? 'text-blue-400' : 'text-red-400'
                      )} />
                    </div>
                    <div>
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>
                        {customer.name || customer.email}
                      </p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                        {customer.email} · {customer.plan}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                        Joined {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                        {customer.last_active
                          ? `Active ${new Date(customer.last_active).toLocaleDateString()}`
                          : 'Never logged in'
                        }
                      </p>
                    </div>

                    <StatusBadge status={customer.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickStat
            label="Churned This Month"
            value={metrics.churnedThisMonth}
            color={metrics.churnedThisMonth > 0 ? 'red' : 'green'}
            icon={metrics.churnedThisMonth > 0 ? AlertCircle : CheckCircle}
          />

          <QuickStat
            label="Monthly Active"
            value={metrics.activeThisMonth}
            color="blue"
            icon={Activity}
          />

          <QuickStat
            label="Error Rate"
            value={`${(metrics.errorRate * 100).toFixed(2)}%`}
            color={metrics.errorRate > 1 ? 'red' : 'green'}
            icon={metrics.errorRate > 1 ? AlertCircle : CheckCircle}
          />
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  trend: { value: number; direction: 'up' | 'down' } | null;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400'
  };

  return (
    <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-xl p-6")}>
      <div className="flex items-center justify-between mb-4">
        <p className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.colors.text.tertiary)}>
          {title}
        </p>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon size={16} strokeWidth={2} />
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
      "px-3 py-1 rounded-full text-xs font-medium border",
      styles[status]
    )}>
      {status}
    </span>
  );
}

function QuickStat({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: any }) {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400'
  };

  return (
    <div className={cn(ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-xl p-4 flex items-center gap-4")}>
      <Icon className={cn("w-8 h-8", colorClasses[color as keyof typeof colorClasses])} strokeWidth={1.5} />
      <div>
        <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
          {label}
        </p>
        <p className={cn(ds.typography.size.lg, ds.typography.weight.semibold, ds.colors.text.primary)}>
          {value}
        </p>
      </div>
    </div>
  );
}
