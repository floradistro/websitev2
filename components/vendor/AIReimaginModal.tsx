"use client";

import { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface AIReimaginModalProps {
  vendorId: string;
  files: Array<{ url: string; name: string }>;
  onClose: () => void;
  onComplete: () => void;
}

export default function AIReimaginModal({ vendorId, files, onClose, onComplete }: AIReimaginModalProps) {
  const [instructions, setInstructions] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1024x1792' | '1792x1024'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, processing]);

  const handleReimagine = async () => {
    try {
      setProcessing(true);
      setError(null);
      setResults([]);
      setProgress(`Re-imagining ${files.length} image(s)...`);

      // Dispatch AI start event for monitor
      window.dispatchEvent(new CustomEvent('ai-autofill-start'));
      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `# RE-IMAGINE\n\nProcessing ${files.length} file(s)...\n${instructions ? `\nInstructions: ${instructions}` : ''}` }
      }));

      const response = await fetch('/api/vendor/media/reimagine', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId,
        },
        body: JSON.stringify({
          files,
          instructions: instructions.trim() || undefined,
          size,
          quality,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reimagine images');
      }

      setResults(data.results || []);
      setProgress(`✅ Complete: ${data.processed} processed, ${data.failed} failed`);

      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: {
          message: `\n## ✅ Complete\n\n- Processed: ${data.processed || 0}\n- Failed: ${data.failed || 0}`
        }
      }));

      // Close modal and reload after 2 seconds
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
        onComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Re-imagine error:', err);
      setError(err.message);
      window.dispatchEvent(new CustomEvent('ai-autofill-progress', {
        detail: { message: `\n## ❌ Error\n\n${err.message}` }
      }));
      window.dispatchEvent(new CustomEvent('ai-autofill-complete'));
    } finally {
      setProcessing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !processing) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex items-center justify-center p-4"
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tight text-lg" style={{ fontWeight: 900 }}>
                Re-imagine with AI
              </h2>
              <p className="text-white/40 text-xs">
                {files.length} image{files.length !== 1 ? 's' : ''} • GPT-4 Vision + DALL-E 3
              </p>
            </div>
          </div>
          {!processing && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selected Images Preview */}
          <div>
            <label className="text-white/60 text-xs uppercase tracking-[0.15em] font-bold mb-3 block">
              Selected Images
            </label>
            <div className="grid grid-cols-4 gap-3">
              {files.slice(0, 8).map((file, idx) => (
                <div key={idx} className="relative aspect-square bg-black border border-white/10 rounded-xl overflow-hidden">
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
              {files.length > 8 && (
                <div className="aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                  <span className="text-white/60 text-xs font-bold">+{files.length - 8} more</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.15em] font-bold">
                  {results.length} image{results.length !== 1 ? 's' : ''} reimagined
                </span>
              </div>
            </div>
          )}

          {/* Instructions Input */}
          <div>
            <label className="text-white/60 text-xs uppercase tracking-[0.15em] font-bold mb-3 block">
              What do you want to change? (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Examples:
• Make it more vibrant and colorful
• Add a sunset background
• Turn it into a professional product photo
• Make it look like luxury packaging
• Add dramatic lighting

Leave blank to recreate as-is with DALL-E style..."
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 placeholder-white/30 hover:bg-white/10 transition-all resize-none h-40"
              disabled={processing}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider mb-2 block">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                disabled={processing}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="1024x1024" className="bg-black">Square</option>
                <option value="1024x1792" className="bg-black">Portrait</option>
                <option value="1792x1024" className="bg-black">Landscape</option>
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider mb-2 block">
                Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                disabled={processing}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="standard" className="bg-black">Standard</option>
                <option value="hd" className="bg-black">HD</option>
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider mb-2 block">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                disabled={processing}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="vivid" className="bg-black">Vivid</option>
                <option value="natural" className="bg-black">Natural</option>
              </select>
            </div>
          </div>

          {/* Progress */}
          {processing && progress && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">{progress}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40">
          <button
            onClick={handleReimagine}
            disabled={processing}
            className="w-full bg-white text-black border-2 border-white rounded-2xl px-6 py-4 text-sm uppercase tracking-[0.15em] hover:bg-white/90 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontWeight: 900 }}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Re-imagining...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Re-imagine {files.length} Image{files.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
