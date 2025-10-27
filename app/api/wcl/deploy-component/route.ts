/**
 * Deploy WCL Component to Production
 * Compiles WCL → TypeScript → File → Database → Registry
 */

import { NextRequest, NextResponse } from 'next/server';
import { WCLCompiler } from '@/lib/wcl/compiler';
import { getServiceSupabase } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { wclCode, componentName, vendorId } = await request.json();
    
    if (!wclCode || !componentName) {
      return NextResponse.json({ error: 'Missing WCL code or component name' }, { status: 400 });
    }

    console.log(`🚀 Deploying WCL component: ${componentName}`);

    // 1. COMPILE WCL TO TYPESCRIPT
    const compiler = new WCLCompiler();
    const compiledCode = compiler.compile(wclCode);
    
    // 2. SAVE TO FILE SYSTEM
    const componentKey = componentName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    const fileName = `${componentName}.tsx`;
    const filePath = path.join(process.cwd(), 'components', 'component-registry', 'smart', fileName);
    
    fs.writeFileSync(filePath, compiledCode, 'utf8');
    console.log(`✅ Saved to: ${filePath}`);

    // 3. UPDATE INDEX.TS
    const indexPath = path.join(process.cwd(), 'components', 'component-registry', 'smart', 'index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    const exportLine = `export { ${componentName} } from './${componentName}';`;
    
    if (!indexContent.includes(exportLine)) {
      indexContent += `\n${exportLine}`;
      fs.writeFileSync(indexPath, indexContent, 'utf8');
      console.log(`✅ Added to index.ts`);
    }

    // 3.5 UPDATE COMPONENT_MAP IN RENDERER.TSX
    const rendererPath = path.join(process.cwd(), 'lib', 'component-registry', 'renderer.tsx');
    let rendererContent = fs.readFileSync(rendererPath, 'utf8');
    const mapEntry = `  '${componentKey}': Smart.${componentName},`;
    
    if (!rendererContent.includes(mapEntry)) {
      // Find the COMPONENT_MAP and add the entry
      const mapMatch = rendererContent.match(/(const COMPONENT_MAP.*?= {[\s\S]*?)(};)/);
      if (mapMatch) {
        const beforeClosing = mapMatch[1];
        const closing = mapMatch[2];
        rendererContent = rendererContent.replace(
          mapMatch[0],
          `${beforeClosing}\n${mapEntry}\n${closing}`
        );
        fs.writeFileSync(rendererPath, rendererContent, 'utf8');
        console.log(`✅ Added to COMPONENT_MAP`);
      }
    }

    // 4. REGISTER IN DATABASE
    const supabase = getServiceSupabase();
    
    // Parse WCL to extract props schema
    const propsMatch = wclCode.match(/props\s*{([^}]+)}/);
    let propsSchema: Record<string, any> = {};
    
    if (propsMatch) {
      const propLines = propsMatch[1].split('\n').filter((l: string) => l.trim());
      propLines.forEach((line: string) => {
        const match = line.match(/(\w+):\s*(\w+)\s*=\s*"([^"]*)"/);
        if (match) {
          const [, propName, propType, defaultValue] = match;
          propsSchema[propName] = {
            type: propType.toLowerCase(),
            default: defaultValue
          };
        }
      });
    }

    // Check if data fetching exists
    const hasDataFetching = wclCode.includes('data {') && wclCode.includes('fetch(');

    await supabase
      .from('component_templates')
      .upsert({
        component_key: componentKey,
        name: componentName,
        category: 'smart',
        description: `AI-generated WCL component`,
        props_schema: propsSchema,
        fetches_real_data: hasDataFetching,
        tags: ['wcl', 'ai-generated']
      });
    
    console.log(`✅ Registered in database`);

    // 5. CREATE VENDOR INSTANCE (if vendorId provided)
    if (vendorId) {
      // Find hero section for this vendor
      const { data: sections } = await supabase
        .from('vendor_storefront_sections')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('section_key', 'hero')
        .eq('page_type', 'home')
        .limit(1);

      if (sections && sections.length > 0) {
        await supabase
          .from('vendor_component_instances')
          .insert({
            vendor_id: vendorId,
            section_id: sections[0].id,
            component_key: componentKey,
            props: propsSchema,
            position_order: 0
          });
        
        console.log(`✅ Created instance for vendor`);
      }
    }

    // 6. RETURN SUCCESS WITH INSTRUCTIONS
    return NextResponse.json({
      success: true,
      message: 'Component deployed successfully',
      componentKey,
      filePath,
      nextSteps: [
        '1. Restart dev server to load new component',
        `2. Add '${componentKey}': Smart.${componentName} to COMPONENT_MAP`,
        `3. Visit storefront to see your component`
      ]
    });

  } catch (error: any) {
    console.error('❌ Deploy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

