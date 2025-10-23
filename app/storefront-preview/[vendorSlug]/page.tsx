import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    vendorSlug: string;
  }>;
}

export default async function StorefrontPreviewPage({ params }: PageProps) {
  const { vendorSlug } = await params;
  
  const supabase = getServiceSupabase();
  
  // Get vendor by slug
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, slug')
    .eq('slug', vendorSlug)
    .single();
  
  if (!vendor) {
    notFound();
  }
  
  // Redirect to storefront route with vendor ID in header
  // This simulates what the middleware does
  const url = `/storefront?preview=true&vendorId=${vendor.id}`;
  redirect(url);
}

