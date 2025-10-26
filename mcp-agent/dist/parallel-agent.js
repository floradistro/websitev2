"use strict";
/**
 * Parallel Agent System
 * Generates multiple pages simultaneously for 10x speed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStorefrontParallel = generateStorefrontParallel;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const supabase_js_1 = require("@supabase/supabase-js");
const exa_js_1 = __importDefault(require("exa-js"));
const PAGE_GROUPS = {
    group1: ['home', 'shop'],
    group2: ['product', 'about', 'contact'],
    group3: ['faq', 'lab-results'],
    group4: ['privacy', 'terms', 'cookies'],
    group5: ['shipping', 'returns']
};
function getAnthropicClient() {
    return new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}
function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
}
function getExaClient() {
    const exaApiKey = process.env.EXA_API_KEY;
    if (!exaApiKey)
        return null;
    return new exa_js_1.default(exaApiKey);
}
/**
 * Generate pages for a specific group in parallel
 */
async function generatePageGroup(groupName, pages, vendorData, webInsights) {
    const anthropic = getAnthropicClient();
    try {
        console.log(`⚡ [${groupName}] Generating ${pages.join(', ')}...`);
        const prompt = `Generate ONLY these pages: ${pages.join(', ')}

VENDOR: ${vendorData.store_name}
TYPE: ${vendorData.vendor_type}

${webInsights ? `WEB INSIGHTS:\n${webInsights}\n` : ''}

Generate sections and components for ONLY these ${pages.length} pages.
Each page needs:
- smart_header (page_type: "all", section_order: -1) - ONLY ONCE
- smart_footer (page_type: "all", section_order: 999) - ONLY ONCE
- Page-specific smart components

IMPORTANT:
- Home: smart_features, smart_product_grid, smart_faq
- Shop: smart_shop_controls, smart_product_grid  
- Product: smart_product_detail
- About: smart_about
- Contact: smart_contact
- FAQ: smart_faq
- Lab Results: smart_lab_results
- Privacy/Terms/Cookies: smart_legal_page (with pageType prop)
- Shipping: smart_shipping
- Returns: smart_returns

Return ONLY JSON:
{
  "sections": [{"section_key": "header", "section_order": -1, "page_type": "all"}, ...],
  "components": [{"section_key": "header", "component_key": "smart_header", "props": {}, "position_order": 0}, ...]
}`;
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature: 0.3, // Fast and stable
            messages: [{
                    role: 'user',
                    content: prompt
                }]
        });
        const text = response.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('')
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const result = JSON.parse(text);
        console.log(`✅ [${groupName}] Generated ${result.sections.length} sections, ${result.components.length} components`);
        return {
            groupName,
            sections: result.sections || [],
            components: result.components || [],
            success: true
        };
    }
    catch (error) {
        console.error(`❌ [${groupName}] Failed:`, error.message);
        return {
            groupName,
            sections: [],
            components: [],
            success: false,
            error: error.message
        };
    }
}
/**
 * Generate complete storefront in parallel
 */
async function generateStorefrontParallel(vendorId, vendorData) {
    const logs = [];
    const errors = [];
    logs.push(`⚡ PARALLEL MODE: Generating 5 groups simultaneously`);
    // Optional: Get web insights
    let webInsights = '';
    const exa = getExaClient();
    if (exa && vendorData.store_name) {
        try {
            logs.push(`🌐 Searching web for inspiration...`);
            const searchResults = await exa.searchAndContents(`${vendorData.store_name} ${vendorData.vendor_type} website design`, { numResults: 2, text: true });
            webInsights = searchResults.results
                .map(r => `${r.title}: ${r.text?.slice(0, 150)}`)
                .join('\n');
            logs.push(`✅ Found web insights`);
        }
        catch (e) {
            logs.push(`⚠️ Web search skipped`);
        }
    }
    // Generate all page groups in parallel
    const startTime = Date.now();
    const results = await Promise.all([
        generatePageGroup('group1', PAGE_GROUPS.group1, vendorData, webInsights),
        generatePageGroup('group2', PAGE_GROUPS.group2, vendorData, webInsights),
        generatePageGroup('group3', PAGE_GROUPS.group3, vendorData, webInsights),
        generatePageGroup('group4', PAGE_GROUPS.group4, vendorData, webInsights),
        generatePageGroup('group5', PAGE_GROUPS.group5, vendorData, webInsights)
    ]);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logs.push(`⚡ Parallel generation completed in ${elapsed}s`);
    // Check for failures
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        errors.push(...failed.map(f => `${f.groupName}: ${f.error}`));
    }
    // Merge all sections and components
    let allSections = [];
    let allComponents = [];
    // Deduplicate header/footer (only add once)
    const seenHeaderFooter = new Set();
    results.forEach(result => {
        result.sections.forEach(section => {
            const key = `${section.page_type}:${section.section_key}`;
            // For header/footer, only add once
            if (section.section_key === 'header' || section.section_key === 'footer') {
                if (!seenHeaderFooter.has(section.section_key)) {
                    allSections.push(section);
                    seenHeaderFooter.add(section.section_key);
                }
            }
            else {
                allSections.push(section);
            }
        });
        result.components.forEach(component => {
            // Skip duplicate headers/footers
            if (component.component_key === 'smart_header' || component.component_key === 'smart_footer') {
                const key = component.component_key;
                if (seenHeaderFooter.has(key))
                    return;
            }
            allComponents.push(component);
        });
    });
    logs.push(`✅ Merged: ${allSections.length} sections, ${allComponents.length} components`);
    return {
        success: failed.length === 0,
        sections: allSections,
        components: allComponents,
        logs,
        errors
    };
}
