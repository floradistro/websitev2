/**
 * UNIFIED CARD COMPONENT
 * Works across Admin, Vendor, and any dashboard
 * No theme prop needed - identical styling everywhere
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
  return (
    <div
      className={`
        bg-white/[0.02] 
        backdrop-filter backdrop-blur-[20px] 
        border border-white/5 
        rounded-[14px] 
        shadow-[0_0_30px_rgba(255,255,255,0.02)]
        ${hover ? 'hover:bg-white/[0.03] transition-all duration-300' : ''}
        ${className}
      `}
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

export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`border-b border-white/5 p-6 flex justify-between items-center ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-white/40 text-[11px] uppercase tracking-[0.2em] font-light ${className}`}>
      {children}
    </h2>
  );
}

