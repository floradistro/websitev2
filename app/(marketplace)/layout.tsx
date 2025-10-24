"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import PullToRefresh from '@/components/PullToRefresh';
import { AuthProvider } from "@/context/AuthContext";
import { VendorAuthProvider } from "@/context/VendorAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { LoyaltyProvider } from "@/context/LoyaltyContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <VendorAuthProvider>
        <AdminAuthProvider>
          <LoyaltyProvider>
            <WishlistProvider>
              <CartProvider>
                <PullToRefresh />
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <ScrollToTop />
              </CartProvider>
            </WishlistProvider>
          </LoyaltyProvider>
        </AdminAuthProvider>
      </VendorAuthProvider>
    </AuthProvider>
  );
}

