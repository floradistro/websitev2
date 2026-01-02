"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, Check } from "lucide-react";
import { logger } from "@/lib/logger";

interface SaveConfigModalProps {
  vendorId: string;
  config: {
    templateId?: string;
    basePrompt: string;
    artStyle: string;
    format: string;
    includeText: string;
    referenceImages: Array<{
      mediaFileId: string;
      fileUrl: string;
      weight: number;
      thumbnailUrl: string;
    }>;
    approvedStyleDescription: string;
    rejectedStyleDescription: string;
    iterationsCount: number;
    successRate: number;
    totalGenerated: number;
  };
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaveConfigModal({
  vendorId,
  config,
  onClose,
  onSaved,
}: SaveConfigModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a name for this configuration");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/vendor/media/generation-configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          categories,
          ...config,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        onSaved?.();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || "Failed to save configuration");
      }
    } catch (error) {
      logger.error("Error saving config:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim().toLowerCase())) {
      setCategories([...categories, newCategory.trim().toLowerCase()]);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" strokeWidth={2} />
          </div>
          <h2 className="text-xl text-white font-light mb-2">Configuration Saved!</h2>
          <p className="text-sm text-white/50 font-light">
            You can now reuse this style for future generations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white/60" strokeWidth={1.5} />
            <h2 className="text-lg text-white font-light">Save Generation Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-white/70 mb-2 font-light">
              Configuration Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Flower Icons"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/70 mb-2 font-light">
              Description <span className="text-white/40">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Vibrant botanical style with soft gradients and warm tones"
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm text-white/70 mb-2 font-light">
              Categories <span className="text-white/40">(optional)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="e.g. flower, edibles"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
              >
                Add
              </button>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center gap-1 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white"
                  >
                    <span>{category}</span>
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm text-white/70 font-light mb-3">Configuration Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/50">Reference Images:</span>
                <span className="text-white ml-2">{config.referenceImages.length}</span>
              </div>
              <div>
                <span className="text-white/50">Iterations:</span>
                <span className="text-white ml-2">{config.iterationsCount}</span>
              </div>
              <div>
                <span className="text-white/50">Success Rate:</span>
                <span className="text-white ml-2">{config.successRate}%</span>
              </div>
              <div>
                <span className="text-white/50">Total Generated:</span>
                <span className="text-white ml-2">{config.totalGenerated}</span>
              </div>
            </div>
            {config.approvedStyleDescription && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-green-500 mb-1">✓ Learned Style:</p>
                <p className="text-xs text-white/60 font-light leading-relaxed line-clamp-2">
                  {config.approvedStyleDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-sm text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
