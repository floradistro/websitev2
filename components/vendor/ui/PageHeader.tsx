import { getTheme, tw } from '@/lib/dashboard-theme';

const vendorTheme = getTheme('vendor');
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function VendorPageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={tw('mb-12', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className={vendorTheme.typography.h1}>
            {title}
          </h1>
          {subtitle && (
            <p className={tw(vendorTheme.typography.label, 'mt-2')}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

