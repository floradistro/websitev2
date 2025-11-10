"use client";

import { useState } from "react";
import { Sparkles, X, CheckCircle, Loader } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { DynamicField, EnrichedProductData } from "@/lib/types/product";
import { ds, cn } from "@/components/ds";

interface AIAutofillPanelProps {
  productName: string;
  category: string;
  dynamicFields: DynamicField[];
  onAutofill: (selectedFields: string[], customPrompt: string) => Promise<void>;
  loading: boolean;
  aiSuggestions: EnrichedProductData | null;
  showSuggestions: boolean;
  onClose: () => void;
  onApply: (selectedFields: string[]) => void;
}

/**
 * Enhanced AI Autofill Panel
 *
 * Allows users to:
 * - Enter custom prompts for better results
 * - Select specific fields to autofill
 * - Preview AI suggestions before applying
 */
export default function AIAutofillPanel({
  productName,
  category,
  dynamicFields,
  onAutofill,
  loading,
  aiSuggestions,
  showSuggestions,
  onClose,
  onApply,
}: AIAutofillPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set([
      "description",
      "strain_type",
      "lineage",
      "nose",
      "effects",
      "terpene_profile",
    ]),
  );

  // Available fields for autofill
  const availableFields = [
    { id: "description", label: "Description", icon: "📝" },
    { id: "strain_type", label: "Strain Type", icon: "🌿" },
    { id: "lineage", label: "Lineage", icon: "🧬" },
    { id: "nose", label: "Nose/Aroma", icon: "👃" },
    { id: "effects", label: "Effects", icon: "✨" },
    { id: "terpene_profile", label: "Terpenes", icon: "🧪" },
  ];

  const toggleField = (fieldId: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId);
    } else {
      newSelected.add(fieldId);
    }
    setSelectedFields(newSelected);
  };

  const handleAutofill = () => {
    onAutofill(Array.from(selectedFields), customPrompt);
  };

  const handleApply = () => {
    onApply(Array.from(selectedFields));
  };

  return (
    <div className={cn(ds.components.card, "rounded-2xl p-4 mt-4")}>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader withMargin={false}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} strokeWidth={1.5} className="text-white/60" />
            AI Autofill
          </div>
        </SectionHeader>
        {showSuggestions && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {!showSuggestions ? (
        <>
          {/* Custom Prompt */}
          <div className="mb-4">
            <label
              className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2 font-black"
              style={{ fontWeight: 900 }}
            >
              Custom Prompt (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Focus on the sweet candy-like flavors' or 'Emphasize relaxing effects'"
              rows={2}
              className={cn(
                ds.colors.bg.primary,
                "w-full border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-[10px]",
              )}
            />
            <p className="text-white/30 text-[8px] mt-1.5">
              Add context or specific details you want AI to include
            </p>
          </div>

          {/* Field Selection */}
          <div className="mb-4">
            <label
              className="block text-white/40 text-[9px] uppercase tracking-[0.15em] mb-3 font-black"
              style={{ fontWeight: 900 }}
            >
              Fields to Autofill
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableFields.map((field) => {
                const isSelected = selectedFields.has(field.id);
                const isAvailable =
                  field.id === "description" ||
                  dynamicFields.some(
                    (f) =>
                      f.label === field.id ||
                      f.fieldId === field.id ||
                      (f.label || "").toLowerCase() === field.id.toLowerCase(),
                  );

                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => isAvailable && toggleField(field.id)}
                    disabled={!isAvailable}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border transition-all text-[9px] uppercase tracking-[0.15em] font-black text-left flex items-center gap-2",
                      isSelected
                        ? "bg-white/10 border-white/20 text-white"
                        : cn(
                            ds.colors.bg.primary,
                            "border-white/10 text-white/40 hover:border-white/20",
                          ),
                      !isAvailable
                        ? "opacity-30 cursor-not-allowed"
                        : "cursor-pointer",
                    )}
                    style={{ fontWeight: 900 }}
                  >
                    <span className="text-[14px]">{field.icon}</span>
                    <span className="flex-1">{field.label}</span>
                    {isSelected && <CheckCircle size={10} strokeWidth={1.5} />}
                  </button>
                );
              })}
            </div>
            <p className="text-white/30 text-[8px] mt-2">
              {selectedFields.size === 0
                ? "Select at least one field"
                : `${selectedFields.size} fields selected`}
            </p>
          </div>

          {/* Autofill Button */}
          <button
            type="button"
            onClick={handleAutofill}
            disabled={
              loading || selectedFields.size === 0 || !productName.trim()
            }
            className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] font-black disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontWeight: 900 }}
          >
            {loading ? (
              <>
                <Loader size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={12} strokeWidth={1.5} />
                Generate AI Suggestions
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {/* AI Suggestions Preview */}
          <div
            className={cn(
              ds.colors.bg.primary,
              "border border-white/10 rounded-xl p-3 mb-3 space-y-3 max-h-64 overflow-y-auto",
            )}
          >
            {selectedFields.has("description") &&
              aiSuggestions?.description && (
                <div>
                  <div
                    className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                    style={{ fontWeight: 900 }}
                  >
                    📝 Description
                  </div>
                  <p className="text-white/70 text-[10px] leading-relaxed">
                    {aiSuggestions.description}
                  </p>
                </div>
              )}

            {selectedFields.has("strain_type") &&
              aiSuggestions?.strain_type && (
                <div>
                  <div
                    className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                    style={{ fontWeight: 900 }}
                  >
                    🌿 Strain Type
                  </div>
                  <span
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[9px] text-white font-black uppercase tracking-wider"
                    style={{ fontWeight: 900 }}
                  >
                    {aiSuggestions.strain_type}
                  </span>
                </div>
              )}

            {selectedFields.has("lineage") && aiSuggestions?.lineage && (
              <div>
                <div
                  className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                  style={{ fontWeight: 900 }}
                >
                  🧬 Lineage
                </div>
                <span
                  className="text-white text-[10px] font-black uppercase tracking-tight"
                  style={{ fontWeight: 900 }}
                >
                  {aiSuggestions.lineage}
                </span>
              </div>
            )}

            {selectedFields.has("nose") &&
              aiSuggestions?.nose &&
              aiSuggestions.nose.length > 0 && (
                <div>
                  <div
                    className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                    style={{ fontWeight: 900 }}
                  >
                    👃 Nose/Aroma
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestions.nose.map((aroma: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider"
                      >
                        {aroma}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {selectedFields.has("effects") &&
              aiSuggestions?.effects &&
              aiSuggestions.effects.length > 0 && (
                <div>
                  <div
                    className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                    style={{ fontWeight: 900 }}
                  >
                    ✨ Effects
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestions.effects.map(
                      (effect: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider"
                        >
                          {effect}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {selectedFields.has("terpene_profile") &&
              aiSuggestions?.terpene_profile &&
              aiSuggestions.terpene_profile.length > 0 && (
                <div>
                  <div
                    className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1.5 font-black"
                    style={{ fontWeight: 900 }}
                  >
                    🧪 Terpenes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestions.terpene_profile.map(
                      (terpene: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white/70 uppercase tracking-wider"
                        >
                          {terpene}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Apply Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                ds.colors.bg.primary,
                "flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:border-white/20 transition-all text-[9px] uppercase tracking-[0.15em] font-black",
              )}
              style={{ fontWeight: 900 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 bg-white/10 border-2 border-white/20 text-white rounded-xl hover:bg-white/20 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.15em] font-black"
              style={{ fontWeight: 900 }}
            >
              <CheckCircle size={11} strokeWidth={1.5} />
              Apply Selected
            </button>
          </div>
        </>
      )}
    </div>
  );
}
