import Link from 'next/link';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  retail_price: number;
  category: string;
  status: string;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

