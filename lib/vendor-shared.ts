// Shared vendor utilities - imported once, used everywhere

/**
 * Format currency for vendor displays
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date for vendor displays
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).toUpperCase();
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Get status badge classes
 */
export function getStatusBadgeClass(status: string): string {
  const styles = {
    approved: "bg-white/5 text-white/60 border-white/10",
    pending: "bg-white/5 text-white/60 border-white/10",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    draft: "bg-white/5 text-white/60 border-white/10",
    published: "bg-white/5 text-white/60 border-white/10",
  };
  return styles[status as keyof typeof styles] || styles.draft;
}

/**
 * Get next payout date
 */
export function getNextPayoutDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  return nextMonth.toISOString().split('T')[0];
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(price: number, cost: number): number {
  if (!price || !cost) return 0;
  return ((price - cost) / price) * 100;
}

