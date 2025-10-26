// Centralized exports for vendor UI components
// Import once, use everywhere

export { VendorButton } from './Button';
export { VendorCard, VendorCardHeader, VendorCardContent, VendorCardTitle } from './Card';
export { VendorInput } from './Input';
export { VendorBadge } from './Badge';
export { VendorStat } from './Stat';
export { VendorQuickAction } from './QuickAction';
export { VendorPageHeader } from './PageHeader';
export { VendorGrid } from './Grid';
export { VendorEmptyState } from './EmptyState';
export { VendorLoadingSpinner, VendorLoadingState } from './LoadingSpinner';

// Re-export theme utilities from unified dashboard theme
export { getTheme, tw, getComponentClasses } from '@/lib/dashboard-theme';

// Convenience export for vendor theme
import { getTheme } from '@/lib/dashboard-theme';
export const vendorTheme = getTheme('vendor');
