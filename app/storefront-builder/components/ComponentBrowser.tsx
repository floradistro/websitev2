/**
 * Component Browser Modal
 * Smart component templates for quick insertion
 */

import { SMART_COMPONENTS } from '@/lib/storefront-builder/constants';

interface ComponentBrowserProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectComponent: (componentKey: string) => void;
}

export function ComponentBrowser({ isVisible, onClose, onSelectComponent }: ComponentBrowserProps) {
  if (!isVisible) return null;

  const categories = ['layout', 'commerce', 'content', 'interactive'] as const;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[700px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="text-white text-base font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
            Smart Components
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto">
          {categories.map(category => {
            const components = SMART_COMPONENTS.filter(c => c.category === category);
            if (components.length === 0) return null;

            return (
              <div key={category} className="border-b border-white/5 last:border-0">
                <div className="px-6 py-3 bg-white/[0.02]">
                  <div className="text-white/40 text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                    {category}
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {components.map(comp => (
                    <button
                      key={comp.key}
                      onClick={() => {
                        onSelectComponent(comp.key);
                        onClose();
                      }}
                      className="w-full px-6 py-4 hover:bg-white/[0.03] transition-colors text-left group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-white/20 mt-2 group-hover:bg-white transition-colors"></div>
                        <div className="flex-1">
                          <div className="text-white text-base font-black uppercase tracking-tight mb-1 group-hover:text-white transition-colors" style={{ fontWeight: 900 }}>
                            {comp.name}
                          </div>
                          <div className="text-white/60 text-sm leading-relaxed">
                            {comp.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
