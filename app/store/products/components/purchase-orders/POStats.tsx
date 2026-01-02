import { Package, Clock, Truck, CheckCircle, DollarSign } from "lucide-react";
import { ds, cn } from "@/components/ds";

interface POStatsProps {
  total: number;
  draft: number;
  active: number;
  completed: number;
  totalValue: number;
  isLoading: boolean;
}

export function POStats({ total, draft, active, completed, totalValue, isLoading }: POStatsProps) {
  const stats = [
    { label: "Total", value: total, icon: Package },
    { label: "Draft", value: draft, icon: Clock },
    { label: "Active", value: active, icon: Truck },
    { label: "Completed", value: completed, icon: CheckCircle },
    {
      label: "Total Value",
      value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border transition-all duration-300",
              ds.colors.bg.secondary,
              ds.colors.border.default,
              "hover:border-white/20",
            )}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    ds.typography.size.xs,
                    ds.typography.transform.uppercase,
                    ds.typography.tracking.wide,
                    ds.colors.text.quaternary,
                  )}
                >
                  {stat.label}
                </span>
                <Icon size={14} className="text-white/20" strokeWidth={1} />
              </div>
              <div className={cn("text-2xl font-light text-white", isLoading && "animate-pulse")}>
                {isLoading ? "—" : stat.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
