import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, ds, cn } from '@/components/ds';

interface ProductsStatsProps {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  isLoading: boolean;
}

export function ProductsStats({
  total,
  approved,
  pending,
  rejected,
  isLoading,
}: ProductsStatsProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Package,
      color: ds.colors.icon.blue,
    },
    {
      label: 'Approved',
      value: approved,
      icon: CheckCircle,
      color: ds.colors.icon.green,
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      color: ds.colors.icon.orange,
    },
    {
      label: 'Rejected',
      value: rejected,
      icon: XCircle,
      color: ds.colors.icon.red,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6" role="status" aria-label="Loading statistics">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className={cn("h-4 rounded w-20 mb-2", ds.colors.bg.elevated)} />
            <div className={cn("h-8 rounded w-12", ds.colors.bg.elevated)} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-4 gap-4 mb-6"
      role="region"
      aria-label="Product statistics"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            role="article"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")} id={`stat-label-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.label}
                  </p>
                  <p
                    className={cn(ds.typography.size['3xl'], ds.typography.weight.semibold, "text-white/90")}
                    aria-describedby={`stat-label-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <Icon className={cn("w-5 h-5", stat.color)} aria-hidden="true" />
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
