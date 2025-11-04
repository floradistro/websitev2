"use client";

import { useState } from 'react';
import { ExternalLink, Monitor, Tablet, Smartphone, RefreshCw } from 'lucide-react';
import { ds, cn } from '@/lib/design-system';

interface EnhancedStorefrontPreviewProps {
  vendorSlug?: string;
  className?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES = {
  desktop: { width: '100%', height: '800px', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '667px', icon: Smartphone, label: 'Mobile' }
};

/**
 * 🖥️ Enhanced Storefront Preview Component
 *
 * Live iframe preview with responsive viewport switching
 */
export function EnhancedStorefrontPreview({
  vendorSlug,
  className = ''
}: EnhancedStorefrontPreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!vendorSlug) {
    return (
      <div className={cn(
        'sticky top-8',
        ds.colors.bg.elevated,
        'border',
        ds.colors.border.default,
        ds.effects.radius.lg,
        'p-8',
        'text-center',
        className
      )}>
        <Monitor size={48} className={cn(ds.colors.text.quaternary, 'mx-auto mb-4')} />
        <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
          Storefront preview will appear here
        </p>
        <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mt-2')}>
          Save your branding settings to see live preview
        </p>
      </div>
    );
  }

  const storefrontUrl = `https://${vendorSlug}.floradistro.com`;
  const currentViewport = VIEWPORT_SIZES[viewport];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
  };

  return (
    <div className={cn(
      'sticky top-8',
      ds.colors.bg.elevated,
      'border',
      ds.colors.border.default,
      ds.effects.radius.lg,
      'overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'border-b',
        ds.colors.border.default,
        'px-4 py-3',
        'flex items-center justify-between'
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary
          )}>
            Live Preview
          </h3>

          {isLoading && (
            <RefreshCw
              size={12}
              className={cn(ds.colors.text.quaternary, 'animate-spin')}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport switcher */}
          <div className={cn(
            'flex items-center gap-1',
            'p-1',
            ds.colors.bg.primary,
            ds.effects.radius.md
          )}>
            {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => {
              const { icon: Icon, label } = VIEWPORT_SIZES[size];
              const isActive = viewport === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setViewport(size)}
                  className={cn(
                    'p-1.5',
                    ds.effects.radius.sm,
                    ds.effects.transition.fast,
                    isActive
                      ? cn(ds.colors.bg.elevated, ds.colors.text.secondary)
                      : cn('hover:bg-white/[0.04]', ds.colors.text.quaternary, 'hover:text-white/60')
                  )}
                  title={label}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(
              'p-1.5',
              ds.effects.radius.md,
              ds.colors.bg.primary,
              'hover:bg-white/[0.04]',
              ds.colors.text.quaternary,
              'hover:text-white/60',
              ds.effects.transition.fast
            )}
            title="Refresh preview"
          >
            <RefreshCw size={14} />
          </button>

          {/* Open in new tab */}
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-1.5',
              'px-2 py-1',
              ds.effects.radius.md,
              ds.colors.bg.primary,
              'hover:bg-white/[0.04]',
              'border',
              ds.colors.border.default,
              ds.colors.text.quaternary,
              'hover:text-white/60',
              ds.effects.transition.fast,
              ds.typography.size.micro
            )}
          >
            <span>Open Live</span>
            <ExternalLink size={10} strokeWidth={2} />
          </a>
        </div>
      </div>

      {/* Preview container */}
      <div className={cn(
        'p-4',
        'flex items-start justify-center',
        'min-h-[400px]',
        'bg-gradient-to-br from-black/20 to-white/5'
      )}>
        <div
          className={cn(
            'relative',
            ds.effects.transition.normal,
            viewport !== 'desktop' && 'shadow-2xl'
          )}
          style={{
            width: currentViewport.width,
            maxWidth: '100%'
          }}
        >
          {/* Device frame for mobile/tablet */}
          {viewport !== 'desktop' && (
            <div className={cn(
              'absolute -inset-2',
              'rounded-xl',
              'border-4',
              'border-white/10',
              'pointer-events-none'
            )} />
          )}

          {/* iframe */}
          <iframe
            key={refreshKey}
            src={storefrontUrl}
            className={cn(
              'w-full',
              'border',
              ds.colors.border.default,
              ds.effects.radius.lg,
              'bg-white'
            )}
            style={{ height: currentViewport.height }}
            onLoad={() => setIsLoading(false)}
            title="Storefront Preview"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className={cn(
              'absolute inset-0',
              'flex items-center justify-center',
              'bg-black/50',
              'backdrop-blur-sm',
              ds.effects.radius.lg
            )}>
              <div className="text-center">
                <RefreshCw
                  size={32}
                  className={cn(ds.colors.text.tertiary, 'animate-spin mx-auto mb-2')}
                />
                <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                  Loading preview...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className={cn(
        'border-t',
        ds.colors.border.default,
        'px-4 py-3'
      )}>
        <div className={cn(
          ds.typography.size.micro,
          ds.colors.text.quaternary,
          'space-y-1'
        )}>
          <div>💡 <strong>Tip:</strong> Changes appear after saving and may take a few seconds to update</div>
          <div>• Click refresh to reload the preview</div>
          <div>• Switch between devices to test responsiveness</div>
          <div>• Open live site to test full functionality</div>
        </div>
      </div>
    </div>
  );
}
