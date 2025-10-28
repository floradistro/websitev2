/**
 * Font Picker Modal Component
 * Google Fonts library with live previews
 */

import { Type } from 'lucide-react';
import { FONT_LIBRARY } from '@/lib/storefront-builder/constants';

interface FontPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectFont: (fontName: string) => void;
}

export function FontPicker({ isVisible, onClose, onSelectFont }: FontPickerProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[800px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type size={16} className="text-white/60" strokeWidth={2} />
            <div className="text-white text-base font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Font Library
            </div>
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

        {/* Font List with Previews */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {FONT_LIBRARY.map(font => (
              <button
                key={font.name}
                onClick={() => onSelectFont(font.name)}
                className="bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all text-left group"
              >
                <link
                  href={`https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@${font.weights.join(';')}&display=swap`}
                  rel="stylesheet"
                />
                <div className="mb-3 pb-3 border-b border-white/5">
                  <div className="text-white font-black uppercase text-xs mb-1" style={{ fontWeight: 900 }}>
                    {font.name}
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">
                    {font.category}
                  </div>
                </div>
                <div
                  className="text-white text-2xl mb-2 transition-all group-hover:text-white"
                  style={{ fontFamily: `'${font.name}', sans-serif`, fontWeight: 900 }}
                >
                  The Quick Brown Fox
                </div>
                <div
                  className="text-white/60 text-sm leading-relaxed"
                  style={{ fontFamily: `'${font.name}', sans-serif` }}
                >
                  Jumps over the lazy dog. 1234567890
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
