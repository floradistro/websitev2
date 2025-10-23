import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    featured_image: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
        <Image
          src={product.featured_image || '/placeholder.jpg'}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="text-sm font-medium mb-1">{product.name}</h3>
      <p className="text-gray-600 text-sm">${product.price?.toFixed(2)}</p>
    </Link>
  );
}

