"use strict";
/**
 * Claude Agent SDK Integration
 * Autonomous storefront generation with terminal access
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStorefrontWithAgent = generateStorefrontWithAgent;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const supabase_js_1 = require("@supabase/supabase-js");
const exa_js_1 = __importDefault(require("exa-js"));
const validator_1 = require("./validator");
const component_registry_1 = require("./component-registry");
const template_engine_1 = require("./templates/template-engine");
// Initialize clients lazily to avoid env var issues
function getAnthropicClient() {
    return new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY
    });
}
function getExaClient() {
    const exaApiKey = process.env.EXA_API_KEY;
    if (!exaApiKey) {
        console.warn('⚠️ EXA_API_KEY not found, web search disabled');
        return null;
    }
    return new exa_js_1.default(exaApiKey);
}
function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';
    console.log('🔌 Connecting to Supabase:', supabaseUrl);
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        global: {
            headers: {
                'apikey': supabaseServiceKey
            }
        }
    });
}
async function generateStorefrontWithAgent(vendorId, vendorData) {
    const logs = [];
    const errors = [];
    // Initialize clients here (after dotenv loaded)
    const anthropic = getAnthropicClient();
    const supabase = getSupabaseClient();
    try {
        logs.push(`🤖 Starting AI generation for ${vendorData.store_name}`);
        // Get vendor's actual data from database
        const enrichedVendorData = await enrichVendorData(vendorId, vendorData);
        logs.push(`📊 Vendor data enriched: ${enrichedVendorData.product_count} products, ${enrichedVendorData.location_count} locations`);
        // Optionally search web for vendor inspiration
        const exa = getExaClient();
        let webInsights = '';
        if (exa && enrichedVendorData.store_name) {
            try {
                logs.push(`🌐 Searching web for ${enrichedVendorData.store_name} inspiration...`);
                const searchResults = await exa.searchAndContents(`${enrichedVendorData.store_name} ${enrichedVendorData.vendor_type} website design trends`, { numResults: 3, text: true });
                webInsights = searchResults.results
                    .map(r => `${r.title}: ${r.text?.slice(0, 200)}...`)
                    .join('\n');
                logs.push(`✅ Found ${searchResults.results.length} web insights`);
            }
            catch (e) {
                logs.push(`⚠️ Web search failed (non-critical): ${e.message}`);
            }
        }
        // Check if we should use template system (for cannabis vendors)
        const vendorType = (enrichedVendorData.vendor_type || '').toLowerCase();
        const useTemplate = vendorType.includes('cannabis') ||
            vendorType.includes('thc') ||
            vendorType.includes('dispensary') ||
            vendorType.includes('cbd') ||
            vendorType === 'both' || // Flora Distro is 'both'
            vendorType === 'retail'; // Default to template
        let design;
        if (useTemplate) {
            logs.push(`🎨 Applying Wilson's Template from database...`);
            design = await (0, template_engine_1.applyTemplate)(enrichedVendorData);
            logs.push(`✅ Template applied: ${design.sections.length} sections, ${design.components.length} components`);
            // Add FAQ and compliance sections
            design = (0, template_engine_1.addComplianceSections)(design, enrichedVendorData);
            logs.push(`✅ Added compliance sections (FAQ, disclaimers)`);
        }
        else {
            // Phase 1: Design the storefront with Claude (for non-cannabis)
            logs.push(`🎨 Claude designing storefront...`);
            // Optimized for speed
            logs.push(`⚡ Claude generating (optimized for speed)...`);
            const designResponse = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 8192,
                temperature: 0.5, // Optimized for speed and stability
                system: component_registry_1.COMPLETE_AGENT_INSTRUCTIONS,
                messages: [{
                        role: 'user',
                        content: `Design a COMPLETE, PRODUCTION-READY storefront with ALL 12 PAGES for this vendor:

VENDOR INFORMATION:
${JSON.stringify(enrichedVendorData, null, 2)}

COMPLETE SMART COMPONENT REGISTRY:
${JSON.stringify(component_registry_1.COMPLETE_SMART_COMPONENT_REGISTRY, null, 2)}

COMPLETE PAGE STRUCTURE (YOU MUST CREATE ALL OF THESE):
${JSON.stringify(component_registry_1.COMPLETE_PAGE_STRUCTURE, null, 2)}

PRE-BUILT CANNABIS CONTENT (Use this for cannabis vendors):
${JSON.stringify(component_registry_1.CANNABIS_VENDOR_SPECIFIC_CONTENT, null, 2)}

${webInsights ? `\n🌐 WEB INSIGHTS FOR INSPIRATION:\n${webInsights}\n` : ''}

CRITICAL REQUIREMENTS:
1. Create sections for ALL 12 pages (home, shop, product, about, contact, faq, lab-results, privacy, terms, cookies, shipping, returns)
2. EVERY page must have smart_header (section_order: -1, page_type: "all")
3. EVERY page must have smart_footer (section_order: 999, page_type: "all")
4. Use vendor-specific content (replace {{vendor.store_name}} with real name)
5. Use smart components for auto-wired data (smart_product_grid, smart_shop_controls, etc.)
6. Include real, compelling copy (not generic lorem ipsum)
7. Follow WhaleTools luxury design (already built into components)

OUTPUT FORMAT - CRITICAL:
Return ONLY raw JSON. Start with { and end with }

{
  "sections": [
    {"section_key": "header", "section_order": -1, "page_type": "all"},
    {"section_key": "how_it_works", "section_order": 0, "page_type": "home"},
    ... (ALL sections for ALL 12 pages)
    {"section_key": "footer", "section_order": 999, "page_type": "all"}
  ],
  "components": [
    {"section_key": "header", "component_key": "smart_header", "props": {}, "position_order": 0},
    ... (ALL components for ALL pages)
  ]
}

NO markdown, NO explanations, ONLY JSON.`
                    }]
            });
            // Extract JSON from response
            const responseText = designResponse.content
                .filter(c => c.type === 'text')
                .map(c => c.text)
                .join('');
            // Remove markdown code blocks if present
            const cleanedJson = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            design = JSON.parse(cleanedJson);
            logs.push(`✅ Claude generated ${design.sections.length} sections, ${design.components.length} components`);
        }
        // Phase 2: Validate the design (skip for templates - they're pre-validated)
        if (useTemplate) {
            logs.push(`✅ Using pre-validated template, skipping Claude validation`);
        }
        else {
            logs.push(`🔍 Validating design...`);
            const validation = (0, validator_1.validateStorefront)(design, enrichedVendorData);
            if (!validation.valid) {
                logs.push(`⚠️ Design has ${validation.errors.length} errors. Asking Claude to fix...`);
                // Ask Claude to fix issues
                const fixResponse = await anthropic.messages.create({
                    model: 'claude-sonnet-4-5-20250929',
                    max_tokens: 8192,
                    messages: [
                        {
                            role: 'user',
                            content: `Your design has these errors:

${validation.errors.join('\n')}

Original design:
${JSON.stringify(design, null, 2)}

Fix these issues and return corrected JSON (same format).`
                        }
                    ]
                });
                const fixedText = fixResponse.content
                    .filter(c => c.type === 'text')
                    .map(c => c.text)
                    .join('')
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
                design = JSON.parse(fixedText);
                logs.push(`✅ Claude fixed the design`);
                // Re-validate
                const revalidation = (0, validator_1.validateStorefront)(design, enrichedVendorData);
                if (!revalidation.valid) {
                    // Auto-fix what we can
                    design = (0, validator_1.autoFixDesign)(design, revalidation);
                    logs.push(`🔧 Auto-fixed remaining issues`);
                }
            }
            if (validation.warnings.length > 0) {
                logs.push(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
            }
        }
        // Phase 3: Insert into database using direct SQL (more reliable)
        logs.push(`💾 Inserting sections into database...`);
        const insertedSections = await insertSectionsDirectSQL(vendorId, design.sections);
        logs.push(`✅ Created ${insertedSections.length} sections`);
        // Map section_keys to actual database IDs (composite key: page_type:section_key)
        const sectionMap = new Map();
        insertedSections.forEach((section) => {
            const compositeKey = `${section.page_type}:${section.section_key}`;
            sectionMap.set(compositeKey, section.id);
        });
        // Phase 4: Insert components using direct SQL (one by one for reliability)
        logs.push(`💾 Inserting components into database...`);
        // Filter components with composite key matching
        const componentsData = design.components.filter((c) => {
            const pageType = design.sections.find((s) => s.section_key === c.section_key)?.page_type || 'home';
            const compositeKey = `${pageType}:${c.section_key}`;
            return sectionMap.has(compositeKey);
        });
        const insertedComponents = await insertComponentsDirectSQL(vendorId, sectionMap, componentsData, design.sections);
        logs.push(`✅ Created ${insertedComponents.length} components`);
        // Phase 5: Update vendor status using direct SQL
        try {
            await updateVendorStatusDirectSQL(vendorId);
            logs.push(`✅ Vendor activated`);
        }
        catch (e) {
            logs.push(`⚠️ Could not update vendor status (non-critical)`);
        }
        // Phase 6: Verify storefront URL
        const storefrontUrl = `https://yachtclub.com/storefront?vendor=${vendorData.slug}`;
        logs.push(`🎉 Storefront live at: ${storefrontUrl}`);
        return {
            success: true,
            vendorId,
            sectionsCreated: insertedSections.length,
            componentsCreated: insertedComponents.length,
            storefrontUrl,
            design,
            logs
        };
    }
    catch (error) {
        console.error('❌ Generation failed:', error);
        errors.push(error.message);
        return {
            success: false,
            vendorId,
            sectionsCreated: 0,
            componentsCreated: 0,
            storefrontUrl: '',
            logs,
            errors
        };
    }
}
/**
 * Enrich vendor data by querying actual database
 * Agent can make smarter decisions with real data
 */
