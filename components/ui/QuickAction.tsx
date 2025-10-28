import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  badge?: ReactNode;
  external?: boolean;
  variant?: 'default' | 'highlight';
  cols?: 1 | 2;
}

export function QuickAction({
  href,
  icon: Icon,
  label,
  sublabel,
  badge,
  external = false,
  variant = 'default',
  cols = 1
}: QuickActionProps) {
  const colClass = cols === 2 ? 'col-span-2 lg:col-span-2' : '';

  const cardClass = variant === 'highlight'
    ? 'card-interactive'
    : 'minimal-glass hover:bg-white/[0.03]';

  const iconBg = variant === 'highlight'
    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/20 group-hover:border-blue-500/30'
    : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10';

  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className={`group ${cardClass} p-3 md:p-6 rounded-xl md:rounded-2xl transition-all duration-300 relative overflow-hidden flex items-center gap-2 md:gap-4 ${colClass} border-white/10`}
    >
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${iconBg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 border`}>
        <Icon size={16} className={`md:hidden ${variant === 'highlight' ? 'text-blue-400 group-hover:text-blue-300' : 'text-white/60 group-hover:text-white'} transition-colors duration-300`} strokeWidth={1.5} />
        <Icon size={20} className={`hidden md:block ${variant === 'highlight' ? 'text-blue-400 group-hover:text-blue-300' : 'text-white/60 group-hover:text-white'} transition-colors duration-300`} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white/90 group-hover:text-white text-[10px] md:text-sm uppercase tracking-[0.15em] font-light transition-colors duration-300 mb-0.5 md:mb-1">
          {label}
        </div>
        {sublabel && (
          <div className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider">
            {sublabel}
          </div>
        )}
      </div>
      {badge}
      {external && (
        <svg className="w-3 h-3 md:w-4 md:h-4 text-white/30 group-hover:text-white/60 transition-all duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      )}
    </Link>
  );
}
