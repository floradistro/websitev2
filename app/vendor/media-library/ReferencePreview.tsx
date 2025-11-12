"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  updated_at?: string;
}

interface ReferenceWeight {
  fileId: string;
  weight: number;
}

interface ReferencePreviewProps {
  vendorId: string;
  references: MediaFile[];
  weights: ReferenceWeight[];
  onWeightChange: (fileId: string, weight: number) => void;
  onRemove: (fileId: string) => void;
  styleDescription: string;
  analyzing: boolean;
}

export default function ReferencePreview({
  vendorId,
  references,
  weights,
  onWeightChange,
  onRemove,
  styleDescription,
  analyzing,
}: ReferencePreviewProps) {
  const getWeight = (fileId: string) => {
    return weights.find((w) => w.fileId === fileId)?.weight || 0;
  };

  const getThumbnail = (file: MediaFile) => {
    return file.file_url.includes("supabase.co")
      ? file.file_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
          `?width=200&height=200&quality=75&t=${file.updated_at || file.created_at}`
      : file.file_url;
  };

  if (references.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Reference images grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {references.map((ref) => {
          const weight = getWeight(ref.id);
          return (
            <div
              key={ref.id}
              className="relative group rounded-lg overflow-hidden bg-white/5 border border-white/10"
            >
              {/* Image */}
              <div className="aspect-square">
                <img
                  src={getThumbnail(ref)}
                  alt={ref.file_name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => onRemove(ref.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4 text-white" strokeWidth={2} />
              </button>

              {/* Weight slider */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 font-light">Influence</span>
                  <span className="text-xs text-white font-medium">{weight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weight}
                  onChange={(e) => onWeightChange(ref.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Style description */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles
              className={`w-5 h-5 ${analyzing ? "text-white/40" : "text-white/60"}`}
              strokeWidth={1.5}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm text-white/70 font-light mb-1">Style Analysis</h4>
            {analyzing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                <p className="text-sm text-white/40 font-light">Analyzing references...</p>
              </div>
            ) : styleDescription ? (
              <p className="text-sm text-white/90 font-light leading-relaxed">{styleDescription}</p>
            ) : (
              <p className="text-sm text-white/40 font-light italic">
                Adjust weights to analyze style
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
