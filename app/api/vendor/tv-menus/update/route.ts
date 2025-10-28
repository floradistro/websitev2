import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { menuId, name, description, theme, display_mode } = await request.json();

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'Menu ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('tv_menus')
      .update({
        name,
        description: description || null,
        theme,
        display_mode: display_mode || 'dense'
      })
      .eq('id', menuId)
      .select();

    if (error) {
      console.error('Error updating menu:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, menu: data[0] });
  } catch (error: any) {
    console.error('Error in update menu API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
