import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
}: BadgeProps) {
  const variantClass = (() => {
    switch (variant) {
      case "success":
        return "badge-success";
      case "warning":
        return "badge-warning";
      case "error":
        return "badge-error";
      case "neutral":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  })();

  const sizeClass = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "";

  return (
    <span className={`badge-base ${variantClass} ${sizeClass}`}>
      {children}
    </span>
  );
}
