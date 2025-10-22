import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('field_groups')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error loading field groups:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      field_groups: data || [] 
    });
  } catch (error: any) {
    console.error('Error in field groups API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const supabase = getServiceSupabase();
    
    if (action === 'create') {
      const { name, slug, description, fields } = data;
      
      if (!name || !fields || fields.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Name and fields are required'
        }, { status: 400 });
      }
      
      const { data: fieldGroup, error } = await supabase
        .from('field_groups')
        .insert({
          name,
          slug,
          description,
          fields,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating field group:', error);
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        field_group: fieldGroup,
        message: `Field group ${name} created successfully`
      });
    }
    
    if (action === 'delete') {
      const { field_group_id } = data;
      
      if (!field_group_id) {
        return NextResponse.json({
          success: false,
          error: 'field_group_id is required'
        }, { status: 400 });
      }
      
      const { error } = await supabase
        .from('field_groups')
        .delete()
        .eq('id', field_group_id);
      
      if (error) {
        console.error('Error deleting field group:', error);
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Field group deleted successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error in field groups API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

