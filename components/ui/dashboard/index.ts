/**
 * UNIFIED DASHBOARD UI COMPONENTS
 * Works for Admin, Vendor, and any future dashboards
 * 
 * Usage:
 * import { DashboardCard, DashboardButton } from '@/components/ui/dashboard';
 * <DashboardCard theme="admin"> or <DashboardCard theme="vendor">
 */

export { DashboardCard, DashboardCardHeader, DashboardCardContent, DashboardCardTitle } from './Card';
export { DashboardButton } from './Button';
export { DashboardStat } from './Stat';

// Re-export theme utilities
export { getTheme, tw, adminTheme, vendorTheme, getComponentClasses } from '@/lib/dashboard-theme';
export type { ThemeName, Theme } from '@/lib/dashboard-theme';

