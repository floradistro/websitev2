/**
 * TV Display V2 - Complete Rewrite
 * Matches POS theme, renders menus properly, optimized performance
 */

'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { getTheme } from '@/lib/themes';
import { calculatePrice, calculateTierPrices, type Promotion } from '@/lib/pricing';

interface TVDisplayContentProps {}

function TVDisplayContent() {
  const searchParams = useSearchParams();

  // URL Parameters
  const vendorId = searchParams.get('vendor_id');
  const locationId = searchParams.get('location_id');
  const tvNumberParam = searchParams.get('tv_number');
  const tvNumber = tvNumberParam && tvNumberParam !== '' ? tvNumberParam : '1';
  const menuIdParam = searchParams.get('menu_id');
  const isPreview = searchParams.get('preview') === 'true'; // Skip registration for iframe previews

  // State
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [carouselPage, setCarouselPage] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  /**
   * Device Registration
   */
  useEffect(() => {
    // Skip device registration in preview mode (dashboard iframes)
    if (isPreview) {
      console.log('👁️ Preview mode - skipping device registration');
      setConnectionStatus('online'); // Show as online for preview
      return;
    }

    if (!vendorId) {
      setError('Missing vendor_id');
      setLoading(false);
      return;
    }

    if (!tvNumber || tvNumber === 'null' || tvNumber === 'undefined') {
      setError('Missing or invalid tv_number');
      setLoading(false);
      return;
    }

    const registerDevice = async () => {
      try {
        const tvNum = parseInt(tvNumber, 10);
        if (isNaN(tvNum) || tvNum < 1) {
          throw new Error(`Invalid tv_number: ${tvNumber}`);
        }

        // Check if device already exists with this vendor_id + tv_number
        // Note: unique constraint is (vendor_id, tv_number) - location doesn't matter
        const { data: existingDevices } = await supabase
          .from('tv_devices')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('tv_number', tvNum);

        if (existingDevices && existingDevices.length > 0) {
          // Device exists, just update its status
          const existing = existingDevices[0];

          const { data: device, error } = await supabase
            .from('tv_devices')
            .update({
              connection_status: 'online',
              location_id: locationId || null, // Update location if URL specifies a different one
              last_seen_at: new Date().toISOString(),
              last_heartbeat_at: new Date().toISOString(),
              user_agent: navigator.userAgent,
              screen_resolution: `${window.screen.width}x${window.screen.height}`,
              browser_info: {
                platform: navigator.platform,
                language: navigator.language
              }
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw new Error(error.message || JSON.stringify(error));

          setDeviceId(device.id);
          setConnectionStatus('online');
          console.log('✅ Device reconnected:', device.id);
        } else {
          // New device, create it
          const deviceData: any = {
            device_identifier: crypto.randomUUID(),
            vendor_id: vendorId,
            location_id: locationId || null,
            tv_number: tvNum,
            device_name: `TV ${tvNum}`,
            connection_status: 'online',
            last_seen_at: new Date().toISOString(),
            last_heartbeat_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            browser_info: {
              platform: navigator.platform,
              language: navigator.language
            }
          };

          const { data: device, error } = await supabase
            .from('tv_devices')
            .insert(deviceData)
            .select()
            .single();

          if (error) {
            // If duplicate key error, device was created between check and insert - just fetch it
            if (error.message?.includes('duplicate key')) {
              console.log('⚠️ Device already exists, fetching...');
              const { data: existingDevice } = await supabase
                .from('tv_devices')
                .select('*')
                .eq('vendor_id', vendorId)
                .eq('tv_number', tvNum)
                .single();

              if (existingDevice) {
                setDeviceId(existingDevice.id);
                setConnectionStatus('online');
                console.log('✅ Device reconnected (after race condition):', existingDevice.id);
                return;
              }
            }
            throw new Error(error.message || JSON.stringify(error));
          }
          if (!device) throw new Error('Device registration returned no data');

          setDeviceId(device.id);
          setConnectionStatus('online');
          console.log('✅ Device registered:', device.id);
        }
      } catch (err: any) {
        console.error('❌ Device registration failed:', err);
        setConnectionStatus('error');
        setError(err.message || 'Device registration failed');
      }
    };

    registerDevice();

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      if (deviceId) {
        await supabase
          .from('tv_devices')
          .update({
            last_heartbeat_at: new Date().toISOString(),
            connection_status: 'online'
          })
          .eq('id', deviceId);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [vendorId, locationId, tvNumber, deviceId, isPreview]);

  /**
   * Load Menu & Products
   */
  const loadMenuAndProducts = useCallback(async () => {
    try {
      // Load vendor info first
      if (vendorId && !vendor) {
        console.log('📦 Loading vendor info:', vendorId);
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, business_name, logo_url')
          .eq('id', vendorId)
          .single();

        if (vendorData) {
          setVendor(vendorData);
          console.log('✅ Vendor loaded:', vendorData.business_name);
        }
      }

      // Preview mode - load specific menu
      if (menuIdParam) {
        console.log('🎬 Preview mode - loading menu:', menuIdParam);
        const { data: menu, error } = await supabase
          .from('tv_menus')
          .select('*')
          .eq('id', menuIdParam)
          .single();

        if (error) throw error;
        if (menu) {
          setActiveMenu(menu);
          await loadProducts(menu);
          setLoading(false);
          return;
        }
      }

      // Load device's active menu
      if (deviceId) {
        const { data: device } = await supabase
          .from('tv_devices')
          .select('active_menu_id')
          .eq('id', deviceId)
          .single();

        if (device?.active_menu_id) {
          console.log('📺 Device has active menu:', device.active_menu_id);
          const { data: menu } = await supabase
            .from('tv_menus')
            .select('*')
            .eq('id', device.active_menu_id)
            .single();

          if (menu) {
            setActiveMenu(menu);
            await loadProducts(menu);
          } else {
            console.log('⚠️ Menu not found, clearing');
            setActiveMenu(null);
            setProducts([]);
          }
        } else {
          console.log('📺 Device has no active menu, clearing');
          setActiveMenu(null);
          setProducts([]);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Failed to load menu:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [deviceId, menuIdParam]);

  /**
   * Load Products for Menu
   */
  const loadProducts = async (menu: any) => {
    if (!vendorId) return;

    try {
      console.log('📦 Loading products for vendor:', vendorId);

      // Load promotions first
      const promosRes = await fetch(`/api/vendor/promotions?vendor_id=${vendorId}`);
      const promosData = await promosRes.json();
      const activePromotions = promosData.success ? (promosData.promotions || []) : [];
      setPromotions(activePromotions);
      console.log('🎉 Loaded promotions:', activePromotions.length);

      // Load products with pricing assignments
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          pricing_assignments:product_pricing_assignments(
            blueprint_id,
            price_overrides,
            is_active,
            blueprint:pricing_tier_blueprints(
              id,
              name,
              slug,
              price_breaks,
              display_unit
            )
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .order('name');

      if (error) throw error;

      // Load vendor pricing configs to get actual prices
      const { data: vendorConfigs, error: configError } = await supabase
        .from('vendor_pricing_configs')
        .select('blueprint_id, pricing_values')
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      if (configError) {
        console.warn('⚠️ Could not load vendor pricing configs:', configError);
      }

      // Create a map of blueprint_id -> pricing_values
      const configMap = new Map(
        (vendorConfigs || []).map((config: any) => [config.blueprint_id, config.pricing_values])
      );

      // Enrich products with actual prices and promotions
      const enrichedProducts = (productData || []).map((product: any) => {
        let productWithPricing = product;

        if (product.pricing_assignments && product.pricing_assignments.length > 0) {
          const assignment = product.pricing_assignments[0]; // Use first active assignment
          const blueprint = assignment.blueprint;
          const vendorPrices = configMap.get(assignment.blueprint_id) || {};

          // Merge vendor prices with product overrides
          const finalPrices = { ...vendorPrices, ...(assignment.price_overrides || {}) };

          productWithPricing = {
            ...product,
            pricing_blueprint: blueprint,
            pricing_tiers: finalPrices
          };
        }

        // Apply promotions if any
        if (activePromotions.length > 0) {
          const priceCalc = calculatePrice(productWithPricing, activePromotions, 1);

          return {
            ...productWithPricing,
            promotion_data: priceCalc.appliedPromotion ? {
              originalPrice: priceCalc.originalPrice,
              finalPrice: priceCalc.finalPrice,
              savings: priceCalc.savings,
              badgeText: priceCalc.badge?.text,
              badgeColor: priceCalc.badge?.color,
            } : null
          };
        }

        return productWithPricing;
      });

      setProducts(enrichedProducts);
      console.log(`✅ Loaded ${enrichedProducts.length} products with pricing`);
      console.log('📊 Sample product pricing:', enrichedProducts[0] ? {
        name: enrichedProducts[0].name,
        has_assignment: !!enrichedProducts[0].pricing_assignments,
        has_blueprint: !!enrichedProducts[0].pricing_blueprint,
        has_tiers: !!enrichedProducts[0].pricing_tiers,
        has_promotion: !!enrichedProducts[0].promotion_data,
        tiers: enrichedProducts[0].pricing_tiers
      } : 'No products');

      // Extract unique categories
      const uniqueCategories = [...new Set(enrichedProducts.map((p: any) => p.category).filter(Boolean))];
      setCategories(uniqueCategories as any[]);
    } catch (err: any) {
      console.error('❌ Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadMenuAndProducts();
  }, [loadMenuAndProducts]);

  /**
   * Real-time subscription for device changes (menu assignment)
   */
  useEffect(() => {
    // Skip real-time subscription in preview mode
    if (isPreview) return;
    if (!deviceId) return;

    console.log('🔴 Setting up real-time subscription for device:', deviceId);

    const channel = supabase
      .channel(`device-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tv_devices',
          filter: `id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('🔴 Device updated:', payload);
          const newMenuId = payload.new.active_menu_id;
          const currentMenuId = activeMenu?.id || null;

          // If menu changed (including to/from null), reload immediately
          if (newMenuId !== currentMenuId) {
            console.log('🔄 INSTANT MENU UPDATE: from', currentMenuId, 'to', newMenuId);
            loadMenuAndProducts();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [deviceId, activeMenu?.id, loadMenuAndProducts, isPreview]);

  /**
   * Real-time subscription for menu changes (theme, name, etc.)
   */
  useEffect(() => {
    if (!activeMenu?.id) return;

    console.log('🎨 Setting up real-time subscription for menu:', activeMenu.id, 'Preview mode:', isPreview);

    const channel = supabase
      .channel(`menu-${activeMenu.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tv_menus',
          filter: `id=eq.${activeMenu.id}`,
        },
        (payload) => {
          console.log('🎨 MENU UPDATED - Theme changed!', payload);
          console.log('   Old theme:', activeMenu.theme);
          console.log('   New theme:', payload.new.theme);

          // Force immediate reload
          setActiveMenu(payload.new);
          loadProducts(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('🎨 Menu subscription status:', status);
      });

    return () => {
      console.log('🎨 Cleaning up menu subscription');
      supabase.removeChannel(channel);
    };
  }, [activeMenu?.id, activeMenu?.theme, isPreview]);

  /**
   * Carousel Auto-Rotation
   * Only runs when display_mode is 'carousel'
   */
  useEffect(() => {
    if (!activeMenu || activeMenu.display_mode !== 'carousel' || products.length === 0) {
      return;
    }

    const productsPerPage = 12;
    const totalPages = Math.ceil(products.length / productsPerPage);

    if (totalPages <= 1) {
      return; // No rotation needed if only one page
    }

    console.log(`🎠 Starting carousel rotation: ${totalPages} pages, ${products.length} products`);

    const interval = setInterval(() => {
      setCarouselPage((prev) => {
        const next = (prev + 1) % totalPages;
        console.log(`🎠 Rotating to page ${next + 1} of ${totalPages}`);
        return next;
      });
    }, 20000); // 20 seconds per page

    return () => {
      console.log('🎠 Cleaning up carousel rotation');
      clearInterval(interval);
    };
  }, [activeMenu, activeMenu?.display_mode, products.length]);

  // Loading State
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading display...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-red-500 text-2xl font-bold mb-2">Display Error</h1>
          <p className="text-white/60 text-lg max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-white/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No Content State
  if (!activeMenu) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          {/* Show vendor logo if available */}
          {vendor?.logo_url ? (
            <div className="mb-8">
              <img
                src={vendor.logo_url}
                alt={vendor.business_name}
                className="mx-auto max-w-md max-h-64 object-contain"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.1))'
                }}
              />
            </div>
          ) : (
            <div className="text-6xl mb-4">📺</div>
          )}
          <h1 className="text-3xl font-bold mb-2">{vendor?.business_name || 'Display Ready'}</h1>
          <p className="text-xl text-white/60">No menu assigned</p>
          <p className="text-sm text-white/40 mt-2">Please assign a menu from the dashboard</p>
          {deviceId && (
            <p className="text-xs text-white/30 mt-6">Device ID: {deviceId.substring(0, 8)}...</p>
          )}
        </div>
      </div>
    );
  }

  // Get theme
  const theme = getTheme(activeMenu.theme);

  // Render Menu
  return (
    <motion.div
      key={theme.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: theme.styles.background,
        backgroundImage: theme.styles.backgroundImage
      }}
    >
      {/* Menu Content */}
      <div className="absolute inset-0 p-12">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="uppercase tracking-[0.15em]"
              style={{
                ...theme.styles.menuTitle,
                lineHeight: 1,
                letterSpacing: '0.15em'
              }}
            >
              {activeMenu.name}
            </h1>
            {activeMenu.description && (
              <p
                className="mt-4 uppercase tracking-wider font-medium"
                style={{
                  ...theme.styles.menuDescription,
                  letterSpacing: '0.1em'
                }}
              >
                {activeMenu.description}
              </p>
            )}
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (() => {
            const displayMode = activeMenu.display_mode || 'dense';
            const isCarousel = displayMode === 'carousel';
            const isDense = displayMode === 'dense';

            // Calculate products to show
            let productsToShow;
            if (isCarousel) {
              const productsPerPage = 12;
              const start = carouselPage * productsPerPage;
              const end = start + productsPerPage;
              productsToShow = products.slice(start, end);
            } else {
              // Dense: show up to 30 products
              productsToShow = products.slice(0, 30);
            }

            // Grid classes based on mode
            const gridClasses = isDense
              ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8';

            // Card padding based on mode
            const cardPadding = isDense ? 'p-4' : 'p-8';

            return (
              <>
                <div className={`${gridClasses} flex-1 content-start`}>
                  {productsToShow.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`rounded-2xl ${cardPadding} flex flex-col justify-between transition-transform hover:scale-[1.02] relative`}
                  style={{
                    background: theme.styles.productCard.background,
                    borderColor: theme.styles.productCard.borderColor,
                    borderWidth: theme.styles.productCard.borderWidth,
                    boxShadow: theme.styles.productCard.shadow,
                    backdropFilter: theme.styles.productCard.backdropBlur ? `blur(${theme.styles.productCard.backdropBlur})` : undefined
                  }}
                >
                  {/* Sale Badge */}
                  {product.promotion_data && product.promotion_data.badgeText && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                      className={`absolute ${isDense ? 'top-2 right-2 px-2 py-1 text-[10px]' : 'top-3 right-3 px-3 py-1.5 text-xs'} rounded-lg font-black uppercase tracking-wider z-10 shadow-lg`}
                      style={{
                        backgroundColor: product.promotion_data.badgeColor === 'red' ? '#ef4444' :
                                       product.promotion_data.badgeColor === 'orange' ? '#f97316' :
                                       product.promotion_data.badgeColor === 'green' ? '#22c55e' :
                                       product.promotion_data.badgeColor === 'blue' ? '#3b82f6' :
                                       product.promotion_data.badgeColor === 'yellow' ? '#eab308' :
                                       product.promotion_data.badgeColor === 'purple' ? '#a855f7' : '#ef4444',
                        color: 'white'
                      }}
                    >
                      {product.promotion_data.badgeText}
                    </motion.div>
                  )}

                  {/* Product Image */}
                  {product.image_url && (
                    <div className="w-full aspect-square rounded-xl mb-6 overflow-hidden bg-white/5">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1">
                    {/* Strain Type Badge + Brand */}
                    <div className="flex items-center gap-2 mb-2">
                      {product.metadata?.strain_type && (() => {
                        const strainColors = {
                          indica: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
                          sativa: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
                          hybrid: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fbbf24', border: 'rgba(234, 179, 8, 0.3)' }
                        };
                        const colors = strainColors[product.metadata.strain_type as keyof typeof strainColors];

                        return (
                          <div
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            {product.metadata.strain_type.charAt(0)}
                          </div>
                        );
                      })()}
                      {product.metadata?.brand && (
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider opacity-60"
                          style={{ color: theme.styles.productDescription.color }}
                        >
                          {product.metadata.brand}
                        </div>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3
                      className="uppercase tracking-[0.1em] leading-tight mb-2"
                      style={{...theme.styles.productName, fontSize: isDense ? '0.875rem' : undefined}}
                    >
                      {product.name}
                    </h3>

                    {/* THC/CBD % */}
                    {(product.metadata?.thc_percentage || product.metadata?.cbd_percentage) && (
                      <div className="flex gap-2 mb-3">
                        {product.metadata?.thc_percentage && (
                          <div
                            className="text-xs font-black"
                            style={{ color: theme.styles.price.color }}
                          >
                            {product.metadata.thc_percentage}% THC
                          </div>
                        )}
                        {product.metadata?.cbd_percentage && (
                          <div
                            className="text-xs font-black opacity-60"
                            style={{ color: theme.styles.productDescription.color }}
                          >
                            {product.metadata.cbd_percentage}% CBD
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Display */}
                    {(() => {
                      // If product has tiered pricing from blueprints
                      if (product.pricing_tiers && product.pricing_blueprint) {
                        const blueprint = product.pricing_blueprint;
                        const priceBreaks = blueprint.price_breaks || [];
                        const prices = product.pricing_tiers;

                        return (
                          <div className={`flex flex-wrap gap-${isDense ? '1' : '2'} mt-2`}>
                            {priceBreaks.map((priceBreak: any) => {
                              const breakId = priceBreak.break_id;
                              const priceData = prices[breakId];

                              if (!priceData || !priceData.price) return null;

                              const price = parseFloat(priceData.price);
                              const qty = priceBreak.qty || priceBreak.display_qty || 0;
                              const isHighlighted = breakId === '3_5g' || breakId === '3.5g'; // Highlight eighth

                              return (
                                <div
                                  key={breakId}
                                  className={`rounded-lg ${isDense ? 'px-2 py-1' : 'px-3 py-2'} text-center`}
                                  style={{
                                    background: isHighlighted ? theme.styles.price.color + '20' : theme.styles.productCard.background,
                                    border: `1px solid ${isHighlighted ? theme.styles.price.color : theme.styles.productCard.borderColor}`,
                                  }}
                                >
                                  <div
                                    className={`${isDense ? 'text-[10px]' : 'text-xs'} font-bold opacity-70`}
                                    style={{ color: theme.styles.productName.color }}
                                  >
                                    {priceBreak.display || `${qty}${priceBreak.display_unit || 'g'}`}
                                  </div>
                                  <div
                                    className={`${isDense ? 'text-xs' : 'text-sm'} font-black`}
                                    style={{ color: isHighlighted ? theme.styles.price.color : theme.styles.productName.color }}
                                  >
                                    ${price.toFixed(2)}
                                  </div>
                                  {!isDense && qty > 1 && (
                                    <div
                                      className="text-[9px] opacity-40 mt-0.5"
                                      style={{ color: theme.styles.productDescription.color }}
                                    >
                                      ${(price / qty).toFixed(1)}/g
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Fallback to simple pricing
                      const price = product.regular_price || product.price || 0;
                      return (
                        <div>
                          <div
                            className="inline-block"
                            style={theme.styles.price}
                          >
                            ${parseFloat(price).toFixed(2)}
                          </div>
                          {!isDense && price > 0 && (
                            <div
                              className="text-[10px] opacity-30 mt-1"
                              style={{ color: theme.styles.productDescription.color }}
                            >
                              Set pricing tiers in /vendor/pricing
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
                  ))}
                </div>

                {/* Carousel Page Indicators */}
                {isCarousel && (() => {
                  const productsPerPage = 12;
                  const totalPages = Math.ceil(products.length / productsPerPage);

                  if (totalPages <= 1) return null;

                  return (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all"
                          style={{
                            width: i === carouselPage ? '32px' : '8px',
                            height: '8px',
                            background: i === carouselPage ? theme.styles.price.color : theme.styles.productDescription.color,
                            opacity: i === carouselPage ? 1 : 0.3
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            );
          })() : (
            <div className="text-center flex-1 flex items-center justify-center" style={{ color: theme.styles.productDescription.color }}>
              <div>
                <div className="text-6xl mb-4">📦</div>
                <p className="text-2xl uppercase tracking-wider font-bold">No products available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'online'
              ? 'bg-green-400 shadow-lg shadow-green-400/50'
              : connectionStatus === 'error'
              ? 'bg-red-400 shadow-lg shadow-red-400/50'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-white text-xs font-bold uppercase tracking-wider">
          {connectionStatus === 'online' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Offline'}
        </span>
      </div>
    </motion.div>
  );
}

export default function TVDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      }
    >
      <TVDisplayContent />
    </Suspense>
  );
}
