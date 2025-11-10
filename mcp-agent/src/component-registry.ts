/**
 * Component Registry Context for AI Agent
 * COMPLETE REGISTRY - All smart components, all pages, 100% coverage
 */

import {
  COMPLETE_SMART_COMPONENT_REGISTRY,
  COMPLETE_PAGE_STRUCTURE,
  WHALETOOLS_DESIGN_SYSTEM,
} from "./smart-component-registry";
import {
  COMPLETE_AGENT_INSTRUCTIONS,
  CANNABIS_VENDOR_SPECIFIC_CONTENT,
} from "./agent-instructions";

// Export complete registry for agent
export {
  COMPLETE_SMART_COMPONENT_REGISTRY,
  COMPLETE_PAGE_STRUCTURE,
  WHALETOOLS_DESIGN_SYSTEM,
  COMPLETE_AGENT_INSTRUCTIONS,
  CANNABIS_VENDOR_SPECIFIC_CONTENT,
};

// Legacy registry for backwards compatibility
export const COMPONENT_REGISTRY = {
  smart_components: {
    smart_product_grid: {
      description: "Automatically displays vendor's products from database",
      auto_wires: "vendor_id",
      props: {
        limit: "number (4-12 recommended)",
        category: 'string (optional: "flower", "edibles", "concentrates")',
        sort: '"popular" | "newest" | "price_low" | "price_high"',
        show_lab_results: "boolean (true for cannabis vendors)",
        grid_columns: "number (3-4 recommended)",
      },
      use_when:
        "Vendor has products in database. This component queries products table automatically.",
      example: {
        component_key: "smart_product_grid",
        props: { limit: 8, category: "flower", sort: "popular" },
      },
    },
    smart_product_showcase: {
      description: "Hero-style product showcase with featured products",
      auto_wires: "vendor_id",
      props: {
        featured_count: "number (3-6 recommended)",
        show_cta: "boolean",
        layout: '"carousel" | "grid"',
      },
      use_when: "Hero section or prominent product display",
      example: {
        component_key: "smart_product_showcase",
        props: { featured_count: 4, show_cta: true, layout: "carousel" },
      },
    },
    smart_location_map: {
      description: "Automatically displays vendor's physical locations with map",
      auto_wires: "vendor_id",
      props: {
        show_hours: "boolean",
        show_directions: "boolean",
        show_phone: "boolean",
      },
      use_when: "Vendor has 1+ locations. Queries vendor_locations table automatically.",
      example: {
        component_key: "smart_location_map",
        props: { show_hours: true, show_directions: true },
      },
    },
    smart_testimonials: {
      description: "Automatically displays customer reviews and testimonials from database",
      auto_wires: "vendor_id",
      props: {
        limit: "number (3-6 recommended)",
        show_rating: "boolean",
        show_date: "boolean",
        layout: '"grid" | "carousel"',
      },
      use_when: "Always include for social proof. Gracefully handles 0 reviews.",
      example: {
        component_key: "smart_testimonials",
        props: { limit: 5, show_rating: true, layout: "grid" },
      },
    },
    smart_header: {
      description: "Dynamic header with vendor branding and navigation",
      auto_wires: "vendor_id",
      props: {
        show_logo: "boolean",
        show_search: "boolean",
        show_cart: "boolean",
      },
      use_when: "Top of every page for navigation",
      example: {
        component_key: "smart_header",
        props: { show_logo: true, show_search: true, show_cart: true },
      },
    },
    smart_footer: {
      description: "Footer with vendor info, links, and legal",
      auto_wires: "vendor_id",
      props: {
        show_social: "boolean",
        show_hours: "boolean",
        show_newsletter: "boolean",
      },
      use_when: "Bottom of every page",
      example: {
        component_key: "smart_footer",
        props: { show_social: true, show_hours: true },
      },
    },
    smart_category_nav: {
      description: "Auto-generated category navigation from product categories",
      auto_wires: "vendor_id",
      props: {
        layout: '"horizontal" | "vertical" | "grid"',
        show_icons: "boolean",
        show_count: "boolean",
      },
      use_when: "Category browsing for vendors with multiple product categories",
      example: {
        component_key: "smart_category_nav",
        props: { layout: "horizontal", show_count: true },
      },
    },
    smart_stats_counter: {
      description: "Animated stats display (products sold, happy customers, etc)",
      auto_wires: "vendor_id",
      props: {
        stats: "array of {label, value, suffix}",
        animate: "boolean",
      },
      use_when: "Build credibility with numbers",
      example: {
        component_key: "smart_stats_counter",
        props: {
          stats: [
            { label: "Products", value: 500, suffix: "+" },
            { label: "Happy Customers", value: 10000, suffix: "+" },
          ],
          animate: true,
        },
      },
    },
  },

  composite_components: {
    product_card: {
      description: "Single product card with image, title, price",
      props: {
        product_id: "string (product ID)",
        show_price: "boolean",
        show_stock: "boolean",
      },
      use_for: "Manual product displays",
      example: {
        component_key: "product_card",
        props: { product_id: "uuid", show_price: true },
      },
    },
    product_grid: {
      description: "Grid of product cards",
      props: {
        product_ids: "array of product IDs",
        columns: "number (2-4)",
        show_prices: "boolean",
      },
      use_for: "Manual product grids",
      example: {
        component_key: "product_grid",
        props: { product_ids: ["uuid1", "uuid2"], columns: 3 },
      },
    },
  },

  basic_components: {
    text: {
      description: "Display text content",
      props: {
        text: "string (the actual text content)",
        size: '"small" | "medium" | "large" | "xlarge"',
        color: "string (hex color)",
        alignment: '"left" | "center" | "right"',
        font_weight: '"300" | "400" | "500" | "600"',
      },
      use_for: "Headings, taglines, descriptions, any text",
      example: {
        component_key: "text",
        props: {
          text: "Premium Cannabis Delivered",
          size: "xlarge",
          color: "#ffffff",
          alignment: "center",
        },
      },
    },
    image: {
      description: "Display images or logos",
      props: {
        src: "string (URL or path)",
        alt: "string (alt text)",
        width: "number (pixels)",
        height: "number (pixels)",
        object_fit: '"contain" | "cover"',
      },
      use_for: "Logos, hero images, banners",
      example: {
        component_key: "image",
        props: {
          src: "/logo.png",
          alt: "Flora Distro Logo",
          width: 200,
          object_fit: "contain",
        },
      },
    },
    button: {
      description: "Call-to-action buttons",
      props: {
        text: "string (button label)",
        link: "string (URL)",
        style: '"primary" | "secondary" | "outline"',
        size: '"small" | "medium" | "large"',
      },
      use_for: "Shop now, Contact us, Order, etc.",
      example: {
        component_key: "button",
        props: {
          text: "Shop Now",
          link: "/shop",
          style: "primary",
          size: "large",
        },
      },
    },
    badge: {
      description: "Small label/badge for tags, status, etc",
      props: {
        text: "string",
        variant: '"success" | "warning" | "info" | "default"',
        size: '"small" | "medium"',
      },
      use_for: "Tags, labels, status indicators",
      example: {
        component_key: "badge",
        props: { text: "New", variant: "success", size: "small" },
      },
    },
    icon: {
      description: "Icon display from icon library",
      props: {
        name: "string (icon name)",
        size: "number (pixels)",
        color: "string (hex color)",
      },
      use_for: "Decorative icons, feature highlights",
      example: {
        component_key: "icon",
        props: { name: "check-circle", size: 24, color: "#10b981" },
      },
    },
    spacer: {
      description: "Add vertical spacing",
      props: {
        height: "number (pixels)",
      },
      use_for: "Creating breathing room between sections",
      example: {
        component_key: "spacer",
        props: { height: 40 },
      },
    },
    divider: {
      description: "Horizontal line separator",
      props: {
        color: "string (hex color)",
        thickness: "number (pixels)",
      },
      use_for: "Separating content sections",
      example: {
        component_key: "divider",
        props: { color: "#333333", thickness: 1 },
      },
    },
  },

  sections: {
    hero: {
      description: "Top hero section - first thing users see",
      required: true,
      typical_components: [
        "text (brand name)",
        "text (tagline)",
        "button (CTA)",
        "image (optional)",
      ],
      best_practices: "Keep it bold and simple. Main message should be clear in 3 seconds.",
    },
    process: {
      description: "How it works / Why choose us",
      recommended_for: ["cannabis", "food", "service"],
      typical_components: ["text (heading)", "text (step 1)", "text (step 2)", "text (step 3)"],
      best_practices: "3-4 steps explaining the customer journey or unique selling points.",
    },
    featured_products: {
      description: "Showcase products",
      required: true,
      typical_components: ["text (heading)", "smart_product_grid"],
      best_practices:
        "Always include smart_product_grid. Show 6-8 products for optimal conversion.",
    },
    locations: {
      description: "Physical store locations",
      recommended_for: "Vendors with 1+ locations",
      typical_components: ["text (heading)", "smart_location_map"],
      best_practices: "Only include if vendor has locations. Auto-wires to locations table.",
    },
    reviews: {
      description: "Social proof / testimonials",
      recommended: true,
      typical_components: ["text (heading)", "smart_testimonials"],
      best_practices:
        'Builds trust. Include even if vendor has 0 reviews (shows "No reviews yet").',
    },
    about_story: {
      description: "Brand story / mission",
      recommended_for: ["premium brands", "local businesses"],
      typical_components: ["text (heading)", "text (story)", "image (optional)"],
      best_practices: "Create emotional connection. Write in vendor's voice.",
    },
    shipping_badges: {
      description: "Delivery info / trust badges",
      recommended_for: ["ecommerce", "cannabis"],
      typical_components: [
        "text (same-day delivery)",
        "text (discreet packaging)",
        "text (lab tested)",
      ],
      best_practices: "Highlight competitive advantages like speed, privacy, quality.",
    },
    footer: {
      description: "Bottom navigation and links",
      required: true,
      typical_components: ["text (copyright)", "text (links)"],
      best_practices: "Keep simple. Include legal links (privacy, terms).",
    },
  },

  design_guidelines: {
    cannabis_dispensary: {
      vibe: "Professional, trustworthy, medical-grade",
      colors: "Earth tones (greens, browns), clean whites",
      emphasis: ["Lab testing", "Fast delivery", "Discreet packaging", "Locations"],
      sections: [
        "hero",
        "process",
        "featured_products",
        "locations",
        "shipping_badges",
        "reviews",
        "footer",
      ],
    },
    restaurant: {
      vibe: "Appetizing, warm, inviting",
      colors: "Warm tones (reds, oranges, yellows)",
      emphasis: ["Menu highlights", "Ambiance photos", "Reservations", "Location"],
      sections: ["hero", "featured_products", "about_story", "locations", "reviews", "footer"],
    },
    retail: {
      vibe: "Clean, modern, trustworthy",
      colors: "Brand colors, high contrast",
      emphasis: ["Products", "Shipping", "Returns policy", "Reviews"],
      sections: [
        "hero",
        "featured_products",
        "shipping_badges",
        "reviews",
        "about_story",
        "footer",
      ],
    },
  },
};

