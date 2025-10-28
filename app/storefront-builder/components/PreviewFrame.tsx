/**
 * Preview Frame Component
 * Handles the iframe preview with device modes and quantum states
 */

import { Eye } from 'lucide-react';
import { RefObject } from 'react';

interface PreviewFrameProps {
  previewHTML: string;
  previewKey: number;
  previewRef: RefObject<HTMLIFrameElement | null>;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  quantumState: 'auto' | 'first-visit' | 'returning';
  setQuantumState: (state: 'auto' | 'first-visit' | 'returning') => void;
  compileError: string | null;
  compiledCode: string;
  code: string;
}

export function PreviewFrame({
  previewHTML,
  previewKey,
  previewRef,
  previewMode,
  quantumState,
  setQuantumState,
  compileError,
  compiledCode,
  code,
}: PreviewFrameProps) {
  const hasQuantum = code.includes('quantum');

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Preview Header */}
      <div className="bg-black border-b border-white/5 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye size={11} className="text-white/30" strokeWidth={1.5} />
          <span className="text-white/40 text-[10px] font-light tracking-[0.15em] uppercase">Preview</span>

          {/* Quantum State Pills (only if component uses quantum) */}
          {hasQuantum && (
            <>
              <div className="w-px h-3 bg-white/5" />
              <div className="flex items-center gap-0.5 bg-black border border-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => setQuantumState('first-visit')}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                    quantumState === 'first-visit'
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  First Visit
                </button>
                <button
                  onClick={() => setQuantumState('returning')}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                    quantumState === 'returning'
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  Returning
                </button>
                <button
                  onClick={() => setQuantumState('auto')}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                    quantumState === 'auto'
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  Auto
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto relative">
        <div className={`mx-auto h-full ${previewMode === 'mobile' ? 'max-w-[375px]' : previewMode === 'tablet' ? 'max-w-[768px]' : ''}`}>
          {!compileError && compiledCode && previewHTML ? (
            <iframe
              key={previewKey}
              ref={previewRef}
              srcDoc={previewHTML}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/20 text-xs font-light tracking-wide">
                {compileError ? 'FIX ERRORS' : 'PREVIEW LOADING...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
