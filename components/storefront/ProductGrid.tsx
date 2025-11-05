import ProductCard from './StorefrontProductCard'; // Use storefront ProductCard component

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: any[];
  price?: number;
  fields?: { [key: string]: any };
  pricingTiers?: any[];
  inventory?: any[];
  stock_status?: string;
  stock_quantity?: number;
  total_stock?: number;
  slug?: string;
  categories?: any[];
  vendor_id?: string;
}

interface ProductGridProps {
  products: Product[];
  locations: any[];
}

export function ProductGrid({ products, locations }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 text-lg font-light">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-4 px-1 sm:px-0 pt-8">
      {products.map((product, index) => {
        // Map product to format expected by main ProductCard
        const imageUrl = product.images?.[0] || (product as any).featured_image_storage;
        
        const mappedProduct = {
          id: product.id,
          uuid: product.id,
          name: product.name,
          slug: product.slug || product.id,
          price: product.price || 0,
          images: imageUrl ? [{ src: imageUrl, id: 0, name: product.name }] : [],
          stock_status: product.stock_status || 'instock',
          stock_quantity: product.stock_quantity || 0,
          total_stock: product.total_stock || 0,
          inventory: product.inventory || [],
          categories: product.categories || [],
        };

        return (
          <ProductCard 
            key={product.id} 
            product={mappedProduct}
            locations={locations}
          />
        );
      })}
    </div>
  );
}