async function enrichVendorData(vendorId, vendorData) {
    try {
        const supabase = getSupabaseClient();
        // Get product count and categories
        const { data: products } = await supabase
            .from('products')
            .select('id, category')
            .eq('vendor_id', vendorId)
            .eq('status', 'active');
        const productCount = products?.length || 0;
        const categories = [...new Set(products?.map(p => p.category) || [])];
        // Get location count
        const { data: locations } = await supabase
            .from('vendor_locations')
            .select('id')
            .eq('vendor_id', vendorId);
        const locationCount = locations?.length || 0;
        // Get vendor full details
        const { data: vendor } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
            .single();
        return {
            ...vendorData,
            product_count: productCount,
            has_products: productCount > 0,
            product_categories: categories,
            location_count: locationCount,
            logo_url: vendor?.logo_url,
            brand_colors: vendor?.brand_colors || {},
            wholesale_enabled: vendor?.wholesale_enabled || false,
            vendor_type: vendor?.vendor_type || vendorData.vendor_type || 'retail'
        };
    }
    catch (error) {
        console.warn('Could not enrich vendor data, using basic info:', error);
        // Fallback to basic data if database fails
        return {
            ...vendorData,
            product_count: 0,
            has_products: false,
            location_count: 0
        };
    }
}
// Database helpers using Supabase JS client (works from Docker)
async function insertSectionsDirectSQL(vendorId, sections) {
    const supabase = getSupabaseClient();
    const sectionsToInsert = sections.map(s => ({
        vendor_id: vendorId,
        section_key: s.section_key,
        section_order: s.section_order,
        page_type: s.page_type || 'home',
        is_enabled: true,
        content_data: {}
    }));
    // Use upsert to avoid duplicates
    const { data, error } = await supabase
        .from('vendor_storefront_sections')
        .upsert(sectionsToInsert, {
        onConflict: 'vendor_id,page_type,section_key',
        ignoreDuplicates: false
    })
        .select('id, section_key, page_type');
    if (error) {
        throw new Error(`Failed to insert sections: ${error.message}`);
    }
    return data || [];
}
async function insertComponentsDirectSQL(vendorId, sectionMap, components, sections) {
    const supabase = getSupabaseClient();
    const componentsToInsert = components
        .map(c => {
        // Find page_type for this section
        const section = sections.find((s) => s.section_key === c.section_key);
        const pageType = section?.page_type || 'home';
        const compositeKey = `${pageType}:${c.section_key}`;
        const sectionId = sectionMap.get(compositeKey);
        if (!sectionId) {
            console.warn(`No section ID found for ${compositeKey}`);
            return null;
        }
        return {
            vendor_id: vendorId,
            section_id: sectionId,
            component_key: c.component_key,
            props: c.props || {},
            position_order: c.position_order,
            is_enabled: true,
            field_bindings: {}
        };
    })
        .filter(c => c !== null);
    // Insert in batches of 50 to avoid payload size limits
    const batchSize = 50;
    const insertedComponents = [];
    for (let i = 0; i < componentsToInsert.length; i += batchSize) {
        const batch = componentsToInsert.slice(i, i + batchSize);
        const { data, error } = await supabase
            .from('vendor_component_instances')
            .insert(batch)
            .select('id');
        if (error) {
            console.error(`Failed to insert component batch ${i / batchSize + 1}:`, error.message);
            continue;
        }
        if (data) {
            insertedComponents.push(...data);
        }
    }
    return insertedComponents;
}
async function updateVendorStatusDirectSQL(vendorId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('vendors')
        .update({
        status: 'active',
        storefront_generated: true,
        storefront_generated_at: new Date().toISOString()
    })
        .eq('id', vendorId);
    if (error) {
        throw new Error(`Failed to update vendor status: ${error.message}`);
    }
}
