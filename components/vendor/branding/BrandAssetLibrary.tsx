"use client";

import { useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { ds, cn } from "@/lib/design-system";
import type { AssetVariant } from "@/types/branding";

interface BrandAssetLibraryProps {
  vendorId: string;
  onAssetSelect?: (asset: AssetVariant) => void;
}

/**
 * 📚 Brand Asset Library Component
 *
 * Manage multiple brand assets (logos, banners, icons)
 */
export function BrandAssetLibrary({
  vendorId,
  onAssetSelect,
}: BrandAssetLibraryProps) {
  const [assets, setAssets] = useState<AssetVariant[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetVariant | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleUpload = async (file: File, type: AssetVariant["type"]) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/supabase/vendor/upload", {
        method: "POST",
        headers: { "x-vendor-id": vendorId },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      const newAsset: AssetVariant = {
        id: Date.now().toString(),
        name: data.file.name,
        url: data.file.url,
        type,
        width: undefined,
        height: undefined,
        fileSize: data.file.size,
        uploadedAt: new Date().toISOString(),
      };

      setAssets((prev) => [...prev, newAsset]);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Upload failed:", err);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(null);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleDownload = (asset: AssetVariant) => {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.name;
    link.click();
  };

  const formatFileSize = (bytes: number = 0): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const groupedAssets = {
    logos: assets.filter((a) => a.type === "logo"),
    banners: assets.filter((a) => a.type === "banner"),
    icons: assets.filter((a) => a.type === "icon"),
    patterns: assets.filter((a) => a.type === "pattern"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3
          className={cn(
            ds.typography.size.sm,
            ds.typography.weight.medium,
            ds.colors.text.secondary,
            "mb-2",
          )}
        >
          Brand Asset Library
        </h3>
        <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
          Upload and manage all your brand assets in one place
        </p>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-2 gap-4">
        {(["logo", "banner", "icon", "pattern"] as const).map((type) => (
          <label
            key={type}
            className={cn(
              "relative",
              "border-2 border-dashed",
              ds.colors.border.default,
              "hover:border-white/20",
              ds.effects.radius.lg,
              "p-4",
              "text-center",
              "cursor-pointer",
              ds.effects.transition.normal,
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, type);
              }}
              disabled={uploading}
            />

            <Upload
              size={24}
              className={cn(ds.colors.text.quaternary, "mx-auto mb-2")}
            />
            <div
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.tertiary,
                "capitalize",
                "mb-1",
              )}
            >
              {type}
            </div>
            <div
              className={cn(
                ds.typography.size.micro,
                ds.colors.text.quaternary,
              )}
            >
              Click to upload
            </div>
          </label>
        ))}
      </div>

      {/* Asset groups */}
      {Object.entries(groupedAssets).map(([group, groupAssets]) => {
        if (groupAssets.length === 0) return null;

        return (
          <div key={group}>
            <h4
              className={cn(
                ds.typography.size.xs,
                ds.typography.weight.medium,
                "capitalize",
                ds.colors.text.tertiary,
                "mb-3",
              )}
            >
              {group} ({groupAssets.length})
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {groupAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    "relative group",
                    "border",
                    selectedAsset?.id === asset.id
                      ? "border-white/30"
                      : ds.colors.border.default,
                    ds.effects.radius.lg,
                    "overflow-hidden",
                    "cursor-pointer",
                    ds.effects.transition.normal,
                    "hover:border-white/20",
                  )}
                  onClick={() => {
                    setSelectedAsset(asset);
                    onAssetSelect?.(asset);
                  }}
                >
                  {/* Image */}
                  <div
                    className={cn(
                      "aspect-square",
                      "bg-white/5",
                      "flex items-center justify-center",
                      "overflow-hidden",
                    )}
                  >
                    {asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon
                        size={32}
                        className={ds.colors.text.quaternary}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div
                    className={cn(
                      "p-2",
                      ds.colors.bg.elevated,
                      "border-t",
                      ds.colors.border.default,
                    )}
                  >
                    <div
                      className={cn(
                        ds.typography.size.micro,
                        ds.colors.text.tertiary,
                        "truncate mb-1",
                      )}
                    >
                      {asset.name}
                    </div>
                    <div
                      className={cn(
                        ds.typography.size.micro,
                        ds.colors.text.quaternary,
                      )}
                    >
                      {formatFileSize(asset.fileSize)}
                    </div>
                  </div>

                  {/* Actions overlay */}
                  <div
                    className={cn(
                      "absolute inset-0",
                      "bg-black/80",
                      "flex items-center justify-center gap-2",
                      "opacity-0 group-hover:opacity-100",
                      ds.effects.transition.fast,
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(asset.url);
                      }}
                      className={cn(
                        "p-2",
                        ds.effects.radius.md,
                        ds.colors.bg.elevated,
                        "hover:bg-white/[0.08]",
                        ds.colors.text.tertiary,
                        "hover:text-white/90",
                        ds.effects.transition.fast,
                      )}
                      title="Copy URL"
                    >
                      {copiedUrl === asset.url ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(asset);
                      }}
                      className={cn(
                        "p-2",
                        ds.effects.radius.md,
                        ds.colors.bg.elevated,
                        "hover:bg-white/[0.08]",
                        ds.colors.text.tertiary,
                        "hover:text-white/90",
                        ds.effects.transition.fast,
                      )}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className={cn(
                        "p-2",
                        ds.effects.radius.md,
                        ds.colors.bg.elevated,
                        "hover:bg-red-500/20",
                        ds.colors.text.tertiary,
                        "hover:text-red-400",
                        ds.effects.transition.fast,
                      )}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {assets.length === 0 && (
        <div
          className={cn(
            "text-center py-12",
            ds.colors.bg.elevated,
            "border",
            ds.colors.border.default,
            ds.effects.radius.lg,
          )}
        >
          <ImageIcon
            size={48}
            className={cn(ds.colors.text.quaternary, "mx-auto mb-4")}
          />
          <p
            className={cn(
              ds.typography.size.sm,
              ds.colors.text.tertiary,
              "mb-2",
            )}
          >
            No assets uploaded yet
          </p>
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
            Upload logos, banners, icons, and patterns to build your brand
            library
          </p>
        </div>
      )}

      {/* Tips */}
      <div
        className={cn(
          "p-3",
          ds.colors.bg.elevated,
          "border",
          ds.colors.border.default,
          ds.effects.radius.lg,
        )}
      >
        <div
          className={cn(
            ds.typography.size.micro,
            ds.colors.text.quaternary,
            "space-y-1",
          )}
        >
          <div>
            💡 <strong>Asset Tips:</strong>
          </div>
          <div>• Upload multiple versions (light/dark, color/mono)</div>
          <div>• Logos: 300x300px minimum, transparent PNG recommended</div>
          <div>• Banners: 1920x600px for best quality</div>
          <div>• Icons: 64x64px or 128x128px</div>
        </div>
      </div>
    </div>
  );
}
