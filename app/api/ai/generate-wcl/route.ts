/**
 * API Route: Generate WCL Component using AI
 * POST /api/ai/generate-wcl
 */

import { NextRequest, NextResponse } from 'next/server';
import { WCLGenerator } from '@/lib/ai/wcl-generator';
import { WCLCompiler } from '@/lib/wcl/compiler';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { goal, context = {}, requirements = [] } = await request.json();
    
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      );
    }
    
    console.log('🤖 AI generating WCL component for:', goal);
    
    // Step 1: AI generates WCL
    const generator = new WCLGenerator();
    const wclCode = await generator.generateComponent({
      goal,
      context,
      requirements
    });
    
    console.log('✅ AI generated WCL:', wclCode.substring(0, 200) + '...');
    
    // Step 2: Compile WCL to TypeScript
    const compiler = new WCLCompiler();
    const ast = compiler.parse(wclCode);
    const tsCode = compiler.compile(wclCode);
    
    console.log('✅ Compiled to TypeScript component:', ast.name);
    
    // Step 3: Save to filesystem (optional - for testing)
    const outputDir = path.join(process.cwd(), 'components/component-registry/smart');
    const outputFile = path.join(outputDir, `${ast.name}.tsx`);
    
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputFile, tsCode);
      console.log('✅ Saved to:', outputFile);
    } catch (fsError) {
      console.warn('⚠️ Could not save to filesystem:', fsError);
    }
    
    // Step 4: Return results
    return NextResponse.json({
      success: true,
      component: {
        name: ast.name,
        wclCode,
        tsCode,
        ast,
        stats: {
          wclLines: wclCode.split('\n').length,
          tsLines: tsCode.split('\n').length,
          reduction: Math.round((1 - wclCode.split('\n').length / tsCode.split('\n').length) * 100)
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ WCL generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate WCL component',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
