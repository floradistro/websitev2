/**
 * Alpine IQ Approved Message Templates
 *
 * IMPORTANT: These templates must match EXACTLY what's approved in Alpine IQ dashboard
 *
 * How to get these:
 * 1. Log into https://lab.alpineiq.com
 * 2. Go to Campaigns → Create Campaign → SMS
 * 3. Find "Message Templates" or "Approved Messages" section
 * 4. Copy the exact text here
 *
 * Placeholders you can use:
 * - {firstName} - Customer's first name
 * - {lastName} - Customer's last name
 * - {storeName} - Your store name
 * - {link} - Auto-generated short link (Alpine IQ replaces this)
 * - {phone} - Customer's phone
 * - {email} - Customer's email
 */

export interface AlpineTemplate {
  message: string;
  description: string;
  requiresLandingPage: boolean;
  placeholders: string[];
}

export const ALPINE_APPROVED_TEMPLATES: Record<string, AlpineTemplate> = {
  // TODO: Replace these with YOUR actual approved templates from Alpine IQ dashboard

  EXAMPLE_FLASH_SALE: {
    message: "Special offer just for you! {link}",
    description: "Generic flash sale with landing page",
    requiresLandingPage: true,
    placeholders: ["{link}"],
  },

  EXAMPLE_NEW_PRODUCT: {
    message: "{storeName} has new products! Check them out: {link}",
    description: "New product announcement",
    requiresLandingPage: true,
    placeholders: ["{storeName}", "{link}"],
  },

  EXAMPLE_PERSONALIZED: {
    message: "Hi {firstName}, exclusive deal for our members! {link}",
    description: "Personalized member promotion",
    requiresLandingPage: true,
    placeholders: ["{firstName}", "{link}"],
  },

  EXAMPLE_ORDER_READY: {
    message: "Your order is ready for pickup! Visit us at {storeName}.",
    description: "Order ready notification (no landing page)",
    requiresLandingPage: false,
    placeholders: ["{storeName}"],
  },

  // Add your actual approved templates below:
  // FLASH_SALE: {
  //   message: 'Copy exact text from Alpine IQ dashboard here',
  //   description: 'Your description',
  //   requiresLandingPage: true,
  //   placeholders: ['{link}'],
  // },
};

/**
 * Helper to validate template has required placeholders
 */
export function validateTemplate(
  templateKey: string,
  landingHTML?: string,
): {
  valid: boolean;
  error?: string;
} {
  const template = ALPINE_APPROVED_TEMPLATES[templateKey];

  if (!template) {
    return { valid: false, error: `Template "${templateKey}" not found` };
  }

  // If template requires landing page but none provided
  if (template.requiresLandingPage && !landingHTML) {
    return {
      valid: false,
      error: `Template "${templateKey}" requires a landing page HTML`,
    };
  }

  // If template has {link} placeholder but no landing page
  if (template.message.includes("{link}") && !landingHTML) {
    return {
      valid: false,
      error: "Template contains {link} placeholder but no landingHTML provided",
    };
  }

  return { valid: true };
}

/**
 * Get template message with placeholders replaced
 * Note: {link} will be replaced by Alpine IQ, don't replace it here
 */
export function prepareTemplateMessage(
  templateKey: string,
  replacements?: Record<string, string>,
): string {
  const template = ALPINE_APPROVED_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`Template "${templateKey}" not found`);
  }

  let message = template.message;

  // Replace placeholders (except {link} which Alpine IQ handles)
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      if (key !== "link") {
        message = message.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      }
    });
  }

  return message;
}
