/**
 * UNIFIED UI COMPONENTS
 * Works across Admin, Vendor, and any dashboard
 * Simple, clean, no theme prop needed
 * 
 * Usage:
 * import { Card, Button, Stat, StatCard, PageHeader } from '@/components/ui';
 */

// Core components
export { Card, CardHeader, CardContent, CardTitle } from './Card';
export { Button } from './Button';
export { Stat } from './Stat';
export { Input } from './Input';
export { Badge } from './Badge';

// Layout helpers
export { Grid } from './Grid';
export { StatsGrid } from './StatsGrid';

// Content components
export { StatCard } from './StatCard';
export { QuickActionCard, QuickActionsGrid } from './QuickActionCard';
export { RecentItemsList } from './RecentItemsList';
export { AlertBanner } from './AlertBanner';
export { PageHeader } from './PageHeader';
export { ChartCard } from './ChartCard';
export { ActionsList } from './ActionsList';
export { DataTable } from './DataTable';

// Loading states
export { LoadingSpinner, LoadingState } from './Loading';

// Empty states
export { EmptyState } from './EmptyState';

// Theme
export { theme, cn } from '@/lib/theme';
export type { Theme } from '@/lib/theme';

