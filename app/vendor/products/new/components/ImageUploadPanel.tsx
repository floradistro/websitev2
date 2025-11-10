"use client";

import { Upload, X, CheckCircle, Loader } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { ds, cn } from "@/components/ds";

interface ImageUploadPanelProps {
  imagePreviews: string[];
  uploadedImageUrls: string[];
  uploadingImages: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export default function ImageUploadPanel({
  imagePreviews,
  uploadedImageUrls,
  uploadingImages,
  onImageUpload,
  onRemoveImage,
}: ImageUploadPanelProps) {
  return (
    <div className={cn(ds.components.card, "rounded-2xl")}>
      <SectionHeader>Product Images</SectionHeader>

      <div className="space-y-4">
        {/* Image Grid */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className={cn(
                  ds.colors.bg.primary,
                  "relative aspect-square border border-white/10 rounded-2xl overflow-hidden group",
                )}
              >
                <img
                  src={preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {uploadedImageUrls[index] ? (
                  <div
                    className="absolute top-2 left-2 bg-green-500/20 border border-green-500/40 text-green-400 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <CheckCircle size={10} strokeWidth={1.5} />
                    Uploaded
                  </div>
                ) : uploadingImages ? (
                  <div
                    className="absolute top-2 left-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <Loader
                      size={10}
                      strokeWidth={1.5}
                      className="animate-spin"
                    />
                    Uploading
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <label className="block cursor-pointer">
          <div
            className={cn(
              ds.colors.bg.primary,
              "border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl p-8 text-center transition-all group",
            )}
          >
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-all">
              <Upload
                size={20}
                strokeWidth={1.5}
                className="text-white/60 group-hover:text-white transition-colors"
              />
            </div>
            <div
              className="text-white text-[10px] uppercase tracking-[0.15em] font-black mb-1"
              style={{ fontWeight: 900 }}
            >
              Click to upload images
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">
              PNG, JPG up to 10MB
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
