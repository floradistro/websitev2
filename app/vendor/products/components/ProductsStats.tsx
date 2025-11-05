import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, ds, cn } from '@/components/ds';

interface ProductsStatsProps {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  isLoading: boolean;
}

export function ProductsStats({
  total,
  inStock,
  lowStock,
  outOfStock,
  isLoading,
}: ProductsStatsProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: Package,
      iconOpacity: 'opacity-60',
    },
    {
      label: 'In Stock',
      value: inStock,
      icon: CheckCircle,
      iconOpacity: 'opacity-70',
    },
    {
      label: 'Low Stock',
      value: lowStock,
      icon: AlertTriangle,
      iconOpacity: 'opacity-60',
      highlight: lowStock > 0,
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      icon: XCircle,
      iconOpacity: 'opacity-50',
      highlight: outOfStock > 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6" role="status" aria-label="Loading statistics">
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
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6"
      role="region"
      aria-label="Inventory statistics"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            role="article"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <Card className={cn(
              "p-4 transition-all",
              stat.highlight && "ring-1 ring-white/20"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    ds.typography.size.micro,
                    ds.typography.weight.light,
                    ds.colors.text.quaternary,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    "mb-2"
                  )} id={`stat-label-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.label}
                  </p>
                  <p
                    className={cn(
                      ds.typography.size['3xl'],
                      ds.typography.weight.semibold,
                      "text-white/90"
                    )}
                    aria-describedby={`stat-label-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <Icon
                  className={cn("w-5 h-5 text-white", stat.iconOpacity)}
                  strokeWidth={1}
                  aria-hidden="true"
                />
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
