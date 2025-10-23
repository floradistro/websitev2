import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  images: any[];
  retail_price: number;
  category: string;
  status: string;
  slug: string;
  meta_data?: any;
  blueprint_fields?: any[];
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 text-lg font-light">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px">
      {products.map((product, index) => {
        // Extract pricing tiers from meta_data
        const pricingTiers = product.meta_data?._product_price_tiers || [];
        
        // Extract product fields from blueprint_fields
        const productFields = product.blueprint_fields ? {
          fields: product.blueprint_fields.reduce((acc: any, field: any) => {
            if (field && field.field_name && field.field_value) {
              acc[field.field_name] = field.field_value;
            }
            return acc;
          }, {})
        } : undefined;

        return (
          <ProductCard 
            key={product.id} 
            product={product}
            index={index}
            pricingTiers={pricingTiers}
            productFields={productFields}
          />
        );
      })}
    </div>
  );
}

