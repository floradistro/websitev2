/**
 * Modify WCL Section - Creative AI with Research
 * Extended thinking + web search + computer use
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, sectionName, sectionCode, fullWCLCode, vendorId, vendorName, vendorLogo } = await request.json();
    
    if (!prompt || !sectionCode) {
      return NextResponse.json(
        { error: 'Missing prompt or section code' },
        { status: 400 }
      );
    }

    console.log(`🤖 AI modifying section: ${sectionName}`);
    console.log(`📝 User prompt: ${prompt}`);
    console.log(`🏪 Vendor: ${vendorName} (${vendorId})`);
    console.log(`🖼️  Logo: ${vendorLogo}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      thinking: {
        type: 'enabled',
        budget_tokens: 5000
      },
      messages: [{
        role: 'user',
        content: `You are editing a WhaleTools Smart Component written in WCL.

CONTEXT:
- This generates a React component that fetches REAL DATA from Supabase
- Current Vendor: ${vendorName || 'Unknown'} (ID: ${vendorId || 'unknown'})
- Vendor Logo: ${vendorLogo || 'Not available'}
- Available APIs: /api/products, /api/testimonials, /api/page-data/products
- WhaleTools luxury theme: bg-black, text-white, border-white/5, rounded-2xl, font-black

COMPLETE PRODUCT SCHEMA (use ANY of these fields):
{
  // Basic Info
  id, name, slug, description, short_description, sku, type, status,
  
  // Pricing
  regular_price, sale_price, on_sale, price (computed),
  
  // Images
  featured_image_storage, // PRIMARY IMAGE URL
  image_gallery, // Array of additional images
  
  // Stock & Inventory
  stock_quantity, stock_status, manage_stock, backorders_allowed, low_stock_amount,
  
  // Blueprint Fields (Cannabis-specific data as JSONB array):
  blueprint_fields: [
    { type: "text", label: "Strain Type", value: "Hybrid/Indica/Sativa" },
    { type: "text", label: "Genetics", value: "Parent strains" },
    { type: "text", label: "THC Content", value: "26-31%" },
    { type: "text", label: "CBD Content", value: "<1%" },
    { type: "text", label: "Dominant Terpenes", value: "Caryophyllene, Limonene" },
    { type: "text", label: "Effects", value: "Euphoric, Relaxed" },
    { type: "text", label: "Flavors", value: "Earthy, Sweet, Pine" }
  ],
  
  // Categories & Attributes
  primary_category_id, vendor_id, attributes (jsonb), default_attributes (jsonb),
  
  // Product Features
  featured, virtual, downloadable, sold_individually, reviews_allowed,
  average_rating, rating_count, view_count,
  
  // Dimensions & Shipping
  weight, length, width, height, shipping_class,
  
  // Variations
  has_variations, variation_ids,
  
  // Tax & External
  tax_status, tax_class, external_url, button_text
}

SECTION: ${sectionName}
CURRENT CODE:
${sectionCode}

USER REQUEST: ${prompt}

WHAT YOU CAN DO:
✅ Add vendor logo: <img src="${vendorLogo || 'https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/vendor-logos/flora-distro-logo.png'}" alt="${vendorName || 'Vendor'} Logo" className="h-12 w-auto" />

✅ Add data fetching: data { products = fetch("/api/products?vendor_id=${vendorId || 'cd2e1122-d511-4edb-be5d-98ef274b4baf'}") @cache(5m) }

✅ Use ALL product fields in maps:
{products.map(p => (
  <div key={p.id}>
    <!-- Images -->
    <img src={p.featured_image_storage} alt={p.name} />
    
    <!-- Basic Info -->
    <h3>{p.name}</h3>
    <p>{p.description}</p>
    
    <!-- Pricing -->
    <span>\${p.price}</span>
    {p.on_sale && <span>Sale!</span>}
    
    <!-- Stock -->
    <span>{p.stock_quantity} in stock</span>
    <span>{p.stock_status}</span>
    
    <!-- Blueprint Fields (Cannabis data) -->
    {p.blueprint_fields.find(f => f.label === "Strain Type")?.value}
    {p.blueprint_fields.find(f => f.label === "THC Content")?.value}
    {p.blueprint_fields.find(f => f.label === "Effects")?.value}
    
    <!-- Ratings & Reviews -->
    <span>⭐ {p.average_rating} ({p.rating_count} reviews)</span>
  </div>
))}

✅ Filter products by ANY field:
- products.filter(p => p.featured === true) // Featured items
- products.filter(p => p.on_sale === true) // Sale items
- products.filter(p => p.stock_quantity > 0) // In stock
- products.filter(p => p.average_rating >= 4.5) // High rated

✅ Access blueprint fields (strain info, THC, effects):
{p.blueprint_fields.map(field => (
  <div key={field.label}>
    <span>{field.label}: {field.value}</span>
  </div>
))}

✅ FULL CREATIVE CONTROL - Use ANY Tailwind CSS classes:

SPACING & LAYOUT:
- Padding: p-4, px-6, py-8, pt-2, pb-10
- Margin: m-4, mx-auto, my-8, mt-6, mb-12, -mt-4 (negative)
- Gap: gap-2, gap-4, gap-6, gap-8, gap-x-4, gap-y-6
- Space Between: space-y-2, space-y-4, space-x-3
- Width/Height: w-full, w-1/2, w-64, h-screen, h-96, min-h-[200px]

FLEXBOX & GRID:
- Flex: flex, flex-col, flex-row, flex-wrap
- Justify: justify-start, justify-center, justify-between, justify-end
- Align: items-start, items-center, items-end, items-stretch
- Grid: grid, grid-cols-1, grid-cols-2, grid-cols-3, grid-cols-4
- Auto fit: grid-cols-[repeat(auto-fit,minmax(250px,1fr))]

TYPOGRAPHY:
- Size: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-5xl
- Weight: font-light, font-normal, font-bold, font-black (900)
- Line Height: leading-none, leading-tight, leading-snug, leading-relaxed
- Letter Spacing: tracking-tight, tracking-normal, tracking-wide, tracking-[0.15em]
- Text Transform: uppercase, lowercase, capitalize

COLORS (Full Palette):
- Backgrounds: bg-black, bg-white, bg-red-500, bg-blue-600, bg-purple-400
- Text: text-white, text-black, text-red-500, text-purple-300/60
- Borders: border-white/5, border-red-500/20, border-2, border-4
- Opacity: bg-white/10, text-white/60, border-white/20

EFFECTS:
- Shadows: shadow-sm, shadow-md, shadow-lg, shadow-2xl
- Blur: backdrop-blur-sm, blur-md
- Opacity: opacity-0, opacity-50, opacity-100
- Transitions: transition-all, duration-300, ease-in-out
- Transforms: scale-105, rotate-45, translate-x-4
- Hover: hover:scale-110, hover:bg-white/20, hover:shadow-2xl

BORDERS & ROUNDED:
- Rounded: rounded, rounded-lg, rounded-xl, rounded-2xl, rounded-full
- Border Width: border, border-2, border-4, border-t, border-l
- Divide: divide-y, divide-x, divide-white/10

POSITIONING:
- Position: relative, absolute, fixed, sticky
- Z-Index: z-0, z-10, z-20, z-50
- Inset: top-0, left-0, right-4, bottom-6, inset-0

WHALETOOLS LUXURY THEME (PREFERRED):
- Backgrounds: bg-black or bg-[#0a0a0a]
- Borders: border-white/5 hover:border-white/10  
- Typography: font-black (900), uppercase, tracking-tight
- Rounded: rounded-2xl (iOS 26 style)
- Cards: bg-[#0a0a0a] border border-white/5 rounded-2xl p-6
- Text: text-white, text-white/60, text-white/40
- Spacing: py-16 sm:py-20, px-4 sm:px-6, gap-6, space-y-4

RULES:
1. Return ONLY the modified section code (render { ... } block)
2. If user asks for products/data, ADD a data section above render
3. Always use vendor_id=${vendorId || 'cd2e1122-d511-4edb-be5d-98ef274b4baf'} in fetch calls
4. Apply WhaleTools luxury theme to ALL new elements
5. Keep WCL structure intact
6. Use Tailwind CSS classes for ALL styling - you have FULL creative control

STYLING EXAMPLES FOR BLUEPRINT FIELDS:
User says "add more spacing" → Add space-y-4, gap-6, py-4, etc.
User says "make text bigger" → Change text-sm to text-lg or text-xl
User says "spread out items" → Add gap-8, justify-between, or space-y-6
User says "tighter layout" → Use gap-2, space-y-1, or -mt-2
User says "center everything" → Add flex flex-col items-center justify-center

BLUEPRINT FIELD DISPLAY EXAMPLE:
<div class="space-y-4">
  {p.blueprint_fields.map(field => (
    <div key={field.label} class="flex items-start gap-4 py-3 border-b border-white/5">
      <span class="text-white/40 text-sm uppercase tracking-wider min-w-[120px]">{field.label}</span>
      <span class="text-white text-base leading-relaxed">{field.value}</span>
    </div>
  ))}
</div>

IMPORTANT FOR PRODUCTS:
- Product images: p.featured_image_storage (NOT p.image)
- Product stock: p.stock_quantity (NOT p.stock)
- Always map real data, don't use fake/placeholder products
- Use ANY Tailwind classes for spacing, colors, layout

VENDOR LOGO USAGE:
When user says "add our logo" / "add my logo" / "add vendor logo" / "show logo":
→ Use: <img src="${vendorLogo || 'https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/vendor-logos/flora-distro-logo.png'}" alt="${vendorName || 'Vendor'} Logo" className="h-12 w-auto object-contain" />

Logo sizing examples:
- Small: h-8 w-auto (32px height)
- Medium: h-12 w-auto (48px height) ← DEFAULT
- Large: h-16 w-auto (64px height)
- Hero: h-24 w-auto (96px height)

Logo positioning:
- Center: mx-auto
- Top-left: absolute top-4 left-4
- Header: flex items-center gap-3 with logo + brand name

Return complete modified section (if adding data fetching, include BOTH data and render blocks):`
      }]
    });

    // Extract text from response (skip thinking blocks)
    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let modifiedSection = textBlock.text.trim();
    
    // Remove markdown code blocks
    const codeBlockMatch = modifiedSection.match(/\`\`\`(?:wcl)?\n?([\s\S]+?)\n?\`\`\`/);
    if (codeBlockMatch) {
      modifiedSection = codeBlockMatch[1].trim();
    }

    console.log('✅ AI modified section creatively');

    return NextResponse.json({
      success: true,
      modifiedSection
    });

  } catch (error: any) {
    console.error('❌ AI modify error:', error);
    return NextResponse.json(
      { error: error.message || 'AI modification failed' },
      { status: 500 }
    );
  }
}

