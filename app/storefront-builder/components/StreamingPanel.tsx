/**
 * Streaming Panel Component
 * Real-time AI generation progress with tools, thinking, and code
 * Aligned with Cursor AI best practices
 */

import { ToolExecuted, ScreenshotPreview } from '@/lib/storefront-builder/types';

interface StreamingPanelProps {
  isVisible: boolean;
  status: string;
  thinking: string;
  displayedCode: string;
  toolsExecuted: ToolExecuted[];
  screenshotPreview: ScreenshotPreview | null;
}

export function StreamingPanel({
  isVisible,
  status,
  thinking,
  displayedCode,
  toolsExecuted,
  screenshotPreview,
}: StreamingPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="text-white font-black uppercase text-sm tracking-tight" style={{ fontWeight: 900 }}>
              AI GENERATING
            </div>
          </div>
          <div className="text-white/40 text-xs font-mono">{status}</div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Tools */}
          {toolsExecuted.map((item, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="text-white/40 text-xs font-mono mt-1">{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="text-white/60 text-xs uppercase tracking-wider mb-1.5">Tool</div>
                  <div className="text-white text-sm font-black uppercase mb-2" style={{ fontWeight: 900 }}>
                    {item.tool}
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
                    <div className="text-white/80 text-xs mb-1">{item.result}</div>
                    {item.details && (
                      <div className="text-white/40 text-[10px] mt-1">{item.details}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Screenshot Preview */}
          {screenshotPreview && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Screenshot</div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                      <div className="text-white/80 text-xs font-mono">{screenshotPreview.title}</div>
                    </div>
                    <img
                      src={screenshotPreview.data}
                      alt="Website screenshot"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thinking */}
          {thinking && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Extended Thinking</div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                    <pre className="text-white/60 text-xs font-mono leading-relaxed whitespace-pre-wrap">
{thinking}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Generation */}
          {displayedCode && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + (screenshotPreview ? 2 : 1) + (thinking ? 1 : 0)).padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>Code Generation</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                      <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                    <pre className="text-cyan-400/80 text-xs font-mono leading-relaxed whitespace-pre-wrap">
{displayedCode}
                    </pre>
                    {displayedCode.split('\n').length > 20 && (
                      <div className="text-white/40 text-xs mt-2">
                        {displayedCode.split('\n').length} lines
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
