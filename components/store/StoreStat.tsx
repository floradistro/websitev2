// Reusable stat card component
import { LucideIcon } from "lucide-react";

interface VendorStatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  delay?: string;
}

export function VendorStat({ label, value, sublabel, icon: Icon, delay }: VendorStatProps) {
  return (
    <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
          {label}
        </span>
        {Icon && (
          <Icon
            size={16}
            className="text-white/20 group-hover:text-white/30 transition-all duration-300"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="text-3xl font-thin text-white/90 mb-2">{value}</div>
      {sublabel && (
        <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">
          {sublabel}
        </div>
      )}
    </div>
  );
}
