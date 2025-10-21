import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this COA
    const { data: existing } = await supabase
      .from('vendor_coas')
      .select('vendor_id, file_url')
      .eq('id', id)
      .single();
    
    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: 'COA not found or unauthorized' }, { status: 404 });
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('vendor_coas')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    // Optionally delete file from Supabase Storage
    if (existing.file_url && existing.file_url.includes('supabase.co/storage')) {
      const pathMatch = existing.file_url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
      if (pathMatch) {
        const [, bucket, path] = pathMatch;
        await supabase.storage
          .from(bucket)
          .remove([path]);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'COA deleted'
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

