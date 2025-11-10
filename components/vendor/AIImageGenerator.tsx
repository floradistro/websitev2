"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Search,
  Wand2,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

interface AIImageGeneratorProps {
  vendorId: string;
  onClose: () => void;
  onImageGenerated: () => void;
}

interface InspirationResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export default function AIImageGenerator({
  vendorId,
  onClose,
  onImageGenerated,
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1024x1792" | "1792x1024">(
    "1024x1024",
  );
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [generating, setGenerating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inspiration, setInspiration] = useState<InspirationResult[]>([]);
  const [showInspiration, setShowInspiration] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !generating) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, generating]);

  const handleSearchInspiration = async () => {
    if (!prompt.trim()) return;

    try {
      setSearching(true);
      setError(null);

      const response = await fetch("/api/vendor/media/search-inspiration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          query: prompt,
          numResults: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search");
      }

      setInspiration(data.results || []);
      setShowInspiration(true);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Search error:", err);
      }
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setGeneratedImage(null);

      const response = await fetch("/api/vendor/media/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          prompt,
          size,
          quality,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.file.url);
      setRevisedPrompt(data.file.revised_prompt);

      // DON'T auto-close - let user review and close manually
      // onImageGenerated(); is now called when user clicks "Done" button
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Generation error:", err);
      }
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDone = () => {
    // Refresh media library and close modal
    onImageGenerated();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !generating) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex items-center justify-center p-4"
    >
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-white font-black uppercase tracking-tight text-lg"
                style={{ fontWeight: 900 }}
              >
                Generate with AI
              </h2>
              <p className="text-white/40 text-xs">
                DALL-E 3 • Powered by OpenAI
              </p>
            </div>
          </div>
          {!generating && (
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
          {/* Generated Image Result */}
          {generatedImage && (
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden">
              <div className="relative w-full aspect-square">
                <Image
                  src={generatedImage}
                  alt="Generated image"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="p-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-[0.15em] font-bold">
                    Saved to Media Library
                  </span>
                </div>
                {revisedPrompt && (
                  <p className="text-white/40 text-xs">
                    <span className="text-white/60 font-medium">
                      AI Enhanced:{" "}
                    </span>
                    {revisedPrompt}
                  </p>
                )}
                <button
                  onClick={handleDone}
                  className="w-full bg-white text-black border-2 border-white rounded-2xl px-6 py-3 text-xs uppercase tracking-[0.15em] hover:bg-white/90 font-black transition-all flex items-center justify-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <label className="text-white/60 text-xs uppercase tracking-[0.15em] font-bold mb-3 block">
              Describe Your Image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A product photo of premium cannabis flower in elegant packaging on a white background..."
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 placeholder-white/30 hover:bg-white/10 transition-all resize-none h-32"
              disabled={generating}
            />
          </div>

          {/* Inspiration Search */}
          <button
            onClick={handleSearchInspiration}
            disabled={generating || searching || !prompt.trim()}
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-xs uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Inspiration
              </>
            )}
          </button>

          {/* Inspiration Results */}
          {showInspiration && inspiration.length > 0 && (
            <div className="bg-black border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-xs uppercase tracking-[0.15em] font-bold">
                  Inspiration Found
                </h3>
                <button
                  onClick={() => setShowInspiration(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-2">
                {inspiration.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-all"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-xs font-medium hover:text-white/80 block mb-1"
                    >
                      {item.title}
                    </a>
                    <p className="text-white/40 text-xs line-clamp-2">
                      {item.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                disabled={generating}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="1024x1024" className="bg-black">
                  Square
                </option>
                <option value="1024x1792" className="bg-black">
                  Portrait
                </option>
                <option value="1792x1024" className="bg-black">
                  Landscape
                </option>
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
                disabled={generating}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="standard" className="bg-black">
                  Standard
                </option>
                <option value="hd" className="bg-black">
                  HD
                </option>
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
                disabled={generating}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <option value="vivid" className="bg-black">
                  Vivid
                </option>
                <option value="natural" className="bg-black">
                  Natural
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40">
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-white text-black border-2 border-white rounded-2xl px-6 py-4 text-sm uppercase tracking-[0.15em] hover:bg-white/90 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontWeight: 900 }}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
