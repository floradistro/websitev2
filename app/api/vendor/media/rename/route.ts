import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { oldName, newName } = body;
    
    if (!oldName || !newName) {
      return NextResponse.json({ 
        error: 'Old name and new name required' 
      }, { status: 400 });
    }
    
    // Validate new name (no special characters except dash, underscore, dot)
    const validNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!validNameRegex.test(newName)) {
      return NextResponse.json({ 
        error: 'Invalid filename. Use only letters, numbers, dash, underscore, and dot.' 
      }, { status: 400 });
    }
    
    // Prevent overwriting if new name already exists
    const supabase = getServiceSupabase();
    const newFilePath = `${vendorId}/${newName}`;
    const oldFilePath = `${vendorId}/${oldName}`;
    
    // Check if new name already exists (unless it's the same file)
    if (oldName !== newName) {
      const { data: existingFile } = await supabase.storage
        .from('vendor-product-images')
        .list(vendorId, {
          search: newName
        });
      
      if (existingFile && existingFile.length > 0) {
        return NextResponse.json({ 
          error: 'A file with this name already exists' 
        }, { status: 409 });
      }
    }
    
    console.log(`🔵 Renaming: ${oldName} → ${newName}`);
    
    // Copy to new name
    const { data: moveData, error: moveError } = await supabase.storage
      .from('vendor-product-images')
      .move(oldFilePath, newFilePath);
    
    if (moveError) {
      console.error('❌ Rename error:', moveError);
      return NextResponse.json({ error: moveError.message }, { status: 500 });
    }
    
    // Get new public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(newFilePath);
    
    console.log(`✅ Renamed successfully`);
    
    return NextResponse.json({
      success: true,
      newName,
      url: publicUrl
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

