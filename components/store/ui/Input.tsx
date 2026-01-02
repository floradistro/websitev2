import { getTheme, tw } from "@/lib/dashboard-theme";

const vendorTheme = getTheme("vendor");
import { LucideIcon } from "lucide-react";

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function VendorInput({
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  label,
  disabled,
  className,
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && <label className={vendorTheme.typography.label}>{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={tw(vendorTheme.components.input, Icon && "pl-10", className)}
        />
      </div>
    </div>
  );
}
