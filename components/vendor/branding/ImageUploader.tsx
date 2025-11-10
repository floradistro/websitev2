"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { ds, cn } from "@/lib/design-system";

interface ImageUploaderProps {
  label: string;
  preview: string;
  onFileChange: (file: File | null) => void;
  onPreviewChange: (preview: string) => void;
  aspectRatio?: "square" | "banner";
  recommendedSize?: string;
  maxSizeMB?: number;
}

/**
 * 🎨 Reusable Image Upload Component
 *
 * Handles drag-drop, file selection, preview, and validation
 */
export function ImageUploader({
  label,
  preview,
  onFileChange,
  onPreviewChange,
  aspectRatio = "square",
  recommendedSize = "300x300px",
  maxSizeMB = 10,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[16/5]",
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return "Please upload a JPG, PNG, WEBP, or GIF image";
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError("");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileChange(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      onPreviewChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onFileChange(null);
    onPreviewChange("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
          )}
        >
          {label}
        </label>
        {recommendedSize && (
          <span
            className={cn(ds.typography.size.micro, ds.colors.text.quaternary)}
          >
            {recommendedSize} recommended
          </span>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative group">
          <div
            className={cn(
              "relative overflow-hidden",
              ds.effects.radius.lg,
              ds.colors.bg.elevated,
              ds.colors.border.default,
              "border",
              aspectClasses[aspectRatio],
            )}
          >
            <img
              src={preview}
              alt="Preview"
              className={cn(
                "w-full h-full",
                aspectRatio === "square"
                  ? "object-contain p-4"
                  : "object-cover",
              )}
            />

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className={cn(
                "absolute top-2 right-2",
                "p-1.5 rounded-full",
                "bg-red-500/90 hover:bg-red-500",
                "text-white",
                ds.effects.transition.fast,
                "opacity-0 group-hover:opacity-100",
              )}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer",
          "border-2 border-dashed",
          ds.effects.radius.lg,
          ds.effects.transition.normal,
          "p-8 text-center",
          isDragging
            ? "border-white/30 bg-white/5"
            : cn(
                ds.colors.border.default,
                "hover:border-white/20",
                ds.colors.bg.elevated,
                "hover:bg-white/[0.06]",
              ),
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          {isDragging ? (
            <ImageIcon size={32} className={ds.colors.text.tertiary} />
          ) : (
            <Upload size={28} className={ds.colors.text.quaternary} />
          )}

          <div>
            <div
              className={cn(
                ds.typography.size.sm,
                ds.colors.text.tertiary,
                ds.typography.weight.medium,
              )}
            >
              {isDragging
                ? "Drop image here"
                : "Click to upload or drag & drop"}
            </div>
            <div
              className={cn(
                ds.typography.size.micro,
                ds.colors.text.quaternary,
                "mt-1",
              )}
            >
              PNG, JPG, WEBP, GIF • Max {maxSizeMB}MB
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className={cn(
            "flex items-center gap-2",
            ds.typography.size.xs,
            ds.colors.status.error,
            "bg-red-500/10",
            ds.colors.border.default,
            "border border-red-500/20",
            ds.effects.radius.md,
            "px-3 py-2",
          )}
        >
          <X size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
