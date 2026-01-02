"use client";

import { ExternalLink } from "lucide-react";
import { ds, cn } from "@/lib/design-system";
import type { BrandingFormState } from "@/types/branding";

interface BrandPreviewProps {
  branding: Partial<BrandingFormState>;
  vendorName: string;
  vendorSlug?: string;
}

/**
 * 🎨 Brand Preview Component
 *
 * Live preview of how branding will appear on storefront
 */
export function BrandPreview({ branding, vendorName, vendorSlug }: BrandPreviewProps) {
  const {
    logoPreview,
    primaryColor = "#000000",
    secondaryColor = "#FFFFFF",
    accentColor = "#666666",
    textColor = "#1A1A1A",
    customFont = "Inter",
    tagline,
    about,
    website,
    instagram,
    facebook,
  } = branding;

  return (
    <div
      className={cn(
        "sticky top-8",
        ds.colors.bg.elevated,
        "border",
        ds.colors.border.default,
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "border-b",
          ds.colors.border.default,
          "px-4 py-3",
          "flex items-center justify-between",
        )}
      >
        <h3
          className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
          )}
        >
          Storefront Preview
        </h3>

        {vendorSlug && (
          <a
            href={`https://${vendorSlug}.floradistro.com`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5",
              ds.typography.size.micro,
              ds.colors.text.quaternary,
              "hover:text-white/60",
              ds.effects.transition.fast,
            )}
          >
            <span>View Live</span>
            <ExternalLink size={10} strokeWidth={2} />
          </a>
        )}
      </div>

      {/* Preview Content */}
      <div className="p-6 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className={cn(
              "w-20 h-20",
              "flex items-center justify-center",
              "border-2 overflow-hidden",
              ds.effects.radius.lg,
            )}
            style={{ borderColor: primaryColor }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary)}>Logo</div>
            )}
          </div>

          {/* Brand Info */}
          <div className="flex-1 min-w-0">
            <h2
              className={cn(ds.typography.size.lg, ds.typography.weight.semibold, "mb-1 truncate")}
              style={{
                color: primaryColor,
                fontFamily: customFont || "inherit",
              }}
            >
              {vendorName}
            </h2>
            <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary, "truncate")}>
              {tagline || "Your tagline here"}
            </p>
          </div>
        </div>

        {/* About Section */}
        {about && (
          <div>
            <h3
              className={cn(
                ds.typography.size.xs,
                ds.typography.weight.medium,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.colors.text.tertiary,
                "mb-2",
              )}
            >
              About
            </h3>
            <p
              className={cn(
                ds.typography.size.sm,
                ds.colors.text.quaternary,
                ds.typography.leading.relaxed,
              )}
            >
              {about}
            </p>
          </div>
        )}

        {/* Social Links */}
        {(website || instagram || facebook) && (
          <div className="flex flex-wrap gap-2">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "px-3 py-1.5",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  "border",
                  ds.effects.radius.md,
                  ds.effects.transition.normal,
                  "hover:bg-white/5",
                )}
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
              >
                Website
              </a>
            )}
            {instagram && (
              <a
                href={`https://instagram.com/${instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "px-3 py-1.5",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  "border",
                  ds.effects.radius.md,
                  ds.effects.transition.normal,
                  "hover:bg-white/5",
                )}
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                }}
              >
                Instagram
              </a>
            )}
            {facebook && (
              <a
                href={`https://facebook.com/${facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "px-3 py-1.5",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  "border",
                  ds.effects.radius.md,
                  ds.effects.transition.normal,
                  "hover:bg-white/5",
                )}
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                }}
              >
                Facebook
              </a>
            )}
          </div>
        )}

        {/* Sample Product Card */}
        <div>
          <div
            className={cn(
              ds.typography.size.micro,
              ds.colors.text.quaternary,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              "mb-3",
            )}
          >
            Sample Product Card
          </div>

          <div
            className={cn(
              "border",
              ds.colors.border.default,
              ds.effects.radius.lg,
              "p-4",
              "space-y-3",
            )}
          >
            {/* Product Image */}
            <div
              className={cn(
                "aspect-square",
                ds.colors.bg.elevated,
                ds.effects.radius.md,
                "flex items-center justify-center",
              )}
            >
              <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary)}>
                Product Image
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h4
                className={cn(
                  ds.typography.size.sm,
                  ds.typography.weight.medium,
                  ds.colors.text.secondary,
                  "mb-1",
                )}
              >
                Sample Product
              </h4>

              <div className="flex items-center justify-between">
                <span className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                  By {vendorName}
                </span>
                <span
                  className={cn(ds.typography.size.sm, ds.typography.weight.semibold)}
                  style={{ color: primaryColor }}
                >
                  $45.00
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className={cn("border-t", ds.colors.border.default, "p-4")}>
        <h4
          className={cn(
            ds.typography.size.micro,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
            "mb-3",
          )}
        >
          Branding Tips
        </h4>
        <ul className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "space-y-1.5")}>
          <li>• Use square logo (300x300px minimum)</li>
          <li>• Transparent PNG works best</li>
          <li>• Choose colors with good contrast</li>
          <li>• Your brand appears on all products</li>
        </ul>
      </div>
    </div>
  );
}
