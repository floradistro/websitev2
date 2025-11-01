import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const {
      menuId, name, description, theme, display_mode, gridColumns, gridRows, categories, customFields, customFieldsConfig,
      visible_price_breaks, hideAllFieldLabels, layoutStyle, splitLeftCategory, splitLeftTitle,
      splitLeftCustomFields, splitLeftPriceBreaks, splitRightCategory, splitRightTitle,
      splitRightCustomFields, splitRightPriceBreaks, enableCarousel, carouselInterval
    } = await request.json();

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'Menu ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Build config_data with all menu configuration
    const config_data: any = {};
    if (gridColumns !== undefined) {
      config_data.gridColumns = gridColumns;
    }
    if (gridRows !== undefined) {
      config_data.gridRows = gridRows;
    }
    if (categories !== undefined) {
      config_data.categories = categories;
    }
    if (customFields !== undefined) {
      config_data.customFields = customFields;
    }
    if (customFieldsConfig !== undefined) {
      config_data.customFieldsConfig = customFieldsConfig;
    }
    if (visible_price_breaks !== undefined) {
      config_data.visible_price_breaks = visible_price_breaks;
    }
    if (hideAllFieldLabels !== undefined) {
      config_data.hideAllFieldLabels = hideAllFieldLabels;
    }
    if (layoutStyle !== undefined) {
      config_data.layoutStyle = layoutStyle;
    }
    if (splitLeftCategory !== undefined) {
      config_data.splitLeftCategory = splitLeftCategory;
    }
    if (splitLeftTitle !== undefined) {
      config_data.splitLeftTitle = splitLeftTitle;
    }
    if (splitLeftCustomFields !== undefined) {
      config_data.splitLeftCustomFields = splitLeftCustomFields;
    }
    if (splitLeftPriceBreaks !== undefined) {
      config_data.splitLeftPriceBreaks = splitLeftPriceBreaks;
    }
    if (splitRightCategory !== undefined) {
      config_data.splitRightCategory = splitRightCategory;
    }
    if (splitRightTitle !== undefined) {
      config_data.splitRightTitle = splitRightTitle;
    }
    if (splitRightCustomFields !== undefined) {
      config_data.splitRightCustomFields = splitRightCustomFields;
    }
    if (splitRightPriceBreaks !== undefined) {
      config_data.splitRightPriceBreaks = splitRightPriceBreaks;
    }
    if (enableCarousel !== undefined) {
      config_data.enableCarousel = enableCarousel;
    }
    if (carouselInterval !== undefined) {
      config_data.carouselInterval = carouselInterval;
    }

    const { data, error } = await supabase
      .from('tv_menus')
      .update({
        name,
        description: description || null,
        theme,
        display_mode: display_mode || 'dense',
        config_data
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
