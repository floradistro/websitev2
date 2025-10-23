import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Submit wholesale application
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    
    const {
      customerId,
      businessName,
      businessType,
      businessAddress,
      licenseNumber,
      licenseExpiry,
      licenseDocumentUrl,
      taxId,
      resaleCertificateUrl,
      contactPerson,
      contactPhone,
      contactEmail
    } = body;
    
    // Validate required fields
    if (!customerId || !businessName || !licenseNumber || !licenseExpiry || !taxId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if customer already has an application
    const { data: existing, error: checkError } = await supabase
      .from('wholesale_applications')
      .select('id, status')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'under_review', 'approved'])
      .single();
    
    if (existing) {
      return NextResponse.json(
        { 
          error: 'Application already exists', 
          status: existing.status 
        },
        { status: 400 }
      );
    }
    
    // Create new application
    const { data: application, error: insertError } = await supabase
      .from('wholesale_applications')
      .insert({
        customer_id: customerId,
        business_name: businessName,
        business_type: businessType,
        business_address: businessAddress,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        license_document_url: licenseDocumentUrl,
        tax_id: taxId,
        resale_certificate_url: resaleCertificateUrl,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Insert application error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create application', details: insertError.message },
        { status: 500 }
      );
    }
    
    // Update customer application status
    await supabase
      .from('customers')
      .update({ wholesale_application_status: 'pending' })
      .eq('id', customerId);
    
    return NextResponse.json({
      success: true,
      application
    });
    
  } catch (error: any) {
    console.error('Submit wholesale application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get wholesale applications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    
    let query = supabase
      .from('wholesale_applications')
      .select(`
        *,
        customer:customers(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data: applications, error } = await query;
    
    if (error) {
      console.error('Get applications error:', error);
      return NextResponse.json(
        { error: 'Failed to get applications', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ applications });
    
  } catch (error: any) {
    console.error('Get wholesale applications error:', error);
    return NextResponse.json(
      { error: 'Failed to get applications', details: error.message },
      { status: 500 }
    );
  }
}

