/**
 * UNIFIED ALERT/NOTIFICATION BANNER
 * For warnings, info, success messages at top of pages
 */

import Link from 'next/link';
import { LucideIcon, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  className?: string;
  dismissable?: boolean;
  onDismiss?: () => void;
}

export function AlertBanner({
  type = 'info',
  title,
  description,
  href,
  icon,
  className = '',
  dismissable = false,
  onDismiss,
}: AlertBannerProps) {
  const typeStyles = {
    info: 'border-l-blue-500/40',
    warning: 'border-l-yellow-500/40',
    success: 'border-l-green-500/40',
    error: 'border-l-red-500/40',
  };
  
  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: AlertCircle,
  };
  
  const Icon = icon || iconMap[type];
  
  const iconColor = {
    info: 'text-blue-500/80',
    warning: 'text-yellow-500/80',
    success: 'text-green-500/80',
    error: 'text-red-500/80',
  };
  
  const content = (
    <div className="flex items-center gap-4">
      <Icon 
        size={18} 
        className={`${iconColor[type]} flex-shrink-0 ${type === 'warning' ? 'animate-pulse' : ''}`}
        strokeWidth={1.5} 
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-light mb-1">{title}</p>
        {description && (
          <p className="text-white/40 text-xs font-light tracking-wide uppercase">
            {description}
          </p>
        )}
      </div>
      {href && (
        <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-all duration-300 transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
      {dismissable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDismiss?.();
          }}
          className="text-white/40 hover:text-white transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
  
  const baseClass = `
    block mb-8 
    bg-white/[0.02] backdrop-filter backdrop-blur-[20px] 
    border border-white/5 rounded-[14px] 
    hover:bg-white/[0.03] p-5 
    transition-all duration-300 group 
    -mx-4 lg:mx-0 fade-in 
    border-l-2 
    ${typeStyles[type]}
    ${className}
  `;
  
  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }
  
  return (
    <div className={baseClass}>
      {content}
    </div>
  );
}

