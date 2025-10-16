import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="bg-[#1a1a1a] min-h-screen">
      <section className="relative min-h-[80vh] flex items-center justify-center text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto mb-8 text-white/20" strokeWidth={1} />
          <h1 className="text-6xl md:text-8xl font-light mb-6">404</h1>
          <h2 className="text-2xl md:text-4xl font-light mb-6">Product Not Found</h2>
          <p className="text-base text-white/50 mb-12 max-w-md mx-auto">
            The product you're looking for doesn't exist or has been removed from our inventory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-black border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-all font-medium"
            >
              Browse Products
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/5 transition-all font-medium"
            >
              Go Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

