import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-16 text-center ${className}`}>
      <Icon size={64} className="text-white/20 mx-auto mb-6" />
      <p className="text-white/80 text-lg mb-2">{title}</p>
      {description && (
        <p className="text-white/40 text-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

