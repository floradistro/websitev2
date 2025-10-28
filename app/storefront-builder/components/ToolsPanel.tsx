/**
 * Tools Panel Component
 * Direct code manipulation tools (no AI)
 */

import { Grid, MinusCircle, PlusCircle, Type, Settings, AlignLeft, AlignCenter, AlignRight, Bold, Palette } from 'lucide-react';
import { Vendor } from '@/lib/storefront-builder/types';

interface ToolsPanelProps {
  tools: {
    hideDescription: () => void;
    showBlueprintFields: () => void;
    changeGridColumns: (cols: number) => void;
    adjustSpacing: (direction: 'more' | 'less') => void;
    adjustImageSize: (size: 'bigger' | 'smaller') => void;
    hidePrice: () => void;
    showStockQuantity: () => void;
    adjustFontSize: (direction: 'increase' | 'decrease') => void;
    adjustFontWeight: (direction: 'increase' | 'decrease') => void;
    setTextAlignment: (align: 'left' | 'center' | 'right') => void;
    toggleUppercase: () => void;
    adjustTextOpacity: (direction: 'increase' | 'decrease') => void;
    applyFont: (fontName: string) => void;
    addVendorBranding: (vendor: Vendor) => void;
  };
  currentVendor?: Vendor;
  onShowFontPicker: () => void;
}

export function ToolsPanel({ tools, currentVendor, onShowFontPicker }: ToolsPanelProps) {
  return (
    <div className="p-4 border-b border-white/5 space-y-4">
      {/* Layout Tools */}
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-black" style={{ fontWeight: 900 }}>
          Layout
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => tools.changeGridColumns(2)}
            className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Grid size={12} strokeWidth={2} />
            2 Cols
          </button>
          <button
            onClick={() => tools.changeGridColumns(3)}
            className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Grid size={12} strokeWidth={2} />
            3 Cols
          </button>
          <button
            onClick={() => tools.changeGridColumns(4)}
            className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Grid size={12} strokeWidth={2} />
            4 Cols
          </button>
        </div>
      </div>

      {/* Spacing Tools */}
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-black" style={{ fontWeight: 900 }}>
          Spacing
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => tools.adjustSpacing('less')}
            className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <MinusCircle size={12} strokeWidth={2} />
            Less
          </button>
          <button
            onClick={() => tools.adjustSpacing('more')}
            className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <PlusCircle size={12} strokeWidth={2} />
            More
          </button>
        </div>
      </div>

      {/* Typography Tools */}
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-black" style={{ fontWeight: 900 }}>
          Typography
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => tools.adjustFontSize('decrease')}
              className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all"
              style={{ fontWeight: 900 }}
            >
              A-
            </button>
            <button
              onClick={() => tools.adjustFontSize('increase')}
              className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all"
              style={{ fontWeight: 900 }}
            >
              A+
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => tools.setTextAlignment('left')}
              className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <AlignLeft size={12} strokeWidth={2} className="mx-auto" />
            </button>
            <button
              onClick={() => tools.setTextAlignment('center')}
              className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <AlignCenter size={12} strokeWidth={2} className="mx-auto" />
            </button>
            <button
              onClick={() => tools.setTextAlignment('right')}
              className="flex-1 bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <AlignRight size={12} strokeWidth={2} className="mx-auto" />
            </button>
          </div>

          <button
            onClick={() => tools.toggleUppercase()}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all"
            style={{ fontWeight: 900 }}
          >
            Toggle Uppercase
          </button>

          <button
            onClick={onShowFontPicker}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Type size={12} strokeWidth={2} />
            Change Font
          </button>
        </div>
      </div>

      {/* Product Display Tools */}
      <div>
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-black" style={{ fontWeight: 900 }}>
          Product Display
        </div>
        <div className="space-y-2">
          <button
            onClick={() => tools.hideDescription()}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all text-left"
            style={{ fontWeight: 900 }}
          >
            Hide Description
          </button>
          <button
            onClick={() => tools.showBlueprintFields()}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all text-left"
            style={{ fontWeight: 900 }}
          >
            Show Fields
          </button>
          <button
            onClick={() => tools.hidePrice()}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all text-left"
            style={{ fontWeight: 900 }}
          >
            Hide Price
          </button>
          <button
            onClick={() => tools.showStockQuantity()}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all text-left"
            style={{ fontWeight: 900 }}
          >
            Show Stock
          </button>
        </div>
      </div>

      {/* Branding Tools */}
      {currentVendor && (
        <div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-black" style={{ fontWeight: 900 }}>
            Branding
          </div>
          <button
            onClick={() => tools.addVendorBranding(currentVendor)}
            className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Palette size={12} strokeWidth={2} />
            Add Vendor Logo
          </button>
        </div>
      )}
    </div>
  );
}
