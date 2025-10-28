import { getTheme, tw } from '@/lib/dashboard-theme';
import { LucideIcon } from 'lucide-react';

const vendorTheme = getTheme('vendor');

interface StatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  delay?: string;
  className?: string;
}

export function VendorStat({
  label,
  value,
  sublabel,
  icon: Icon,
  delay,
  className,
}: StatProps) {
  return (
    <div
      className={tw(vendorTheme.components.stat, className)}
     
    >
      <div className="flex items-center justify-between mb-4">
        <span className={vendorTheme.typography.label}>{label}</span>
        {Icon && (
          <Icon
            size={16}
            className="text-white/20 group-hover:text-white/30 transition-all duration-300"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className={vendorTheme.typography.stat}>
        {value}
      </div>
      {sublabel && (
        <div className={vendorTheme.typography.sublabel}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

