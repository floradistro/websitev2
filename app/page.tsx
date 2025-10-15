import { getBestSellingProducts, getCategories, getLocations } from "@/lib/wordpress";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, Truck, Zap } from "lucide-react";
import AnimatedCategories from "@/components/AnimatedCategories";
import DarkFloralHero from "@/components/DarkFloralHero";
import GrowRoomAnimation from "@/components/GrowRoomAnimation";
import DeliveryAnimation from "@/components/DeliveryAnimation";

export default async function Home() {
  const products = await getBestSellingProducts({ per_page: 8 });
  const categories = await getCategories({ per_page: 10, hide_empty: true });
  const locations = await getLocations();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[65vh] flex items-center justify-center bg-black text-white overflow-hidden">
        {/* Animated floral background */}
        <DarkFloralHero />

        {/* Main content */}
        <div className="relative z-20 text-center px-4 md:px-6 max-w-5xl mx-auto">
          <h1 className="logo-font text-6xl md:text-8xl lg:text-9xl font-normal uppercase tracking-tight mb-6 leading-none animate-fadeIn premium-text">
            Flora Distro
          </h1>
          
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto my-8 animate-scaleIn"></div>
          
          <p className="text-lg md:text-xl font-light text-white/60 mb-12 tracking-wide animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Premium cannabis distribution
          </p>

          <Link
            href="/products"
            className="inline-flex items-center space-x-3 bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium animate-fadeIn"
            style={{ animationDelay: '0.4s' }}
          >
            <span>Shop</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        </div>
      </section>

      {/* Featured Categories */}
      <AnimatedCategories categories={categories} />

      {/* Best Selling Products */}
      <section className="bg-[#b5b5b2] py-16">
        <div className="flex justify-between items-center mb-12 px-3 md:px-4">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider">
            Best Selling Products
          </h2>
          <Link
            href="/products"
            className="text-xs md:text-sm uppercase tracking-wider hover:opacity-60 transition-opacity flex items-center space-x-2"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-px scrollbar-hide" style={{ cursor: 'grab' }}>
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group block flex-shrink-0 w-[45vw] md:w-[30vw] lg:w-[23vw] xl:w-[18vw]"
            >
              <div className="relative aspect-[4/5] mb-3 overflow-hidden bg-[#8a8a87] shadow-sm hover:shadow-md transition-all duration-300">
                {product.images?.[0] ? (
                  <>
                    <img
                      src={product.images[0].src}
                      alt={product.name}
                      className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8 bg-[#b5b5b2]">
                    <img
                      src="/logoprint.png"
                      alt="Flora Distro"
                      className="w-full h-full object-contain opacity-40 transition-opacity duration-300 group-hover:opacity-60"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-1 px-2 md:px-3">
                <h3 className="text-xs md:text-sm leading-tight line-clamp-2 font-light group-hover:opacity-60 transition-opacity duration-200">
                  {product.name}
                </h3>
                <p className="text-xs md:text-sm font-light">
                  ${product.price ? parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Distro Pricing Philosophy */}
      <section className="bg-black text-white py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light mb-3 animate-fadeIn leading-tight">
            Real game. Real prices.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 mb-12 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Straight from our facilities and partner farmers we trust. Fresh every time.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xs font-light mb-1.5 text-white/90 uppercase tracking-wider">
                Volume = Respect
              </h3>
              <p className="text-xs font-light text-white/50 leading-relaxed">
                1g to 28g. The more you buy, the better the ticket.
              </p>
            </div>
            
            <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xs font-light mb-1.5 text-white/90 uppercase tracking-wider">
                Cut The Middleman
              </h3>
              <p className="text-xs font-light text-white/50 leading-relaxed">
                Direct from our grow. No broker tax. Just clean business.
              </p>
            </div>

            <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xs font-light mb-1.5 text-white/90 uppercase tracking-wider">
                Always Fresh
              </h3>
              <p className="text-xs font-light text-white/50 leading-relaxed">
                No dry product, no old stock. Terps stay loud.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mb-8 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs font-light text-white/60 max-w-2xl mx-auto leading-relaxed">
              Personal amounts to shop volume—every tier gets you better pricing. Need serious weight? Apply for wholesale access and unlock true bulk pricing on pounds and up. Quality stays consistent, price scales with volume.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/products"
              className="inline-flex items-center space-x-3 bg-white text-black px-7 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
            >
              <span>See Pricing</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-3 bg-transparent border border-white/20 text-white px-7 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-medium"
            >
              <span>Wholesale Access</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="bg-[#b5b5b2] py-16">
        <div className="flex justify-between items-center mb-12 px-3 md:px-4">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider">
            Our Locations
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-wider text-black/60">
            {locations.filter((loc: any) => loc.is_active === "1").length} Active Stores
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px md:gap-0.5">
          {locations
            .filter((loc: any) => loc.is_active === "1")
            .map((location: any) => (
              <div
                key={location.id}
                className="group block bg-[#c5c5c2] hover:bg-[#d5d5d2] transition-colors duration-300"
              >
                <div className="relative aspect-[4/5] mb-3 overflow-hidden bg-[#9a9a97] flex items-center justify-center">
                  <MapPin size={48} className="text-white/40 group-hover:text-white/60 transition-colors duration-300" />
                </div>
                <div className="space-y-1 px-2 md:px-3 pb-4">
                  <h3 className="text-xs md:text-sm leading-tight font-light group-hover:opacity-60 transition-opacity duration-200">
                    {location.name}
                  </h3>
                  <p className="text-xs text-black/60 font-light line-clamp-2">
                    {location.address && `${location.address}, ${location.city || ''}, ${location.state || ''}`}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Shipping & Delivery */}
      <section className="bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-black text-white py-24 px-4 md:px-6 relative overflow-hidden">
        <DeliveryAnimation />
        
        {/* Accent lines */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left side - Main content */}
            <div className="animate-fadeIn">
              <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.3em] mb-6 backdrop-blur-sm">
                Shipping
              </div>
              <h2 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
                Fast.<br/>Reliable.<br/>Every day.
              </h2>
              <p className="text-base font-light text-white/60 leading-relaxed mb-8 max-w-md">
                We ship daily at 2PM. Regional orders can arrive next day. No delays, no excuses. Get your product when you need it.
              </p>
              <Link
                href="/shipping"
                className="inline-flex items-center space-x-3 bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
              >
                <span>Shipping Policy</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right side - Info cards */}
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-light mb-1 text-white uppercase tracking-wider">
                      2PM Daily Cutoff
                    </h3>
                    <p className="text-xs font-light text-white/50 leading-relaxed">
                      Order by 2PM EST, ships same day. Weekends are local delivery only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-light mb-1 text-white uppercase tracking-wider">
                      Next-Day Regional
                    </h3>
                    <p className="text-xs font-light text-white/50 leading-relaxed">
                      NC and East Tennessee get next-day delivery. Fresh product, lightning fast.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <Truck size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-light mb-1 text-white uppercase tracking-wider">
                      Tracked & Insured
                    </h3>
                    <p className="text-xs font-light text-white/50 leading-relaxed">
                      Full tracking on every order. Discreet packaging. Insured shipments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Divider */}
      <section className="bg-[#b5b5b2] py-16 px-4 md:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-8 md:gap-12">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-black/20"></div>
            <div className="relative group">
              <div className="absolute inset-0 bg-black/5 blur-2xl scale-150 group-hover:scale-175 transition-transform duration-700"></div>
              <img 
                src="/logoprint.png" 
                alt="Flora Distro" 
                className="h-20 md:h-28 w-auto relative z-10 opacity-90 group-hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
              />
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-black/20"></div>
          </div>
        </div>
      </section>

      {/* Loyalty Program CTA */}
      <section className="bg-gradient-to-br from-[#2d5016] via-[#3a6b1f] to-[#2d5016] text-white py-24 px-4 md:px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.3em] mb-6 backdrop-blur-sm animate-fadeIn">
            Loyalty Program
          </div>
          
          <h2 className="text-4xl md:text-6xl font-light mb-6 animate-fadeIn leading-tight" style={{ animationDelay: '0.1s' }}>
            More discounts.<br/>More perks.<br/>More savings.
          </h2>
          
          <p className="text-lg font-light text-white/80 mb-12 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Create an account and unlock exclusive pricing, early access to drops, and member-only deals.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 animate-fadeIn hover:bg-white/10 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-light mb-2">10%</div>
              <p className="text-xs text-white/70 uppercase tracking-wider">First Order</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 animate-fadeIn hover:bg-white/10 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl font-light mb-2">24h</div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Early Access</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 animate-fadeIn hover:bg-white/10 transition-all duration-300" style={{ animationDelay: '0.5s' }}>
              <div className="text-4xl font-light mb-2">∞</div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Exclusive Pricing</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <Link
              href="/register"
              className="inline-flex items-center space-x-3 bg-white text-[#2d5016] px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium shadow-lg"
            >
              <span>Create Account</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center space-x-3 bg-transparent border-2 border-white/30 text-white px-10 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-medium"
            >
              <span>Learn More</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <p className="text-xs text-white/50 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-white/80 underline hover:no-underline">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-black text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light tracking-wider uppercase mb-3">
            Stay Updated
          </h2>
          <p className="text-sm text-[#aaa] mb-6 max-w-md mx-auto">
            Get notified about new drops, restocks, and exclusive offers.
          </p>
          <form className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 text-sm bg-white text-black focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white text-black px-6 py-3 text-xs uppercase tracking-wider hover:bg-[#ddd] transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
