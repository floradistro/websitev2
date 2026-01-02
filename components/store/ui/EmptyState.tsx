import { getTheme, tw } from "@/lib/dashboard-theme";

const vendorTheme = getTheme("vendor");
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function VendorEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={tw("p-16 text-center", className)}>
      <Icon size={64} className="text-white/20 mx-auto mb-6" />
      <p className={tw(vendorTheme.typography.body, "text-lg mb-2")}>{title}</p>
      {description && (
        <p className={tw(vendorTheme.colors.text.muted, "text-sm mb-4")}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
