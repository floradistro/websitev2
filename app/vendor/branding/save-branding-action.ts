"use server";

import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export async function saveBranding(formData: FormData) {
  try {
    const authToken = formData.get('authToken') as string;
    const vendorUserId = formData.get('vendorUserId') as string;
    
    if (!authToken || !vendorUserId) {
      return { success: false, error: 'Missing authentication data' };
    }
    
    const brandingData: any = {};
    
    // Extract all branding fields
    const fields = ['tagline', 'about', 'primary_color', 'accent_color', 'custom_font', 'website', 'instagram', 'facebook', 'logo_url'];
    
    fields.forEach(field => {
      const value = formData.get(field);
      if (value) {
        brandingData[field] = value;
      }
    });
    
    // Update using WooCommerce Customer API (meta_data approach)
    const metaData = Object.keys(brandingData).map(key => ({
      key: `vendor_${key}`,
      value: brandingData[key]
    }));
    
    await axios.put(
      `${baseUrl}/wp-json/wc/v3/customers/${vendorUserId}`,
      { meta_data: metaData },
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        }
      }
    );
    
    // Also update vendor table directly using WooCommerce API with vendor_ prefixed meta
    const vendorId = formData.get('vendorId');
    if (vendorId) {
      // Update flora_vendors table via direct DB access
      await axios.get(
        `${baseUrl}/wp-json/flora-im/v1/update-vendor-branding`,
        {
          params: {
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            vendor_id: vendorId,
            ...brandingData
          }
        }
      ).catch(() => {
        // Fallback - customer meta_data is already saved
      });
    }
    
    return { success: true, message: 'Branding updated successfully' };
  } catch (error: any) {
    console.error('Branding save error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to save branding' 
    };
  }
}

