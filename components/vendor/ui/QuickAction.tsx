import { getTheme, tw } from '@/lib/dashboard-theme';

const vendorTheme = getTheme('vendor');
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function VendorQuickAction({ href, icon: Icon, label, className }: QuickActionProps) {
  return (
    <Link
      href={href}
      className={tw(vendorTheme.components.action, className)}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
        <Icon
          size={20}
          className="text-white/60 group-hover:text-white transition-colors duration-300"
          strokeWidth={1.5}
        />
      </div>
      <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">
        {label}
      </div>
    </Link>
  );
}

