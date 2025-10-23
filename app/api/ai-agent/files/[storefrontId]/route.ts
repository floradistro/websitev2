import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Get all files for a storefront (latest versions)
 * GET /api/ai-agent/files/[storefrontId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params;
    
    const supabase = getServiceSupabase();
    
    // Get all files (latest version of each)
    const { data: files, error } = await supabase
      .from('storefront_files')
      .select('file_path, file_content, version, ai_explanation')
      .eq('storefront_id', storefrontId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Get latest version of each file
    const latestFiles: Record<string, any> = {};
    
    for (const file of files || []) {
      if (!latestFiles[file.file_path] || latestFiles[file.file_path].version < file.version) {
        latestFiles[file.file_path] = file;
      }
    }
    
    return NextResponse.json({
      success: true,
      files: latestFiles,
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching files:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

