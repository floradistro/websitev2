import { ReactNode } from 'react';
import { ds, cn } from '@/lib/design-system';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  padding?: 'none' | 'compact' | 'normal';
  className?: string;
}

/**
 * 🎯 Standardized Card Component
 *
 * Minimal padding, professional
 */
export function Card({
  children,
  title,
  subtitle,
  headerActions,
  padding = 'compact',
  className = '',
}: CardProps) {
  const paddingStyles = {
    none: '',
    compact: 'p-3',
    normal: 'p-4',
  };

  return (
    <div className={cn(
      ds.colors.bg.primary,
      ds.colors.border.default,
      'border',
      ds.effects.radius.xl,
      className
    )}>
      {/* Header - Compact */}
      {(title || headerActions) && (
        <div className={cn(
          'flex items-center justify-between px-3 py-2',
          ds.colors.border.default,
          'border-b'
        )}>
          <div>
            {title && (
              <h3 className={cn(
                ds.typography.size.sm,
                ds.typography.weight.light,
                ds.colors.text.secondary,
                ds.typography.tracking.tight
              )}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={cn(
                ds.typography.size.xs,
                ds.typography.weight.light,
                ds.colors.text.quaternary,
                'mt-0.5'
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={paddingStyles[padding]}>
        {children}
      </div>
    </div>
  );
}

/**
 * Simple container card without header
 */
export function Container({
  children,
  padding = 'compact',
  className = '',
}: Pick<CardProps, 'children' | 'padding' | 'className'>) {
  const paddingStyles = {
    none: '',
    compact: 'p-3',
    normal: 'p-4',
  };

  return (
    <div className={cn(
      ds.colors.bg.primary,
      ds.colors.border.default,
      'border',
      ds.effects.radius.xl,
      paddingStyles[padding],
      className
    )}>
      {children}
    </div>
  );
}
