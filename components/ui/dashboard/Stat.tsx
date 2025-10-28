import { getTheme, tw, ThemeName } from '@/lib/dashboard-theme';
import { LucideIcon } from 'lucide-react';

interface StatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  theme?: ThemeName;
  delay?: string;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardStat({
  label,
  value,
  sublabel,
  icon: Icon,
  theme = 'admin',
  delay,
  className,
  trend,
}: StatProps) {
  const themeObj = getTheme(theme);
  
  return (
    <div
      className={tw(themeObj.components.stat, className)}
     
    >
      <div className="flex items-center justify-between mb-4">
        <span className={themeObj.typography.label}>{label}</span>
        {Icon && (
          <Icon
            size={16}
            className="text-white/20 group-hover:text-white/30 transition-all duration-300"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className={themeObj.typography.stat}>
          {value}
        </div>
        {trend && (
          <span className={tw(
            'text-xs font-medium',
            trend.isPositive ? themeObj.colors.status.success : themeObj.colors.status.error
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      {sublabel && (
        <div className={themeObj.typography.sublabel}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

