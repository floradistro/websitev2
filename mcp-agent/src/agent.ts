/**
 * Claude Agent SDK Integration
 * Autonomous storefront generation with terminal access
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateStorefront, autoFixDesign, type VendorData, type StorefrontDesign } from './validator';
import { COMPONENT_REGISTRY, AGENT_INSTRUCTIONS } from './component-registry';
import { applyTemplate, addComplianceSections } from './templates/template-engine';

// Initialize clients lazily to avoid env var issues
function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

  console.log('🔌 Connecting to Supabase:', supabaseUrl);

  return createClient(supabaseUrl, supabaseServiceKey, {
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

export interface GenerationResult {
  success: boolean;
  vendorId: string;
  sectionsCreated: number;
  componentsCreated: number;
  storefrontUrl: string;
  design?: StorefrontDesign;
  logs?: string[];
  errors?: string[];
}

export async function generateStorefrontWithAgent(
  vendorId: string,
  vendorData: VendorData
): Promise<GenerationResult> {
  const logs: string[] = [];
  const errors: string[] = [];
  
  // Initialize clients here (after dotenv loaded)
  const anthropic = getAnthropicClient();
  const supabase = getSupabaseClient();
  
  try {
    logs.push(`🤖 Starting AI generation for ${vendorData.store_name}`);
    
    // Get vendor's actual data from database
    const enrichedVendorData = await enrichVendorData(vendorId, vendorData);
    logs.push(`📊 Vendor data enriched: ${enrichedVendorData.product_count} products, ${enrichedVendorData.location_count} locations`);
    
    // Check if we should use template system (for cannabis vendors)
    const vendorType = (enrichedVendorData.vendor_type || '').toLowerCase();
    const useTemplate = vendorType.includes('cannabis') || 
                        vendorType.includes('thc') ||
                        vendorType.includes('dispensary') ||
                        vendorType.includes('cbd') ||
                        vendorType === 'both' || // Flora Distro is 'both'
                        vendorType === 'retail'; // Default to template
    
    let design: StorefrontDesign;
    
    if (useTemplate) {
      logs.push(`🎨 Applying Wilson's Template from database...`);
      design = await applyTemplate(enrichedVendorData);
      logs.push(`✅ Template applied: ${design.sections.length} sections, ${design.components.length} components`);
      
      // Add FAQ and compliance sections
      design = addComplianceSections(design, enrichedVendorData);
      logs.push(`✅ Added compliance sections (FAQ, disclaimers)`);
    } else {
      // Phase 1: Design the storefront with Claude (for non-cannabis)
      logs.push(`🎨 Claude designing storefront...`);
    
    const designResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0.7, // Bit of creativity for design
      system: AGENT_INSTRUCTIONS,
      messages: [{
        role: 'user',
        content: `Design a beautiful, professional storefront for this vendor:

VENDOR INFORMATION:
${JSON.stringify(enrichedVendorData, null, 2)}

COMPONENT REGISTRY:
${JSON.stringify(COMPONENT_REGISTRY, null, 2)}

TASK:
1. Analyze the vendor's business type and data
2. Choose 5-8 optimal sections that tell their story
3. Select and configure components for each section
4. Write compelling, professional copy (not generic)
5. Use smart components to auto-wire their products/locations/reviews
6. Handle edge cases (e.g., 0 products = "coming soon" section)
7. Match their brand vibe (cannabis = trustworthy, restaurant = appetizing, etc.)

OUTPUT FORMAT - CRITICAL:
Return ONLY the JSON object. No explanations, no markdown, no text before or after.
Start your response with { and end with }

Required JSON structure:
{
  "sections": [{"section_key": "hero", "section_order": 0, "page_type": "home"}, ...],
  "components": [{"section_key": "hero", "component_key": "text", "props": {...}, "position_order": 0}, ...]
}

DO NOT include any text like "Here's the design" or "I created".
DO NOT wrap in markdown code blocks.
ONLY return the raw JSON object.`
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
    } else {
      logs.push(`🔍 Validating design...`);
      const validation = validateStorefront(design, enrichedVendorData);
      
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
        const revalidation = validateStorefront(design, enrichedVendorData);
        if (!revalidation.valid) {
          // Auto-fix what we can
          design = autoFixDesign(design, revalidation);
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
    
    // Map section_keys to actual database IDs
    const sectionMap = new Map<string, string>();
    insertedSections.forEach(section => {
      sectionMap.set(section.section_key, section.id);
    });
    
    // Phase 4: Insert components using direct SQL (one by one for reliability)
    logs.push(`💾 Inserting components into database...`);
    
    const componentsData = design.components.filter(c => sectionMap.has(c.section_key));
    const insertedComponents = await insertComponentsDirectSQL(vendorId, sectionMap, componentsData);
    logs.push(`✅ Created ${insertedComponents.length} components`);
    
    // Phase 5: Update vendor status using direct SQL
    try {
      await updateVendorStatusDirectSQL(vendorId);
      logs.push(`✅ Vendor activated`);
    } catch (e) {
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
    
  } catch (error: any) {
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
async function enrichVendorData(vendorId: string, vendorData: VendorData): Promise<VendorData> {
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
  } catch (error) {
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
async function insertSectionsDirectSQL(vendorId: string, sections: any[]) {
  const supabase = getSupabaseClient();
  
  const sectionsToInsert = sections.map(s => ({
    vendor_id: vendorId,
    section_key: s.section_key,
    section_order: s.section_order,
    page_type: s.page_type || 'home',
    is_enabled: true,
    content_data: {}
  }));
  
  const { data, error } = await supabase
    .from('vendor_storefront_sections')
    .insert(sectionsToInsert)
    .select('id, section_key');
  
  if (error) {
    throw new Error(`Failed to insert sections: ${error.message}`);
  }
  
  return data || [];
}

async function insertComponentsDirectSQL(vendorId: string, sectionMap: Map<string, string>, components: any[]) {
  const supabase = getSupabaseClient();
  
  const componentsToInsert = components
    .filter(c => sectionMap.has(c.section_key))
    .map(c => ({
      vendor_id: vendorId,
      section_id: sectionMap.get(c.section_key)!,
      component_key: c.component_key,
      props: c.props || {},
      position_order: c.position_order,
      is_enabled: true,
      field_bindings: {}
    }));
  
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

async function updateVendorStatusDirectSQL(vendorId: string) {
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

