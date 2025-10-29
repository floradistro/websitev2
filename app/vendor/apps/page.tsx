'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppAuth } from '@/context/AppAuthContext';
import { AppsGrid } from '@/components/admin/AppsGrid';
import { MapPin, User, Briefcase, Package, AlertCircle, DollarSign, AlertTriangle, Calendar, TrendingUp, Store, Sparkles, Plus } from 'lucide-react';
import { useVendorDashboard } from '@/hooks/useVendorData';
import { DashboardSkeleton } from '@/components/vendor/VendorSkeleton';
import { StatCard } from '@/components/ui/StatCard';
import { KPIWidget } from '@/components/dashboard/KPIWidget';
import { AIKPICreator } from '@/components/dashboard/AIKPICreator';

interface RecentProduct {
  id: number;
  name: string;
  image: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
}

interface LowStockItem {
  id: number;
  name: string;
  currentStock: number;
  threshold: number;
}

export default function MegaDashboard() {
  const { user, vendor, locations, primaryLocation, role } = useAppAuth();
  const { data: dashboardData, loading } = useVendorDashboard();

  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    totalSales30d: 0,
    lowStock: 0,
  });

  // KPI Widgets State
  const [showKPICreator, setShowKPICreator] = useState(false);
  const [kpiWidgets, setKpiWidgets] = useState<any[]>([]);

  useEffect(() => {
    if (!dashboardData) return;
    setStats({
      approved: dashboardData.stats?.approved || 0,
      pending: dashboardData.stats?.pending || 0,
      totalSales30d: dashboardData.stats?.totalSales30d || 0,
      lowStock: dashboardData.stats?.lowStock || 0,
    });
  }, [dashboardData]);

  // Load KPI widgets on mount
  useEffect(() => {
    const loadKPIWidgets = async () => {
      if (!vendor?.id) return;

      try {
        const response = await fetch(`/api/kpi-widgets?vendorId=${vendor.id}`);
        const data = await response.json();

        if (data.success) {
          setKpiWidgets(data.widgets);
        }
      } catch (error) {
        console.error('Error loading KPI widgets:', error);
      }
    };

    loadKPIWidgets();
  }, [vendor?.id]);

  // KPI Functions
  const handleSaveKPI = async (kpi: any) => {
    if (!vendor?.id) return;

    try {
      const response = await fetch('/api/kpi-widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          kpi: {
            ...kpi,
            originalPrompt: kpi.originalPrompt || '',
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setKpiWidgets(prev => [...prev, data.widget]);
      }
    } catch (error) {
      console.error('Error saving KPI widget:', error);
    }
  };

  const handleDeleteKPI = async (id: string) => {
    try {
      const response = await fetch(`/api/kpi-widgets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setKpiWidgets(prev => prev.filter(kpi => kpi.id !== id));
      }
    } catch (error) {
      console.error('Error deleting KPI widget:', error);
    }
  };

  const handleRefreshKPI = async (id: string) => {
    // TODO: Implement KPI refresh logic
    console.log('Refreshing KPI:', id);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const vendorBranding = dashboardData?.vendor;
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-black">
      {/* Ultra-Clean Hero */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="relative max-w-[1800px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

            {/* Left: Branding */}
            <div className="flex items-center gap-6">
              {/* Logo with Glow */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                {vendorBranding?.logo_url || vendor?.logo_url ? (
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                    <img
                      src={vendorBranding?.logo_url || vendor?.logo_url}
                      alt={vendor?.store_name || 'Vendor'}
                      className="w-full h-full object-contain p-3"
                    />
                    {/* Live Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-black flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <Store size={40} className="text-white/60" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Welcome */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight" style={{ fontWeight: 900 }}>
                  {vendor?.store_name || 'Dashboard'}
                </h1>
                <p className="text-white/40 text-lg">
                  {currentDate} • {currentTime}
                </p>
              </div>
            </div>

            {/* Right: Live Metrics */}
            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center">
                  <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">Live</div>
                  <div className="text-5xl font-black text-white mb-1" style={{ fontWeight: 900 }}>{stats.approved}</div>
                  <div className="text-white/60 text-sm font-medium uppercase tracking-wider">Products</div>
                </div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center">
                  <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">30 Days</div>
                  <div className="text-5xl font-black text-white mb-1" style={{ fontWeight: 900 }}>
                    ${(stats.totalSales30d / 1000).toFixed(1)}<span className="text-2xl">k</span>
                  </div>
                  <div className="text-white/60 text-sm font-medium uppercase tracking-wider">Revenue</div>
                </div>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className={`bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border ${stats.lowStock > 0 ? 'border-red-500/30' : 'border-white/10'} rounded-3xl p-6 text-center`}>
                  <div className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">Stock</div>
                  <div className={`text-5xl font-black mb-1 ${stats.lowStock > 0 ? 'text-red-400' : 'text-white'}`} style={{ fontWeight: 900 }}>{stats.lowStock}</div>
                  <div className="text-white/60 text-sm font-medium uppercase tracking-wider">Low</div>
                </div>
              </div>
            </div>
          </div>

          {/* Context Pills */}
          {(vendor || role || primaryLocation) && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {vendor && (
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2.5 hover:bg-white/10 transition-all">
                  <Briefcase size={16} className="text-white/60" />
                  <span className="text-sm text-white/90 font-medium">{vendor.store_name}</span>
                </div>
              )}
              {role && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2.5">
                  <User size={16} className="text-purple-300" />
                  <span className="text-sm text-purple-200 font-bold uppercase tracking-wider">
                    {role === 'vendor_admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Employee'}
                  </span>
                </div>
              )}
              {primaryLocation && (
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2.5 hover:bg-white/10 transition-all">
                  <MapPin size={16} className="text-white/60" />
                  <span className="text-sm text-white/90 font-medium">{primaryLocation.name}</span>
                  {locations.length > 1 && (
                    <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">+{locations.length - 1}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12 space-y-12">

        {/* Quick Stats */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 tracking-tight" style={{ fontWeight: 900 }}>
            Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              label="Live Products"
              value={stats.approved}
              sublabel="Currently Selling"
              icon={Package}
              loading={loading}
              delay="0s"
            />
            <StatCard
              label="Pending Review"
              value={stats.pending}
              sublabel="Awaiting Approval"
              icon={AlertCircle}
              loading={loading}
              delay="0.1s"
            />
            <StatCard
              label="Revenue (30d)"
              value={`$${stats.totalSales30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sublabel="This Month"
              icon={DollarSign}
              loading={loading}
              delay="0.2s"
            />
            <StatCard
              label="Low Stock"
              value={stats.lowStock}
              sublabel={stats.lowStock > 0 ? 'Need Restocking' : 'All Stocked'}
              icon={AlertTriangle}
              loading={loading}
              delay="0.3s"
            />
          </div>
        </div>

        {/* Custom KPI Widgets Section */}
        {kpiWidgets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
                Custom Metrics
              </h2>
              <button
                onClick={() => setShowKPICreator(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl text-sm font-medium text-white transition-all"
              >
                <Plus size={16} />
                Add KPI
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {kpiWidgets.map((kpi) => (
                <KPIWidget
                  key={kpi.id}
                  {...kpi}
                  onDelete={() => handleDeleteKPI(kpi.id)}
                  onRefresh={() => handleRefreshKPI(kpi.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Apps Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
              Your Apps
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowKPICreator(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 rounded-2xl text-sm font-medium text-white transition-all"
              >
                <Sparkles size={16} className="text-purple-400" />
                Create Custom KPI
              </button>
              <div className="text-sm text-white/40 uppercase tracking-widest">
                Launch Anything
              </div>
            </div>
          </div>
          <AppsGrid />
        </div>
      </div>

      {/* AI KPI Creator Modal */}
      <AIKPICreator
        isOpen={showKPICreator}
        onClose={() => setShowKPICreator(false)}
        onSave={handleSaveKPI}
        vendorId={vendor?.id || ''}
      />
    </div>
  );
}
