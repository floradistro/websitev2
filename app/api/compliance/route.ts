import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * GET /api/compliance?type=faq&template_id=xxx
 * Fetch compliance content from database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const templateId = searchParams.get('template_id') || 'b17045df-9bf8-4abe-8d5b-bfd09ed3ccd0';

    const supabase = getServiceSupabase();

    let query = supabase
      .from('template_compliance_content')
      .select('*')
      .eq('template_id', templateId);

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query.order('display_order');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, content: data || [] });
  } catch (error: any) {
    console.error('Error fetching compliance content:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

