import { getVendorFromHeaders } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { ProductDetail } from '@/components/storefront/ProductDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const vendorId = await getVendorFromHeaders();
  const { slug } = await params;

  if (!vendorId) {
    notFound();
  }

  const supabase = getServiceSupabase();

  // Try to find product by slug first, then by ID
  let product = null;
  
  const { data: productBySlug } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (productBySlug) {
    product = productBySlug;
  } else {
    const { data: productById } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('id', slug)
      .eq('status', 'published')
      .single();
    
    product = productById;
  }

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

