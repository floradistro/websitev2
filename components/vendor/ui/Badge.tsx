import { getTheme, tw } from "@/lib/dashboard-theme";

const vendorTheme = getTheme("vendor");

interface BadgeProps {
  children: React.ReactNode;
  variant?: "approved" | "pending" | "rejected" | "draft";
  className?: string;
}

export function VendorBadge({
  children,
  variant = "draft",
  className,
}: BadgeProps) {
  return (
    <span
      className={tw(
        vendorTheme.components.badge.base,
        vendorTheme.components.badge[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
