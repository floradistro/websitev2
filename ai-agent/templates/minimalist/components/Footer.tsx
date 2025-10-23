import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/shop">All Products</Link></li>
              <li><Link href="/shop/flower">Flower</Link></li>
              <li><Link href="/shop/edibles">Edibles</Link></li>
              <li><Link href="/shop/concentrates">Concentrates</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/careers">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/shipping">Shipping</Link></li>
              <li><Link href="/returns">Returns</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          © 2025 Storefront. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

