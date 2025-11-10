/**
 * Image Helper - Supabase Storage
 */

export function getProductImage(product: any): string | null {
  // Supabase Storage
  return (
    product.featured_image_storage ||
    (product.image_gallery_storage && product.image_gallery_storage[0]) ||
    null
  );
}

export function getProductGallery(product: any): string[] {
  const images: string[] = [];

  // Add featured image first
  const featured = getProductImage(product);
  if (featured) images.push(featured);

  // Add gallery images (prefer Supabase Storage)
  const gallery = product.image_gallery_storage || product.image_gallery || [];
  gallery.forEach((img: string) => {
    if (img && !images.includes(img)) {
      images.push(img);
    }
  });

  return images;
}

export function getVendorLogo(vendor: any): string | null {
  // Supabase Storage → Default
  return vendor.logo_url || "/yacht-club-logo.png";
}

export function getVendorBanner(vendor: any): string | null {
  return vendor.banner_url || null;
}

export function getCategoryImage(category: any): string | null {
  return category.image_url || null;
}
