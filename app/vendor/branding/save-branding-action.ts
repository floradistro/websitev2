"use server";

import { updateVendorBranding } from '@/lib/wordpress';

export async function saveBranding(formData: FormData) {
  try {
    const brandingData: any = {};
    
    // Extract all branding fields
    const fields = ['tagline', 'about', 'primary_color', 'accent_color', 'custom_font', 'website', 'instagram', 'facebook', 'logo_url'];
    
    fields.forEach(field => {
      const value = formData.get(field);
      if (value) {
        brandingData[field] = value;
      }
    });
    
    // Call the updateVendorBranding function which uses WooCommerce customer API
    const result = await updateVendorBranding(brandingData);
    
    if (result.success) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result.message || 'Save failed' };
    }
  } catch (error: any) {
    console.error('Branding save error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to save branding' 
    };
  }
}

