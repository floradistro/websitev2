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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="h-full bg-black overflow-hidden flex flex-col relative">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full px-6 relative z-10">
        {/* Greeting Header */}
        <div className="mb-12 text-center">
          <h1 className="text-white/90 text-2xl tracking-tight mb-1 font-light">
            {getGreeting()}
          </h1>
          <p className="text-white/30 text-[11px] uppercase tracking-[0.2em] font-light">
            Select an app to continue
          </p>
        </div>

        {/* App Grid - Centered */}
        <div className="w-full max-w-4xl">
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
