/**
 * Save WCL Component
 * Stores WCL source and compiled TypeScript
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { wclCode, compiledCode, componentName, vendorId } = await request.json();
    
    if (!wclCode || !compiledCode || !componentName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save compiled TypeScript to filesystem
    const componentPath = path.join(
      process.cwd(),
      'components/component-registry/smart',
      `${componentName}.tsx`
    );
    
    fs.writeFileSync(componentPath, compiledCode);

    // Save WCL source to database (for editing later)
    const { error: dbError } = await supabase
      .from('wcl_components')
      .upsert({
        component_key: componentName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase(),
        name: componentName,
        wcl_source: wclCode,
        compiled_code: compiledCode,
        vendor_id: vendorId,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway - file saved is most important
    }

    return NextResponse.json({
      success: true,
      message: 'Component saved successfully',
      componentPath,
      componentKey: componentName.toLowerCase()
    });

  } catch (error: any) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

