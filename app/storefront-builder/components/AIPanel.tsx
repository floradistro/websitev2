/**
 * AI Panel Component
 * AI custom prompt and generation controls
 */

import { Wand2, RefreshCw } from 'lucide-react';

interface AIPanelProps {
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function AIPanel({
  aiPrompt,
  setAiPrompt,
  isGenerating,
  onGenerate,
}: AIPanelProps) {
  return (
    <div className="p-4 border-t border-white/5">
      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>
        AI Custom
      </div>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isGenerating && aiPrompt.trim()) {
              onGenerate();
            }
          }}
          placeholder="Type custom modification..."
          className="w-full bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
          disabled={isGenerating}
        />
        {aiPrompt.trim() && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full mt-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-30 font-black uppercase text-[10px] tracking-tight flex items-center justify-center gap-2"
            style={{ fontWeight: 900 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={12} className="animate-spin" strokeWidth={2} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Wand2 size={12} strokeWidth={2} />
                <span>Apply AI</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
