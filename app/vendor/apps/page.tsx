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
  const [badgeCounts, setBadgeCounts] = useState<{ [key: string]: number }>({});

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

  // Fetch badge counts
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      if (!vendor?.id) return;
      try {
        const response = await fetch(`/api/vendor/badge-counts?vendorId=${vendor.id}`);
        const data = await response.json();
        if (data.success) {
          setBadgeCounts(data.badgeCounts);
        }
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    };
    fetchBadgeCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
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
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-6">
        {/* Vendor Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shadow-lg shadow-black/30 transition-all duration-400">
            <img
              src={vendor?.logo_url || '/yacht-club-logo.png'}
              alt={vendor?.store_name || 'Logo'}
              className="w-full h-full object-contain p-3"
            />
          </div>
        </div>

        {/* Greeting Header */}
        <div className="mb-12 text-center">
          <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
            {getGreeting()}
          </h1>
          <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
            Select an app to continue
          </p>
        </div>

        {/* App Grid - Full Width */}
        <div className="w-full max-w-7xl">
          <AppsGrid badgeCounts={badgeCounts} />
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
