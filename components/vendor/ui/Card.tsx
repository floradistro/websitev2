import { getTheme, tw } from "@/lib/dashboard-theme";
import { ReactNode } from "react";

const vendorTheme = getTheme("vendor");

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function VendorCard({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={tw(
        vendorTheme.components.card,
        hover && vendorTheme.components.cardHover,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function VendorCardHeader({
  children,
  className,
  action,
}: CardHeaderProps) {
  return (
    <div
      className={tw(
        vendorTheme.components.cardHeader,
        "flex justify-between items-center",
        className,
      )}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function VendorCardContent({ children, className }: CardProps) {
  return (
    <div className={tw(vendorTheme.components.cardContent, className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function VendorCardTitle({ children, className }: CardTitleProps) {
  return (
    <h2 className={tw(vendorTheme.typography.label, className)}>{children}</h2>
  );
}
