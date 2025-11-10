// Reusable vendor card component
interface VendorCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function VendorCard({ children, className = "", hover = true }: VendorCardProps) {
  return (
    <div
      className={`minimal-glass ${hover ? "hover:bg-white/[0.03]" : ""} transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function VendorCardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`border-b border-white/5 p-6 ${className}`}>{children}</div>;
}

export function VendorCardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function VendorCardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-white/40 text-[11px] font-light tracking-[0.2em] uppercase ${className}`}>
      {children}
    </h2>
  );
}
