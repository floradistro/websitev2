"use client";

import { useState } from "react";
import { FileText, Copy, Check, AlertCircle } from "lucide-react";
import { ds, cn } from "@/lib/design-system";

import { logger } from "@/lib/logger";
interface PolicyEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  template?: string;
}

const POLICY_TEMPLATES = {
  return: `# Return Policy

## Returns & Exchanges

We want you to be completely satisfied with your purchase. If you're not happy with your order, we accept returns within 30 days of delivery.

### Eligibility
- Items must be unused and in original packaging
- All sales of cannabis products are final (state law)
- Accessories and merchandise can be returned within 30 days

### How to Return
1. Contact us at returns@yourdispensary.com
2. Include your order number and reason for return
3. We'll provide a return shipping label
4. Refunds processed within 5-7 business days

### Non-Returnable Items
- Opened or used cannabis products
- Items not in original packaging
- Products purchased on sale or clearance

For questions, contact our support team.`,

  shipping: `# Shipping & Delivery Policy

## Delivery Options

We offer multiple delivery options to meet your needs.

### Local Delivery
- Available within 20 miles of our dispensary
- Same-day delivery on orders placed before 2 PM
- $10 delivery fee (free on orders over $100)
- Age verification required (21+)

### Pickup
- Free in-store pickup available
- Ready within 1-2 hours
- Bring valid ID for verification
- Check-in at pickup counter

### Shipping Times
- Local delivery: Same day or next day
- Standard shipping: 3-5 business days
- Express shipping: 1-2 business days

### Important Notes
- All deliveries require adult signature (21+)
- Cannabis products cannot cross state lines
- Delivery available during business hours only
- Driver will verify ID and age before handing over products

For delivery questions, contact us at delivery@yourdispensary.com`,
};

/**
 * 📝 Policy Editor Component
 *
 * Rich text editor for store policies with templates
 */
export function PolicyEditor({
  label,
  value,
  onChange,
  placeholder = "Enter your policy...",
  maxLength = 2000,
  template,
}: PolicyEditorProps) {
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  const handleUseTemplate = () => {
    if (template) {
      onChange(template);
      setShowTemplate(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.typography.weight.medium,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.tertiary,
            "flex items-center gap-2",
          )}
        >
          <FileText size={14} />
          {label}
        </label>

        <div className="flex items-center gap-2">
          {/* Character count */}
          <span
            className={cn(
              ds.typography.size.micro,
              isOverLimit
                ? ds.colors.status.error
                : isNearLimit
                  ? ds.colors.status.warning
                  : ds.colors.text.quaternary,
            )}
          >
            {characterCount} / {maxLength}
          </span>

          {/* Copy button */}
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "p-1.5",
                ds.effects.radius.md,
                ds.colors.bg.elevated,
                "hover:bg-white/[0.06]",
                ds.colors.text.quaternary,
                "hover:text-white/60",
                ds.effects.transition.fast,
              )}
              title="Copy to clipboard"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}

          {/* Template button */}
          {template && (
            <button
              type="button"
              onClick={() => setShowTemplate(!showTemplate)}
              className={cn(
                "px-2 py-1",
                ds.effects.radius.md,
                ds.colors.bg.elevated,
                "hover:bg-white/[0.06]",
                "border",
                ds.colors.border.default,
                ds.colors.text.quaternary,
                "hover:text-white/60",
                ds.effects.transition.fast,
                ds.typography.size.micro,
              )}
            >
              {showTemplate ? "Hide Template" : "View Template"}
            </button>
          )}
        </div>
      </div>

      {/* Template preview */}
      {showTemplate && template && (
        <div
          className={cn(
            "p-4",
            ds.colors.bg.elevated,
            "border",
            ds.colors.border.default,
            ds.effects.radius.lg,
            "space-y-3",
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.tertiary,
                ds.typography.weight.medium,
              )}
            >
              Template Preview
            </span>
            <button
              type="button"
              onClick={handleUseTemplate}
              className={cn(
                "px-3 py-1.5",
                ds.effects.radius.md,
                "bg-white text-black",
                "hover:bg-white/90",
                ds.effects.transition.fast,
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
              )}
            >
              Use This Template
            </button>
          </div>

          <div
            className={cn(
              "p-3",
              "bg-black/20",
              ds.effects.radius.md,
              "max-h-60 overflow-y-auto",
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              "font-mono",
              "whitespace-pre-wrap",
            )}
          >
            {template}
          </div>
        </div>
      )}

      {/* Text editor */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={12}
          className={cn(
            "w-full",
            "p-4",
            ds.colors.bg.input,
            "border",
            isOverLimit ? "border-red-500/50" : ds.colors.border.default,
            ds.colors.text.secondary,
            ds.effects.radius.lg,
            ds.effects.transition.normal,
            ds.typography.size.sm,
            ds.typography.leading.relaxed,
            "resize-y",
            "focus:outline-none",
            isOverLimit ? "focus:border-red-500/70" : "focus:border-white/20",
            "placeholder:text-white/20",
          )}
        />

        {/* Overlay warning */}
        {isOverLimit && (
          <div
            className={cn(
              "absolute bottom-4 left-4 right-4",
              "p-2",
              "bg-red-500/10",
              "border border-red-500/30",
              ds.effects.radius.md,
              "flex items-center gap-2",
              ds.typography.size.xs,
              "text-red-400",
            )}
          >
            <AlertCircle size={14} />
            <span>Character limit exceeded. Please shorten your policy.</span>
          </div>
        )}
      </div>

      {/* Formatting guide */}
      <div
        className={cn(
          "p-3",
          ds.colors.bg.elevated,
          "border",
          ds.colors.border.default,
          ds.effects.radius.lg,
        )}
      >
        <div className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "space-y-1")}>
          <div>
            <strong>Markdown Supported:</strong>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              • <code>#</code> Heading
            </div>
            <div>
              • <code>**bold**</code> Bold text
            </div>
            <div>
              • <code>-</code> Bullet list
            </div>
            <div>
              • <code>1.</code> Numbered list
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 📋 Return Policy Editor
 */
export function ReturnPolicyEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <PolicyEditor
      label="Return Policy"
      value={value}
      onChange={onChange}
      placeholder="Enter your return policy..."
      template={POLICY_TEMPLATES.return}
      maxLength={2000}
    />
  );
}

/**
 * 🚚 Shipping Policy Editor
 */
export function ShippingPolicyEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <PolicyEditor
      label="Shipping & Delivery Policy"
      value={value}
      onChange={onChange}
      placeholder="Enter your shipping and delivery policy..."
      template={POLICY_TEMPLATES.shipping}
      maxLength={2000}
    />
  );
}
