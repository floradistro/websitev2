"use client";

import { Sparkles, X, CheckCircle } from 'lucide-react';

interface AIAutofillPanelProps {
  aiSuggestions: any;
  showSuggestions: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function AIAutofillPanel({
  aiSuggestions,
  showSuggestions,
  onClose,
  onApply
}: AIAutofillPanelProps) {
  if (!showSuggestions || !aiSuggestions) return null;

  return (
    <div className="mt-3 bg-[#141414] border border-white/10 rounded-2xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-white text-[9px] uppercase tracking-[0.15em] font-black flex items-center gap-1.5" style={{ fontWeight: 900 }}>
          <Sparkles size={10} strokeWidth={2.5} />
          AI Data
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X size={10} />
        </button>
      </div>

      {/* Show ALL data - POS THEME */}
      <div className="space-y-2.5">
        {aiSuggestions.strain_type && (
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[9px] uppercase tracking-[0.15em] w-16">Type</span>
            <span className="text-white text-[10px] font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{aiSuggestions.strain_type}</span>
          </div>
        )}
        {aiSuggestions.lineage && (
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[9px] uppercase tracking-[0.15em] w-16">Lineage</span>
            <span className="text-white text-[10px] font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{aiSuggestions.lineage}</span>
          </div>
        )}
        {aiSuggestions.nose && aiSuggestions.nose.length > 0 && (
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Nose</div>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.nose.map((aroma: string, idx: number) => (
                <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>
                  {aroma}
                </span>
              ))}
            </div>
          </div>
        )}
        {aiSuggestions.effects && aiSuggestions.effects.length > 0 && (
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Effects</div>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.effects.map((effect: string, idx: number) => (
                <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider">
                  {effect}
                </span>
              ))}
            </div>
          </div>
        )}
        {aiSuggestions.terpenes && aiSuggestions.terpenes.length > 0 && (
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Terpenes</div>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.terpenes.map((terpene: string, idx: number) => (
                <span key={idx} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider">
                  {terpene}
                </span>
              ))}
            </div>
          </div>
        )}
        {aiSuggestions.description && (
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">Description</div>
            <p className="text-white/60 text-[10px] leading-relaxed">{aiSuggestions.description}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onApply}
        className="w-full bg-white/10 border-2 border-white/20 text-white rounded-2xl px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all flex items-center justify-center gap-1.5"
        style={{ fontWeight: 900 }}
      >
        <CheckCircle size={11} strokeWidth={2.5} />
        Fill All Fields
      </button>
    </div>
  );
}
