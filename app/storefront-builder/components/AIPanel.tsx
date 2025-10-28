/**
 * AI Panel Component
 * AI custom prompt and generation controls with inline streaming
 */

import { Wand2, RefreshCw, Sparkles } from 'lucide-react';

interface AIPanelProps {
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  // Streaming display (inline, non-intrusive)
  streamingStatus?: string;
  displayedCode?: string;
}

export function AIPanel({
  aiPrompt,
  setAiPrompt,
  isGenerating,
  onGenerate,
  streamingStatus = '',
  displayedCode = '',
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

      {/* Inline Streaming Response */}
      {isGenerating && (
        <div className="mt-3 bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
          {/* Status Bar */}
          <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
            <Sparkles size={12} className="text-cyan-400 animate-pulse" strokeWidth={2} />
            <div className="text-white/60 text-[10px] font-mono flex-1">
              {streamingStatus || 'Generating...'}
            </div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            </div>
          </div>

          {/* Code Preview */}
          {displayedCode && (
            <div className="p-3 max-h-[300px] overflow-y-auto">
              <pre className="text-cyan-400/80 text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
{displayedCode}
              </pre>
              {displayedCode.split('\n').length > 10 && (
                <div className="text-white/30 text-[9px] mt-2">
                  {displayedCode.split('\n').length} lines
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
