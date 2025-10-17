import { getBestSellingProducts, getCategories, getLocations, getAllInventory, getPricingRules } from "@/lib/wordpress";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load heavy carousel components
const LuxuryHero = dynamic(() => import("@/components/LuxuryHero"), {
  ssr: true,
});

const ProductsCarousel = dynamic(() => import("@/components/ProductsCarousel"), {
  ssr: true,
  loading: () => (
    <div className="flex gap-4 px-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[300px] h-[400px] bg-[#3a3a3a]" />
      ))}
    </div>
  ),
});

const CategoriesCarousel = dynamic(() => import("@/components/CategoriesCarousel"), {
  ssr: true,
});

const LocationsCarousel = dynamic(() => import("@/components/LocationsCarousel"), {
  ssr: true,
});

// Enable dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function Home() {
  // Optimized: Fetch only necessary data in parallel
  const [products, categories, locations, pricingRules] = await Promise.all([
    getBestSellingProducts({ per_page: 12 }),
    getCategories({ per_page: 10, hide_empty: true }),
    getLocations(),
    getPricingRules(),
  ]);

  // Get inventory only for the products we're displaying (not all products)
  const productIds = products.map((p: any) => p.id);
  const allInventory = await getAllInventory();
  
  // Filter inventory to only products on homepage
  const relevantInventory = allInventory.filter((inv: any) => 
    productIds.includes(parseInt(inv.product_id))
  );

  // Create inventory map from filtered inventory data
  const inventoryMap: { [key: number]: any[] } = {};
  
  relevantInventory.forEach((inv: any) => {
    const productId = parseInt(inv.product_id);
    if (!inventoryMap[productId]) {
      inventoryMap[productId] = [];
    }
    inventoryMap[productId].push(inv);
  });

  // Helper function to check if product has stock at ANY location
  const hasStockAnywhere = (productId: number): boolean => {
    const inventory = inventoryMap[productId] || [];
    return inventory.some((inv: any) => {
      const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
      const status = inv.status?.toLowerCase();
      return qty > 0 || status === 'instock' || status === 'in_stock';
    });
  };

  // Filter products to only show those with stock at any location
  const inStockProducts = products.filter((product: any) => hasStockAnywhere(product.id));

  // Extract fields from product metadata (only for in-stock products)
  const productFieldsMap: { [key: number]: any } = {};
  
  inStockProducts.forEach((product: any) => {
    const metaData = product.meta_data || [];
    const fields: { [key: string]: string } = {};
    
    const fieldKeys = [
      'strain_type',
      'thca_%',
      'thca_percentage', 
      'thc_%',
      'thc_percentage',
      'lineage',
      'nose',
      'terpene',
      'terpenes',
      'effects',
      'effect',
      'mg_per_pack',
      'mg_per_piece',
      'ingredients',
      'type'
    ];
    
    metaData.forEach((meta: any) => {
      const key = meta.key?.toLowerCase();
      if (fieldKeys.some(fk => fk === key)) {
        fields[key] = meta.value;
      }
    });
    
    let blueprintName = null;
    const blueprintMeta = metaData.find((m: any) => 
      m.key && (m.key.includes('blueprint') || m.key === '_blueprint')
    );
    
    if (blueprintMeta) {
      blueprintName = blueprintMeta.value;
    }
    
    if (!blueprintName && product.categories && product.categories.length > 0) {
      const categoryName = product.categories[0].slug;
      if (categoryName.includes('flower') || categoryName.includes('pre-roll')) {
        blueprintName = 'flower_blueprint';
      } else if (categoryName.includes('concentrate')) {
        blueprintName = 'concentrate_blueprint';
      } else if (categoryName.includes('edible')) {
        blueprintName = 'edible_blueprint';
      } else if (categoryName.includes('vape')) {
        blueprintName = 'vape_blueprint';
      }
    }
    
    productFieldsMap[product.id] = { fields, blueprintName };
  });

  return (
    <div className="bg-[#2a2a2a]">
      {/* Hero Section - Animated Luxury */}
      <LuxuryHero />

      {/* Featured Products - Carousel */}
      <section className="bg-[#2a2a2a] py-12 sm:py-16">
        <div className="px-4 sm:px-6 mb-8 sm:mb-12">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Featured Products
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
            <Link
              href="/products"
              className="text-[11px] sm:text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
            >
              <span>View All</span>
              <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>

        <ProductsCarousel 
          products={inStockProducts}
          locations={locations}
          pricingRules={pricingRules}
          productFieldsMap={productFieldsMap}
          inventoryMap={inventoryMap}
        />
      </section>

      {/* Categories - Carousel */}
      <section className="bg-[#3a3a3a] py-12 sm:py-16">
        <div className="px-4 sm:px-6 mb-8 sm:mb-12">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Shop by Category
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
          </div>
        </div>

        <CategoriesCarousel categories={categories} />
      </section>

      {/* Philosophy - Clean Statement */}
      <section className="bg-[#1a1a1a] py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Accent line */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            Real game.<br/>Real prices.
          </h2>
          
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8 sm:mb-12"></div>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/50 mb-12 sm:mb-16 md:mb-20 leading-relaxed max-w-2xl mx-auto">
            Straight from our facilities and partner farmers we trust. Fresh every time.
          </p>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* Volume Pricing Card */}
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-white/20 rounded-full flex items-center justify-center group-hover:border-white/40 transition-colors duration-500">
                  <div className="text-lg sm:text-xl text-white/80">1</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Volume Pricing
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/50 leading-relaxed">
                  The more you buy, the better the price.
                </p>
              </div>
            </div>
            
            {/* Direct Source Card */}
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-white/20 rounded-full flex items-center justify-center group-hover:border-white/40 transition-colors duration-500">
                  <div className="text-lg sm:text-xl text-white/80">2</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Direct Source
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/50 leading-relaxed">
                  No middleman. Just clean business.
                </p>
              </div>
            </div>

            {/* Always Fresh Card */}
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-white/20 rounded-full flex items-center justify-center group-hover:border-white/40 transition-colors duration-500">
                  <div className="text-lg sm:text-xl text-white/80">3</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Always Fresh
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/50 leading-relaxed">
                  No dry product, no old stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations - Carousel */}
      <section className="bg-[#2a2a2a] py-12 sm:py-16">
        <div className="px-4 sm:px-6 mb-8 sm:mb-12">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Our Locations
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/50 whitespace-nowrap flex-shrink-0">
              {locations.filter((loc: any) => {
                const isActive = loc.is_active === "1";
                const isAllowed = !['hamas', 'warehouse'].includes(loc.name.toLowerCase());
                return isActive && isAllowed;
              }).length} Stores
            </p>
          </div>
        </div>

        <LocationsCarousel locations={locations} />
      </section>

      {/* Shipping - Split Layout */}
      <section className="bg-[#3a3a3a] py-0">
        <div className="grid md:grid-cols-2">
          {/* Left - Content */}
          <div className="flex items-center px-4 sm:px-6 md:px-12 py-16 sm:py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 w-full">
              <div className="mb-6 sm:mb-8">
                <div className="inline-block px-3 sm:px-4 py-1.5 bg-white/5 border border-white/10 text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/60 mb-6 sm:mb-8">
                  Shipping
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 sm:mb-6 leading-tight">
                  Fast. Reliable.<br/>Every day.
                </h2>
                <p className="text-sm sm:text-base font-light text-white/50 mb-8 sm:mb-12 leading-relaxed">
                  We ship daily at 2PM. Regional orders arrive next day.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">2PM Cutoff</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">Order by 2PM EST, ships same day</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">Next-Day Delivery</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">NC and East Tennessee</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">Fully Tracked</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">Track every order in real-time</p>
                  </div>
                </div>
              </div>

              <Link
                href="/shipping"
                className="group inline-flex items-center gap-2 sm:gap-3 text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:text-white/80 transition-colors duration-300"
              >
                <span>View Shipping Policy</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative bg-gradient-to-br from-[#2a2a2a] via-[#252525] to-[#1f1f1f] min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float-delayed"></div>
            </div>

            {/* Animated grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
                animation: "slideDown 20s linear infinite"
              }} />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
              <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDuration: "4s" }}></div>
              <div className="absolute top-[60%] left-[25%] w-1.5 h-1.5 bg-white/15 rounded-full animate-float-delayed" style={{ animationDuration: "5s" }}></div>
              <div className="absolute top-[40%] right-[20%] w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDuration: "6s" }}></div>
              <div className="absolute top-[75%] right-[30%] w-1 h-1 bg-white/15 rounded-full animate-float-delayed" style={{ animationDuration: "7s" }}></div>
              <div className="absolute top-[30%] left-[70%] w-1.5 h-1.5 bg-white/10 rounded-full animate-float" style={{ animationDuration: "5.5s" }}></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center">
              {/* Animated rings around icon */}
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 border border-white/10 rounded-full animate-ping" style={{ animationDuration: "3s" }}></div>
                <div className="absolute inset-0 border border-white/10 rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }}></div>
                
                {/* Main icon container */}
                <div className="absolute inset-0 border-2 border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/5">
                  {/* Animated truck */}
                  <div className="relative">
                    <svg className="w-20 h-20 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    {/* Speed lines */}
                    <div className="absolute top-1/2 -left-8 -translate-y-1/2 space-y-1 opacity-30">
                      <div className="h-[1px] w-4 bg-white/40 animate-pulse"></div>
                      <div className="h-[1px] w-3 bg-white/30 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                      <div className="h-[1px] w-2 bg-white/20 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text with fade animation */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-light">Daily shipping from North Carolina</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20"></div>
                  <p className="text-sm tracking-[0.25em] text-white/60 font-medium">2PM EST</p>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Mark */}
      <section className="bg-[#1a1a1a] py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <img 
              src="/logoprint.png" 
              alt="Flora Distro" 
              className="h-16 sm:h-20 md:h-24 w-auto opacity-30 grayscale"
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Dramatic */}
      <section className="bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#2a2a2a] py-20 sm:py-28 md:py-40 px-4 sm:px-6 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] bg-white/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-white/5 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        {/* Scan line effect */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-[200px] animate-scan"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-light text-white mb-6 sm:mb-8 leading-none tracking-tight">
              Get started
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-white/40 max-w-2xl mx-auto leading-relaxed">
              Unlock volume pricing and exclusive access
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Link
              href="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-black px-10 sm:px-12 md:px-16 py-3.5 sm:py-4 md:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] hover:bg-white/90 transition-all duration-300 font-medium"
            >
              <span>Create Account</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-transparent border border-white/30 text-white px-10 sm:px-12 md:px-16 py-3.5 sm:py-4 md:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] hover:bg-white/5 hover:border-white/50 transition-all duration-300 font-medium"
            >
              <span>Sign In</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          <div className="text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/30">
              Or browse as guest
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
