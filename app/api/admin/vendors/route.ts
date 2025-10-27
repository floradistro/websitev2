import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('vendors')
      .select('id, store_name, slug, logo_url, status, coming_soon')
      .order('store_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vendors: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
