import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-light mb-2 tracking-tight">
          Premium Products
        </h1>
        <p className="text-gray-600 mb-12">
          Curated selection of quality cannabis
        </p>
        <ProductGrid />
      </main>
      <Footer />
    </>
  );
}

