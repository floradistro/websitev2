import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "glass" | "base" | "dark" | "interactive";
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({
  children,
  variant = "glass",
  className = "",
  padding = "md",
  hover = true,
  style,
}: CardProps) {
  const baseClass = (() => {
    switch (variant) {
      case "glass":
        return "minimal-glass subtle-glow";
      case "base":
        return "card-base";
      case "dark":
        return "card-dark";
      case "interactive":
        return "card-interactive";
      default:
        return "minimal-glass subtle-glow";
    }
  })();

  const paddingClass = (() => {
    switch (padding) {
      case "sm":
        return "p-3 md:p-4";
      case "md":
        return "p-4 md:p-6";
      case "lg":
        return "p-6 md:p-8";
      case "none":
        return "";
      default:
        return "p-4 md:p-6";
    }
  })();

  const hoverClass = hover && variant === "glass" ? "hover:bg-white/[0.03]" : "";

  return (
    <div
      className={`${baseClass} ${paddingClass} ${hoverClass} rounded-xl md:rounded-2xl transition-all duration-300 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function CardHeader({ title, subtitle, action, noPadding = false }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between ${noPadding ? "mb-4 md:mb-6" : "p-4 md:p-6 border-b border-white/5"}`}
    >
      <div>
        <h3 className="text-label text-xs md:text-sm mb-1 md:mb-2">{title}</h3>
        {subtitle && <p className="text-sublabel text-[10px] md:text-xs">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardSectionProps {
  children: ReactNode;
  border?: boolean;
  className?: string;
}

export function CardSection({ children, border = false, className = "" }: CardSectionProps) {
  return (
    <div className={`${border ? "border-t border-white/5 pt-6" : ""} ${className}`}>{children}</div>
  );
}

// Alias for compatibility
export const CardTitle = CardHeader;
export const CardContent = CardSection;
