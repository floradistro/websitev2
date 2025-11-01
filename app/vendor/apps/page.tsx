'use client';

import { useEffect, useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { AppsGrid } from '@/components/admin/AppsGrid';
import { MapPin, User, Briefcase, Store, Sparkles, TrendingUp, Package } from 'lucide-react';
import { useVendorDashboard } from '@/hooks/useVendorData';
import { DashboardSkeleton } from '@/components/vendor/VendorSkeleton';
import { KPIWidget } from '@/components/dashboard/KPIWidget';
import { AIKPICreator } from '@/components/dashboard/AIKPICreator';

export default function MegaDashboard() {
  const { user, vendor, locations, primaryLocation, role } = useAppAuth();
  const { data: dashboardData, loading } = useVendorDashboard();

  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    totalSales30d: 0,
    lowStock: 0,
  });

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

  const handleSaveKPI = async (kpi: any) => {
    if (!vendor?.id) return;
    try {
      const response = await fetch('/api/kpi-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          kpi: { ...kpi, originalPrompt: kpi.originalPrompt || '' },
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
      const response = await fetch(`/api/kpi-widgets?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setKpiWidgets(prev => prev.filter(kpi => kpi.id !== id));
      }
    } catch (error) {
      console.error('Error deleting KPI widget:', error);
    }
  };

  const handleRefreshKPI = async (id: string) => {
    console.log('Refreshing KPI:', id);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const vendorBranding = dashboardData?.vendor;
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="h-full bg-black overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 py-4">
        {/* Stats Widgets - POS Style */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
          {/* Products Widget */}
          <div className="bg-[#0a0a0a] rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                Products
              </div>
              <Package size={12} className="text-cyan-400" strokeWidth={2} />
            </div>
            <div className="text-white text-2xl font-semibold tracking-tight">{stats.approved}</div>
          </div>

          {/* Revenue Widget */}
          <div className="bg-[#0a0a0a] rounded-xl px-3 py-2 border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                Revenue
              </div>
              <TrendingUp size={12} className="text-green-400" strokeWidth={2} />
            </div>
            <div className="text-white text-2xl font-semibold tracking-tight">${(stats.totalSales30d / 1000).toFixed(1)}k</div>
          </div>
        </div>

        {/* App Grid - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
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
