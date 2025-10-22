"use client";

import { useEffect, useState } from "react";
import ProductsClient from "@/components/ProductsClient";
import axios from "axios";

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [categoriesRes, locationsRes, productsRes, vendorsRes] = await Promise.all([
          axios.get('/api/supabase/categories'),
          axios.get('/api/supabase/locations'),
          axios.get('/api/supabase/products?per_page=200'),
          axios.get('/api/admin/vendors')
        ]);
        
        const apiProducts = productsRes.data.products || [];
        
        // Map to component format
        const mappedProducts = apiProducts.map((p: any) => {
          const imageUrl = p.featured_image_storage || 
                          (p.image_gallery_storage && p.image_gallery_storage[0]);
          
          const vendor = vendorsRes.data.vendors?.find((v: any) => v.id === p.vendor_id);
          
          // Extract blueprint fields
          const fields: { [key: string]: string } = {};
          (p.blueprint_fields || []).forEach((field: any) => {
            if (field && field.key && field.value) {
              const keyName = field.key.replace(/^_field_|^_/, '');
              fields[keyName] = field.value;
            }
          });
          
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
            stock_quantity: p.stock_quantity,
            stock_status: p.stock_status,
            inventory: p.inventory || [],
            total_stock: p.stock_quantity,
            pricingTiers: p.pricing_tiers || [],
            fields: fields,
            vendorId: p.vendor_id,
            vendorSlug: vendor?.slug || '',
            vendor: vendor
          };
        });
        
        setProducts(mappedProducts);
        setCategories(categoriesRes.data.categories || []);
        setLocations(locationsRes.data.locations || []);
        setVendors(vendorsRes.data.vendors?.filter((v: any) => v.status === 'active').map((v: any) => ({
          id: v.id,
          name: v.store_name,
          slug: v.slug,
          logo: v.logo_url || '/yacht-club-logo.png'
        })) || []);
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading products...</div>
      </div>
    );
  }

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      vendorProducts={products}
      vendors={vendors}
    />
  );
}
