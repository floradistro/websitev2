/**
 * UNIFIED CARD COMPONENT
 * Works for both Admin and Vendor dashboards
 */

import { getTheme, tw, ThemeName } from "@/lib/dashboard-theme";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  theme?: ThemeName;
  className?: string;
  hover?: boolean;
}

export function DashboardCard({ children, theme = "admin", className, hover = true }: CardProps) {
  const themeObj = getTheme(theme);

  return (
    <div
      className={tw(themeObj.components.card, hover && themeObj.components.cardHover, className)}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  theme?: ThemeName;
  className?: string;
  action?: ReactNode;
}

export function DashboardCardHeader({
  children,
  theme = "admin",
  className,
  action,
}: CardHeaderProps) {
  const themeObj = getTheme(theme);

  return (
    <div
      className={tw(themeObj.components.cardHeader, "flex justify-between items-center", className)}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function DashboardCardContent({ children, theme = "admin", className }: CardProps) {
  const themeObj = getTheme(theme);

  return <div className={tw(themeObj.components.cardContent, className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  theme?: ThemeName;
  className?: string;
}

export function DashboardCardTitle({ children, theme = "admin", className }: CardTitleProps) {
  const themeObj = getTheme(theme);

  return <h2 className={tw(themeObj.typography.label, className)}>{children}</h2>;
}
