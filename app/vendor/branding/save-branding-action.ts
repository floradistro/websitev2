"use server";

export async function saveBranding(formData: FormData) {
  const authToken = formData.get('authToken') as string;
  
  const brandingData = {
    tagline: formData.get('tagline'),
    about: formData.get('about'),
    primary_color: formData.get('primary_color'),
    accent_color: formData.get('accent_color'),
    custom_font: formData.get('custom_font'),
    website: formData.get('website'),
    instagram: formData.get('instagram'),
    facebook: formData.get('facebook'),
    logo_url: formData.get('logo_url')
  };

  const response = await fetch('https://api.floradistro.com/wp-json/flora-vendors/v1/vendors/me/branding', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authToken}`
    },
    body: JSON.stringify(brandingData),
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Save failed' }));
    return { success: false, error: error.message };
  }

  const result = await response.json();
  return { success: true, data: result };
}

