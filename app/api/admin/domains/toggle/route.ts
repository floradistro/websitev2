import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// POST - Toggle domain active status (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, isActive } = body;

    if (!domainId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('vendor_domains')
      .update({ is_active: isActive })
      .eq('id', domainId);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Domain ${isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error: any) {
    console.error('Error toggling domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
