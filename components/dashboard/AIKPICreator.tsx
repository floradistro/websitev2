"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, Save, Eye } from "lucide-react";

interface AIKPICreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kpi: any) => void;
  vendorId: string;
}

export function AIKPICreator({
  isOpen,
  onClose,
  onSave,
  vendorId,
}: AIKPICreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError("");
    setPreview(null);

    try {
      const response = await fetch("/api/ai/generate-kpi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          vendorId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.kpi);
      } else {
        setError(data.error || "Failed to generate KPI");
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error generating KPI:", err);
      }
      setError("Failed to generate KPI. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (preview) {
      onSave({
        ...preview,
        originalPrompt: prompt,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt("");
    setPreview(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2
                className="text-xl font-black text-white"
                style={{ fontWeight: 900 }}
              >
                AI KPI Creator
              </h2>
              <p className="text-sm text-white/40">
                Describe what you want to track
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              What would you like to track?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Show me total revenue from flower products this month compared to last month"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all resize-none"
              rows={4}
              disabled={generating}
            />
          </div>

          {/* Examples */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
              Try these examples:
            </div>
            <div className="space-y-2">
              {[
                "Show me my top 5 selling products by revenue",
                "What's my average order value this week?",
                "Compare my sales this month vs last month",
                "Show me products that need restocking",
                "What's my profit margin on concentrates?",
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="block w-full text-left text-sm text-white/60 hover:text-white hover:bg-white/5 px-3 py-2 rounded-xl transition-colors"
                  disabled={generating}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={16} className="text-white/60" />
                <span className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  Preview
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">
                    {preview.title}
                  </div>
                  <div
                    className="text-5xl font-black text-white mb-2"
                    style={{ fontWeight: 900 }}
                  >
                    {preview.value}
                  </div>
                  {preview.subtitle && (
                    <div className="text-white/40 text-sm">
                      {preview.subtitle}
                    </div>
                  )}
                </div>

                {preview.data && preview.visualization === "list" && (
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    {preview.data.slice(0, 3).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-white/80">{item.label}</span>
                        <span className="text-white font-medium">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-2xl text-sm font-medium text-white/80 hover:bg-white/5 transition-all"
            disabled={generating}
          >
            Cancel
          </button>

          {!preview ? (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="px-6 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate KPI
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              Save to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
