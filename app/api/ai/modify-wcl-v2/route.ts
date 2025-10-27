/**
 * AI WCL Modifier V2 - Clean Architecture with Exa Research
 * Section-specific prompts with clear, focused instructions
 * Now includes deep web research for better results
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ExaClient, formatExaResultsForAI, extractDesignInsights } from '@/lib/ai/exa-client';
import { VisualAnalyzer } from '@/lib/ai/visual-analyzer';
import { formatFontsForAI } from '@/lib/ai/font-library';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const exa = new ExaClient(process.env.EXA_API_KEY);
const visualAnalyzer = new VisualAnalyzer();

// Clean prompt templates per section type
const getPromptForSection = (
  type: string, 
  userPrompt: string, 
  currentCode: string, 
  vendorId: string
): string => {
  
  // PROPS SECTION PROMPT
  if (type === 'props') {
    return `You are editing a WCL props section.

CURRENT CODE:
${currentCode}

USER REQUEST: ${userPrompt}

Return ONLY valid WCL props code. No explanations.

Format:
props {
  headline: String = "default value"
  showField: Boolean = true
  items: Array<String> = ["item1", "item2"]
}

Available types: String, Boolean, Number, Array<String>

Rules:
- Must start with "props {"
- One property per line
- Balance all braces
- No explanations or comments outside the code block`;
  }

  // DATA SECTION PROMPT
  if (type === 'data') {
    return `You are editing a WCL data section.

CURRENT CODE:
${currentCode}

USER REQUEST: ${userPrompt}

Return ONLY valid WCL data code. No explanations.

Format:
data {
  products = fetch("/api/products?vendor_id=${vendorId}&limit=10") @cache(5m)
  testimonials = fetch("/api/testimonials?vendor_id=${vendorId}") @cache(10m)
}

Rules:
- Must start with "data {"
- Use vendor_id: ${vendorId}
- Add @cache(Xm) for caching
- Balance all braces
- No explanations`;
  }

  // RENDER SECTION PROMPT (most common, most detailed)
  if (type === 'render') {
    return `You are editing a WCL render section.

CURRENT CODE:
${currentCode}

USER REQUEST: ${userPrompt}

IMPORTANT: You may return EITHER:
1. Just render { ... } - if no data needed
2. Both data { ... } AND render { ... } - if fetching data

Example with data:
data {
  products = fetch("/api/products?vendor_id=${vendorId}") @cache(5m)
}

render {
  <div className="bg-black py-12 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-black uppercase text-white mb-8">{headline}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <img src={p.featured_image_storage} className="w-full aspect-square object-cover rounded-xl mb-4" />
            <h3 className="text-white font-black uppercase mb-2">{p.name}</h3>
            <div className="flex justify-between mb-4">
              <span className="text-white font-black text-xl">\${p.price}</span>
              <span className="text-white/40 text-sm">{p.stock_quantity} in stock</span>
            </div>
            
            {/* Blueprint fields - cannabis strain info */}
            {p.blueprint_fields && (
              <div className="space-y-2 border-t border-white/5 pt-4">
                {p.blueprint_fields.map(field => (
                  <div key={field.label} className="flex gap-3">
                    <span className="text-white/40 text-xs uppercase min-w-[100px]">{field.label}</span>
                    <span className="text-white text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
}

Product Fields Available:
{
  id, name, price, description,
  featured_image_storage,  // Main product image URL
  stock_quantity,
  blueprint_fields: [      // Strain/product details
    { label: "Strain Type", value: "Hybrid" },
    { label: "THC Content", value: "26-31%" },
    { label: "Effects", value: "Euphoric, Relaxed" }
  ]
}

WhaleTools Design System:
- bg-black or bg-[#0a0a0a]
- border-white/5 (subtle borders)
- text-white, text-white/60, text-white/40
- rounded-2xl (iOS 26 style)
- font-black uppercase (for headings)
- gap-4 to gap-6 (spacing)
- py-12 px-4 (section padding)

CRITICAL USER INSTRUCTIONS (MUST FOLLOW):
- "hide description" / "remove description" → REMOVE the entire {p.description} line completely
- "show blueprint fields" → Add blueprint_fields.map() block after price
- "hide price" → Remove price display completely
- "bigger images" → Change aspect-square to aspect-[4/3]
- "no description" → Same as hide description - REMOVE IT

Example - If user says "hide description" or "remove description":

BEFORE (with description):
<div key={p.id} className="card">
  <img src={p.featured_image_storage} />
  <h3>{p.name}</h3>
  <p className="text-white/60 text-sm mb-4">{p.description}</p>
  <span>\${p.price}</span>
</div>

AFTER (description removed):
<div key={p.id} className="card">
  <img src={p.featured_image_storage} />
  <h3>{p.name}</h3>
  <span>\${p.price}</span>
</div>

Notice: The entire <p>{p.description}</p> line is GONE.

Rules:
- NO explanations or text outside code
- Use vendor_id: ${vendorId}
- Balance all braces
- Valid JSX only
- If you add data section, products variable must match the fetch name`;
  }

  return `Invalid section type: ${type}`;
};

// Simple extraction - just remove markdown fences
const extractCleanCode = (text: string): string => {
  let code = text.trim();
  
  // Remove markdown code blocks
  const markdownMatch = code.match(/```(?:wcl|jsx|javascript)?\s*\n?([\s\S]+?)\n?```/);
  if (markdownMatch) {
    code = markdownMatch[1].trim();
  }
  
  return code;
};

// Fast validation
const validateCode = (code: string, expectedType: string): { valid: boolean; error?: string } => {
  // Check braces are balanced
  let braceCount = 0;
  for (const char of code) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) {
      return { valid: false, error: 'Unbalanced braces: more closing than opening' };
    }
  }
  if (braceCount !== 0) {
    return { valid: false, error: `Unbalanced braces: ${braceCount} unclosed` };
  }
  
  const trimmed = code.trim();
  
  // Allow full component generation (starts with "component")
  if (trimmed.startsWith('component ')) {
    return { valid: true };
  }
  
  // Check starts with expected keyword (allow multiple sections for render)
  const validKeywords = ['props', 'data', 'render', 'quantum', 'state'];
  const startsWithKeyword = validKeywords.some(k => trimmed.match(new RegExp(`^${k}\\s*\\{`)));
  
  if (!startsWithKeyword) {
    return { valid: false, error: 'Code must start with props, data, render, or component keyword' };
  }
  
  // For non-render sections, must start with exact type (unless it's a full component)
  if (expectedType !== 'render' && !trimmed.startsWith('component ')) {
    const pattern = new RegExp(`^${expectedType}\\s*\\{`);
    if (!trimmed.match(pattern)) {
      return { valid: false, error: `${expectedType} section must start with "${expectedType} {"` };
    }
  }
  
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      sectionType, 
      sectionCode, 
      vendorId, 
      vendorName, 
      vendorLogo, 
      fullWCLCode, 
      smartMode, 
      industry,
      referenceUrl, // URL to analyze for design inspiration
      isEditingExisting // If true, preserve existing sections
    } = await request.json();
    
    console.log(`\n🤖 AI V2 Request`);
    console.log(`   Mode: ${smartMode ? 'SMART (Auto-detect)' : 'Manual'}`);
    console.log(`   Editing: ${isEditingExisting ? '🔄 YES (preserve existing)' : '🆕 NO (generate new)'}`);
    console.log(`   Section: ${sectionType}`);
    console.log(`   Prompt: "${prompt}"`);
    console.log(`   Vendor: ${vendorName} (${vendorId})`);
    console.log(`   Industry: ${industry || 'not specified'}`);
    console.log(`   Reference URL: ${referenceUrl || 'none'}`);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // PHASE 0: VISUAL ANALYSIS (if reference URL provided)
    let visualContext = '';
    let screenshotBase64 = '';
    
    if (referenceUrl) {
      console.log('📸 Taking screenshot of reference site...');
      
      try {
        const analysis = await visualAnalyzer.analyzeWebsite(referenceUrl);
        screenshotBase64 = analysis.screenshot;
        
        visualContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 COMPLETE VISUAL REFERENCE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference: ${analysis.url}
Title: ${analysis.metadata.title}
Color Scheme: ${analysis.metadata.colorScheme}
Layout System: ${analysis.insights.layout}

🎨 ALL COLORS EXTRACTED (Background, Text, Borders):
${analysis.insights.dominantColors.map(c => `  • ${c}`).join('\n')}

✍️ TYPOGRAPHY (All fonts detected):
${analysis.insights.typography.map(f => `  • ${f}`).join('\n')}

📐 SPACING SYSTEM MEASURED:
  • Average padding: ${analysis.insights.spacing}
  • Use this to match spacing in your design

📊 LAYOUT STRUCTURE:
  ${analysis.insights.layout}

🎨 COMPONENTS DETECTED:
${analysis.insights.components.map(c => `  • ${c}`).join('\n')}

📈 DESIGN SYSTEM:
  • Layout type: ${analysis.insights.layout}
  • Component count: ${analysis.insights.components.length}
  • Typography variants: ${analysis.insights.typography.length}
  • Color palette: ${analysis.insights.dominantColors.length} colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 SCREENSHOT ATTACHED - LOOK AT IT CAREFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL INSTRUCTIONS:

1. LOOK at the screenshot and COUNT how many sections you see
2. IDENTIFY each section type (Hero? Products? About? Features? etc.)
3. NOTE the heading text, button text, layout for EACH section
4. RECREATE ALL sections you see - don't skip any
5. MATCH colors, spacing, typography exactly as shown
6. If you see 8 sections, CREATE 8 sections. Be thorough!

The user wants to COPY THIS ENTIRE PAGE. Do NOT just make 1-2 sections.
Make it COMPLETE and PROFESSIONAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        
        console.log(`✅ Screenshot captured (${(Buffer.from(screenshotBase64, 'base64').length / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.warn('⚠️ Screenshot failed, continuing without visual reference:', error);
      }
    }

    // PHASE 1: EXA DEEP RESEARCH (for complex requests)
    let researchContext = '';
    const needsResearch = prompt.toLowerCase().includes('generate') || 
                         prompt.toLowerCase().includes('redesign') ||
                         prompt.toLowerCase().includes('transform') ||
                         prompt.toLowerCase().includes('create') ||
                         prompt.toLowerCase().includes('build') ||
                         prompt.length > 80; // Long prompts = complex requests
    
    if (needsResearch && industry) {
      console.log('🔍 Activating Exa research for complex request...');
      
      try {
        const startTime = Date.now();
        
        // Parallel research
        const [designResults, bestPractices] = await Promise.all([
          exa.searchDesignInspiration(prompt, industry),
          exa.searchBestPractices('conversion optimization', industry)
        ]);
        
        const researchTime = Date.now() - startTime;
        console.log(`✅ Exa research complete in ${researchTime}ms - Found ${designResults.length + bestPractices.length} sources`);
        
        const insights = extractDesignInsights([...designResults, ...bestPractices]);
        
        researchContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 EXA RESEARCH CONTEXT (${industry.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formatExaResultsForAI(designResults.slice(0, 3))}

📊 EXTRACTED INSIGHTS:
• Colors: ${insights.colorSchemes.slice(0, 3).join('; ')}
• Layouts: ${insights.layoutPatterns.slice(0, 3).join('; ')}
• Typography: ${insights.typography.slice(0, 3).join('; ')}
• Animations: ${insights.animations.slice(0, 3).join('; ')}

Best Practices:
${insights.bestPractices.slice(0, 6).map(bp => `• ${bp}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLY THESE INSIGHTS to create a world-class, conversion-optimized component.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
      } catch (error) {
        console.warn('⚠️ Exa research failed, continuing without research:', error);
      }
    }

    // PHASE 2: ADD FONT LIBRARY
    const fontLibrary = formatFontsForAI();
    
    // PHASE 3: BUILD COMPLETE PROMPT
    const systemPrompt = visualContext + '\n\n' + researchContext + '\n\n' + fontLibrary + '\n\n' + getPromptForSection(sectionType, prompt, sectionCode, vendorId);
    
    console.log(`   Prompt length: ${systemPrompt.length} chars`);
    console.log(`   Visual reference: ${visualContext ? 'YES 📸' : 'NO'}`);
    console.log(`   Exa research: ${researchContext ? 'YES 🔬' : 'NO'}`);
    console.log(`   Font library: YES ✍️`);

    // Smart mode: AI analyzes entire component and decides what to modify
    if (smartMode && fullWCLCode) {
      console.log('   Using SMART MODE - AI will analyze full component and be THOROUGH');
      
      const smartPrompt = visualContext + '\n\n' + researchContext + '\n\n' + fontLibrary + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: YOU ARE A SENIOR DESIGNER FOR APPLE, GUCCI, LOUIS VUITTON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is for ${vendorName} - a LUXURY BRAND. Quality must be EXCEPTIONAL.

EXISTING COMPONENT:
${fullWCLCode}

USER REQUEST: "${prompt}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DETECT MODE: Is this EDITING or GENERATING?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Look at existing component:
• Has substantial content (3+ sections)? → EDITING MODE
• Is blank/template? → GENERATION MODE

EDITING MODE (if existing has real content):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User says: "optimize the page" / "make it better" / "add X section"

YOUR TASK:
1. PRESERVE all existing sections
2. ONLY modify what user specifically requests
3. If adding a section, INSERT it (don't replace existing)
4. If optimizing, IMPROVE existing (don't regenerate)
5. Return COMPLETE component with ALL sections (existing + modifications)

EXAMPLE:
Existing: Hero + Products + Footer (3 sections)
Request: "Add testimonials section"
Output: Hero + Products + Testimonials + Footer (4 sections - added 1, kept 3)

Existing: Hero + Products + Footer
Request: "Make hero more impactful"
Output: Hero (improved) + Products (unchanged) + Footer (unchanged)

⚠️ DO NOT regenerate the entire page unless explicitly asked!

GENERATION MODE (if blank/template):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User says: "Generate homepage" / "Copy this site" / "Create complete page"

YOUR TASK:
1. BE EXTREMELY THOROUGH
   ❌ DON'T create 1-2 sections and stop
   ✅ DO create EVERY section needed
   
2. If copying reference:
   • Count sections in screenshot
   • RECREATE ALL OF THEM
   • Match layout, colors, typography
   
3. If generating from scratch:
   • Minimum 5-6 major sections
   • Each fully built with real data
   • Professional production quality

2. MATCH QUALITY STANDARDS
   • Spacing: Use generous padding (py-16, py-20, py-24)
   • Typography: Font-black for headlines, proper hierarchy
   • Colors: Extract from screenshot or use WhaleTools dark luxury
   • Layout: Proper grid systems, responsive breakpoints
   • Animations: Hover effects, transitions, scale
   • Mobile: MUST be fully responsive (sm:, md:, lg:)

3. USE ALL PROVIDED CONTEXT
   ${visualContext ? '• Screenshot provided → MATCH IT EXACTLY' : ''}
   ${researchContext ? '• Research provided → APPLY THE INSIGHTS' : ''}
   • Font library provided → USE APPROPRIATE FONTS
   • Vendor data provided → INTEGRATE BRANDING

4. RETURN COMPLETE COMPONENT
   If request is for full page/homepage/complete redesign:
   → Return ENTIRE component with ALL sections:
   
   component FullHomepage {
     props {
       // 10+ customizable props
     }
     data {
       // All data sources needed
     }
     render {
       <div className="min-h-screen bg-black">
         {/* Hero Section - COMPLETE */}
         {/* Products Section - COMPLETE */}
         {/* About Section - COMPLETE */}
         {/* Features Section - COMPLETE */}
         {/* Testimonials Section - COMPLETE */}
         {/* Footer Section - COMPLETE */}
       </div>
     }
   }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 WHALETOOLS DESIGN SYSTEM (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Colors:
• Background: bg-black or bg-[#0a0a0a]
• Borders: border-white/5, hover:border-white/10
• Text: text-white (headings), text-white/60 (body), text-white/40 (labels)
• Accents: Can use brand colors from visual reference

Typography:
• Headlines: text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter
• Subheads: text-2xl sm:text-3xl md:text-4xl font-black uppercase
• Body: text-base sm:text-lg text-white/60 leading-relaxed
• Use fonts from library when appropriate

Spacing:
• Section padding: py-16 sm:py-20 md:py-24 lg:py-28
• Container: max-w-7xl mx-auto px-4 sm:px-6 md:px-8
• Gaps: gap-6 sm:gap-8 md:gap-12

Components:
• Cards: bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8
• Buttons: bg-white text-black px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase
• Images: aspect-square rounded-xl sm:rounded-2xl object-cover

Responsive:
• Mobile-first: Start with mobile, add sm:, md:, lg: breakpoints
• Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
• Flex: flex-col sm:flex-row

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VENDOR DATA (use this):
• Name: ${vendorName}
• ID: ${vendorId}
• Logo: ${vendorLogo || 'Not provided'}

REQUIRED DATA FETCHING (include these):
• Products: fetch("/api/products?vendor_id=${vendorId}&limit=6") @cache(5m)
• Testimonials: fetch("/api/testimonials?vendor_id=${vendorId}") @cache(10m)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 EXAMPLES OF THOROUGH WORK (THIS IS EXPECTED):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INCOMPLETE (❌ BAD):
render {
  <div className="bg-black py-12">
    <h1>Products</h1>
    {products.map(p => <div>{p.name}</div>)}
  </div>
}

COMPLETE (✅ GOOD):
component CompletePage {
  props {
    heroHeadline: String = "ELEVATED EXPERIENCE"
    heroSubheadline: String = "Premium Quality"
    ctaPrimary: String = "Shop Now"
    ctaSecondary: String = "Learn More"
    productsTitle: String = "FEATURED PRODUCTS"
    aboutTitle: String = "OUR STORY"
    featuresTitle: String = "WHY CHOOSE US"
  }
  
  data {
    products = fetch("/api/products?vendor_id=${vendorId}&limit=6") @cache(5m)
    testimonials = fetch("/api/testimonials?vendor_id=${vendorId}") @cache(10m)
  }
  
  render {
    <div className="min-h-screen bg-black">
      {/* Hero - Full section with gradient, typography, CTAs */}
      <div className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
            {heroHeadline}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-white/60 mb-12 max-w-3xl mx-auto">
            {heroSubheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-lg hover:scale-105 transition-all">
              {ctaPrimary}
            </button>
            <button className="bg-white/10 border border-white/20 text-white px-12 py-5 rounded-2xl font-black uppercase text-lg hover:bg-white/20 transition-all">
              {ctaSecondary}
            </button>
          </div>
        </div>
      </div>
      
      {/* Products - Complete grid with all details */}
      <div className="py-20 sm:py-24 md:py-28 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter mb-16 text-center">
            {productsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-3xl p-8 transition-all hover:scale-[1.02]">
                <img src={p.featured_image_storage} alt={p.name} className="w-full aspect-square object-cover rounded-2xl mb-6" />
                <h3 className="text-2xl sm:text-3xl font-black uppercase mb-3">{p.name}</h3>
                <p className="text-white/60 text-sm sm:text-base mb-6 leading-relaxed">{p.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <span className="text-3xl font-black">\${p.price}</span>
                  <button className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-white/90 transition-all">
                    Add to Bag
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* About - Full section */}
      {/* Features - Full section */}
      {/* Testimonials - Full section */}
      {/* Footer - Full section */}
    </div>
  }
}

THIS is thorough work. Copy this standard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ APPLY NOW - BE THOROUGH, BE COMPLETE, BE PROFESSIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY complete WCL code. No explanations.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Latest - most thorough
        max_tokens: 16000, // Large for complete pages
        temperature: 1.0, // Creative
        messages: [{ role: 'user', content: smartPrompt }]
      });

      const textBlock = response.content.find(block => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from AI');
      }

      let code = extractCleanCode(textBlock.text);
      
      // Check if AI generated a full component (starts with "component")
      if (code.trim().startsWith('component ')) {
        console.log(`   AI generated FULL COMPONENT - will replace entire WCL`);
        return NextResponse.json({
          success: true,
          modifiedSection: code,
          detectedSection: 'full',
          isFullComponent: true
        });
      }
      
      // Detect which section was modified
      const detectedType = code.match(/^(props|data|render)\s*\{/) ? 
        code.match(/^(props|data|render)\s*\{/)![1] : 'render';
      
      console.log(`   AI detected section: ${detectedType}`);
      
      const validation = validateCode(code, detectedType);
      if (!validation.valid) {
        console.error(`   ❌ Validation failed: ${validation.error}`);
        return NextResponse.json({
          success: false,
          error: `AI generated invalid code: ${validation.error}`,
          rawResponse: textBlock.text
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        modifiedSection: code,
        detectedSection: detectedType
      });
    }

    // Manual mode: Specific section selected
    if (!sectionCode) {
      return NextResponse.json(
        { error: 'Missing sectionCode for manual mode' },
        { status: 400 }
      );
    }

    // Call Claude (with vision if screenshot provided)
    const messageContent: any[] = [
      { type: 'text', text: systemPrompt }
    ];
    
    // Add screenshot for visual analysis
    if (screenshotBase64) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: screenshotBase64
        }
      });
      console.log('   📷 Screenshot attached for Claude Vision analysis');
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Latest and most powerful
      max_tokens: 8000, // Increased for complete pages
      temperature: 1.0, // More creative
      messages: [{
        role: 'user',
        content: messageContent
      }]
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Extract clean code
    let code = extractCleanCode(textBlock.text);
    
    console.log(`   Raw response length: ${textBlock.text.length} chars`);
    console.log(`   Clean code length: ${code.length} chars`);
    
    // Fast validation
    const validation = validateCode(code, sectionType);
    if (!validation.valid) {
      console.error(`   ❌ Validation failed: ${validation.error}`);
      return NextResponse.json({
        success: false,
        error: `AI generated invalid code: ${validation.error}`,
        rawResponse: textBlock.text
      }, { status: 400 });
    }

    console.log(`   ✅ Valid ${sectionType} code returned\n`);

    return NextResponse.json({
      success: true,
      modifiedSection: code
    });

  } catch (error: any) {
    console.error(`   ❌ AI Error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'AI modification failed' },
      { status: 500 }
    );
  }
}