export const AGENT_INSTRUCTIONS = `
You are an expert storefront designer for Yacht Club, a premium multi-vendor marketplace.

YOUR GOAL: Generate beautiful, conversion-optimized storefronts that look like they were designed by a professional agency.

=== CRITICAL STRUCTURAL RULES ===
1. ALWAYS start with smart_header (section_order: -1, page_type: "all")
2. ALWAYS end with smart_footer (section_order: 999, page_type: "all")
3. Hero section is ALWAYS first content section (section_order: 0)
4. Logical flow: Hero → Value Props → Products → Social Proof → CTA → Footer

=== DESIGN SYSTEM (MUST FOLLOW) ===

**COLOR PALETTE - USE CONSISTENTLY:**
- Primary: Use vendor's brand colors (from brand_colors.primary)
- Accent: Use vendor's brand colors (from brand_colors.accent)  
- Text: #0f172a (dark) or #64748b (medium) or #94a3b8 (light)
- Background: Always white or very subtle grays
- NEVER USE: Random colors. Stick to 2-3 colors max.

**TYPOGRAPHY HIERARCHY:**
- H1 (Hero headlines): size="xlarge", font_weight="600", color="#0f172a"
- H2 (Section headers): size="large", font_weight="600", color="#0f172a"
- H3 (Subheads): size="medium", font_weight="500", color=vendor.primary
- Body text: size="medium", font_weight="400", color="#64748b"
- Small text: size="small", font_weight="400", color="#94a3b8"

**SPACING SYSTEM (CONSISTENT):**
- Section padding: spacer height=80 (top), height=80 (bottom)
- Between elements: spacer height=24 or height=32
- Tight groups: spacer height=12 or height=16
- NEVER use random spacing like 17px, 23px, etc.

**LAYOUT RULES:**
- ALL text must be alignment="center" for clean look
- Images should be centered with appropriate width
- Buttons always centered
- Use dividers to separate major sections
- Max content width (handled by renderer, but keep in mind)

**COMPONENT COMPOSITION PATTERNS:**

Hero Section Pattern:
1. spacer (80)
2. image (logo, width: 120-180)
3. spacer (32)
4. text (brand name, xlarge, weight=600)
5. spacer (16)
6. text (tagline, large, weight=400, gray)
7. spacer (32)
8. text (description, medium, weight=400, gray)
9. spacer (40)
10. button (primary CTA)
11. spacer (80)

Value Props Pattern (3-4 items):
1. spacer (60)
2. text (section heading, large)
3. spacer (48)
4. icon + text (prop 1) + spacer (16) + text (description) + spacer (40)
5. icon + text (prop 2) + spacer (16) + text (description) + spacer (40)
6. icon + text (prop 3) + spacer (16) + text (description)
7. spacer (60)

Section Divider Pattern:
1. spacer (60)
2. divider (color="#e5e7eb", thickness=1)
3. spacer (60)

=== CONTENT RULES ===
1. WRITE COMPELLING COPY - don't just use vendor's basic input, enhance it professionally
2. USE VENDOR'S ACTUAL NAME throughout (personalize everything)
3. MATCH THE VENDOR'S VIBE - cannabis = trustworthy/medical, restaurant = appetizing, etc.
4. NO LOREM IPSUM - all text must be real and relevant
5. Handle 0 products gracefully: "Our curated collection is launching soon. Be the first to know."
6. Every section needs a purpose - no filler

=== VALID COMPONENT KEYS (CRITICAL - ONLY USE THESE) ===

BASIC: text, image, button, badge, icon, spacer, divider
COMPOSITE: product_card, product_grid
SMART: smart_header, smart_footer, smart_product_grid, smart_testimonials, smart_location_map, smart_category_nav, smart_stats_counter, smart_product_showcase

**NEVER use these - they don't exist:**
❌ logo (use "image" instead)
❌ testimonials (use "smart_testimonials" instead)
❌ Any other made-up names

=== SMART COMPONENTS (AUTO-WIRE TO DATA) ===
- smart_header: Required for every storefront (section_key="header")
- smart_footer: Required for every storefront (section_key="footer")
- smart_product_grid: For displaying products (handles 0 products gracefully)
- smart_testimonials: For social proof - exact key is "smart_testimonials" NOT "testimonials"
- smart_location_map: Only if vendor has locations
- NEVER hardcode product IDs or data
- component_key MUST match database exactly

=== QUALITY CHECKLIST ===
✅ smart_header is present (section_order: -1)
✅ smart_footer is present (section_order: 999)
✅ Hero has clear value proposition
✅ Only 2-3 colors used (vendor's brand colors)
✅ Consistent spacing (24, 32, 48, 60, 80)
✅ Everything is centered
✅ Typography hierarchy makes sense
✅ Dividers between major sections
✅ Professional copy (not generic)
✅ Mobile-friendly (all center-aligned)
✅ Clear CTAs with buttons
✅ Trust elements included

=== OUTPUT REQUIREMENTS ===
- 6-8 sections total (including header/footer)
- Use consistent spacing multipliers (12, 16, 24, 32, 40, 48, 60, 80)
- Stick to vendor's brand colors for accents
- Use neutral grays for body text
- Make it look like Apple.com level of polish

Remember: The vendor should see this and think "Wow, this looks like I paid $10,000 for a designer!" not "I need to fix this mess."
`;
