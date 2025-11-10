"use client";

import { useState } from "react";
import {
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { ds, cn } from "@/lib/design-system";

interface StorefrontPreviewProps {
  vendorSlug?: string;
}

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
};

export function StorefrontPreview({ vendorSlug }: StorefrontPreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [key, setKey] = useState(0);

  if (!vendorSlug) {
    return (
      <div
        className={cn(
          "sticky top-8",
          ds.colors.bg.elevated,
          "border",
          ds.colors.border.default,
          ds.effects.radius.lg,
          "p-8 text-center",
        )}
      >
        <Monitor
          size={48}
          className={cn(ds.colors.text.quaternary, "mx-auto mb-4")}
        />
        <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
          Preview unavailable
        </p>
        <p
          className={cn(
            ds.typography.size.xs,
            ds.colors.text.quaternary,
            "mt-2",
          )}
        >
          Save to see live preview
        </p>
      </div>
    );
  }

  // Use subdomain format or preview URL
  const previewUrl = `${window.location.origin}/storefront-preview/${vendorSlug}`;

  return (
    <div
      className={cn(
        "sticky top-8",
        ds.colors.bg.elevated,
        "border",
        ds.colors.border.default,
        ds.effects.radius.lg,
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b",
          ds.colors.border.default,
          "px-4 py-3 flex items-center justify-between",
        )}
      >
        <span
          className={cn(
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.colors.text.tertiary,
          )}
        >
          Preview
        </span>

        <div className="flex items-center gap-2">
          {/* Viewport toggle */}
          {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => {
            const { icon: Icon } = VIEWPORTS[v];
            return (
              <button
                key={v}
                type="button"
                onClick={() => setViewport(v)}
                className={cn(
                  "p-1.5 rounded",
                  viewport === v ? ds.colors.bg.active : "hover:bg-white/5",
                  ds.colors.text.quaternary,
                )}
              >
                <Icon size={14} />
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className={cn(
              "p-1.5 rounded hover:bg-white/5",
              ds.colors.text.quaternary,
            )}
          >
            <RefreshCw size={14} />
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 px-2 py-1 border rounded",
              ds.colors.border.default,
              ds.colors.text.quaternary,
              "hover:text-white/60",
              ds.typography.size.micro,
            )}
          >
            Open <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gradient-to-br from-black/20 to-white/5 flex justify-center">
        <div style={{ width: VIEWPORTS[viewport].width, maxWidth: "100%" }}>
          <iframe
            key={key}
            src={previewUrl}
            className="w-full border border-white/10 rounded-lg bg-white"
            style={{ height: "600px" }}
            title="Preview"
          />
        </div>
      </div>

      {/* Tips */}
      <div
        className={cn(
          "border-t",
          ds.colors.border.default,
          "px-4 py-2",
          ds.typography.size.micro,
          ds.colors.text.quaternary,
        )}
      >
        💡 Changes appear after saving • Click refresh to update
      </div>
    </div>
  );
}
