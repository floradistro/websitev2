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
  const [displayGroup, setDisplayGroup] = useState<any>(null);
  const [groupMember, setGroupMember] = useState<any>(null);

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
   * Check for Display Group Membership
   */
  useEffect(() => {
    if (!deviceId || isPreview) return;

    const checkGroupMembership = async () => {
      try {
        console.log('🎯 Checking for display group membership:', deviceId);

        // Use API endpoint to bypass RLS
        const response = await fetch(`/api/display-groups/membership?device_id=${deviceId}`);
        const data = await response.json();

        if (!data.success) {
          console.error('Error checking group membership:', data.error);
          return;
        }

        if (data.isMember) {
          console.log('✅ Device is part of group:', data.group.name);
          setDisplayGroup(data.group);
          setGroupMember(data.member);
        } else {
          console.log('📺 Device not part of any display group');
          setDisplayGroup(null);
          setGroupMember(null);
        }
      } catch (err: any) {
        console.error('Error checking group membership:', err);
      }
    };

    checkGroupMembership();
  }, [deviceId, isPreview]);

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
  }, [deviceId, menuIdParam, groupMember]);

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

      // Load products with pricing assignments and categories
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
          ),
          product_categories(
            category:categories(name)
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

      // Filter products by selected categories (if any)
      let filteredProducts = enrichedProducts;

      // Priority 1: If part of a display group, use group member's assigned categories
      let selectedCategories = groupMember?.assigned_categories;
      let filterSource = 'group';

      // Priority 2: Fall back to menu categories if not in a group
      if (!selectedCategories || selectedCategories.length === 0) {
        selectedCategories = menu?.config_data?.categories;
        filterSource = 'menu';
      }

      if (selectedCategories && selectedCategories.length > 0) {
        filteredProducts = enrichedProducts.filter((p: any) => {
          // Check if product has any of the selected categories
          const productCategories = p.product_categories?.map((pc: any) => pc.category?.name).filter(Boolean) || [];
          return productCategories.some((cat: string) => selectedCategories.includes(cat));
        });
        console.log(`🎯 Filtered to ${filteredProducts.length} products from ${enrichedProducts.length} (${filterSource} categories: ${selectedCategories.join(', ')})`);
      }

      setProducts(filteredProducts);
      console.log(`✅ Loaded ${filteredProducts.length} products with pricing`);
      console.log('📊 Sample product pricing:', filteredProducts[0] ? {
        name: filteredProducts[0].name,
        has_assignment: !!filteredProducts[0].pricing_assignments,
        has_blueprint: !!filteredProducts[0].pricing_blueprint,
        has_tiers: !!filteredProducts[0].pricing_tiers,
        has_promotion: !!filteredProducts[0].promotion_data,
        tiers: filteredProducts[0].pricing_tiers
      } : 'No products');

      // Extract unique categories (from ALL products, not just filtered)
      const categorySet = new Set<string>();
      enrichedProducts.forEach((p: any) => {
        p.product_categories?.forEach((pc: any) => {
          if (pc.category?.name) {
            categorySet.add(pc.category.name);
          }
        });
      });
      const uniqueCategories = [...categorySet].sort();
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
      <div className="w-screen h-screen flex items-center justify-center bg-black safe-all">
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
      <div className="w-screen h-screen flex items-center justify-center bg-black safe-all">
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
      <div className="w-screen h-screen flex items-center justify-center bg-black safe-all">
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

  // Get theme - Use display group's theme if device is part of a group, otherwise use menu theme
  const themeId = displayGroup?.shared_theme || activeMenu.theme;
  const theme = getTheme(themeId);
  console.log('🎨 Using theme:', themeId, displayGroup ? '(from display group)' : '(from menu)');

  // Render Menu
  return (
    <motion.div
      key={theme.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-screen h-screen overflow-hidden relative safe-all"
      style={{
        background: theme.styles.background,
        backgroundImage: theme.styles.backgroundImage
      }}
    >
      {/* Menu Content */}
      <div className="absolute inset-0" style={{ padding: '3rem 4rem' }}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Display Group Mode: Show only category */}
            {groupMember?.assigned_categories && groupMember.assigned_categories.length > 0 ? (
              <div className="mb-6">
                <h1
                  className="uppercase tracking-[0.2em] font-black text-white"
                  style={{
                    fontSize: '2rem',
                    lineHeight: 1,
                    letterSpacing: '0.2em',
                    opacity: 0.9
                  }}
                >
                  {groupMember.assigned_categories.join(' • ')}
                </h1>
              </div>
            ) : (
              /* Regular Mode: Show menu name and description */
              <>
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
              </>
            )}
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (() => {
            // Use display group settings if available, otherwise fall back to menu settings
            const displayMode = displayGroup?.shared_display_mode || activeMenu.display_mode || 'dense';
            const gridColumns = displayGroup?.shared_grid_columns || 4;
            const gridRows = displayGroup?.shared_grid_rows || 3;
            const isCarousel = displayMode === 'carousel';
            const isDense = displayMode === 'dense';

            console.log('📐 Grid settings:', { displayMode, gridColumns, gridRows, source: displayGroup ? 'group' : 'menu' });

            // Calculate products to show
            let productsToShow;
            const productsPerPage = gridColumns * gridRows;

            if (isCarousel) {
              const start = carouselPage * productsPerPage;
              const end = start + productsPerPage;
              productsToShow = products.slice(start, end);
            } else {
              // Dense: show up to grid capacity
              productsToShow = products.slice(0, productsPerPage);
            }

            // Dynamic grid classes based on group settings
            const gridClasses = `grid gap-4`;
            const gridStyle = {
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`
            };

            // Card padding based on mode
            const cardPadding = isDense ? 'p-4' : 'p-8';

            return (
              <>
                <div className={`${gridClasses} flex-1 content-start`} style={gridStyle}>
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
                    {/* Category Badge + Strain Type + Brand */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Show category badge if multiple categories are shown */}
                      {groupMember?.assigned_categories && groupMember.assigned_categories.length > 1 && (() => {
                        const productCategories = product.product_categories?.map((pc: any) => pc.category?.name).filter(Boolean) || [];
                        const mainCategory = productCategories[0];

                        if (mainCategory) {
                          return (
                            <div
                              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                              style={{
                                background: 'rgba(236, 72, 153, 0.15)',
                                color: '#ec4899',
                                border: '1px solid rgba(236, 72, 153, 0.3)'
                              }}
                            >
                              {mainCategory}
                            </div>
                          );
                        }
                        return null;
                      })()}

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

                    {/* Pricing Display - Simplified */}
                    <div className="mt-3">
                      {(() => {
                        // Debug logging
                        console.log('💰 Product pricing debug:', {
                          name: product.name,
                          hasPricingTiers: !!product.pricing_tiers,
                          hasBlueprint: !!product.pricing_blueprint,
                          regularPrice: product.regular_price,
                          price: product.price,
                          pricingTiers: product.pricing_tiers
                        });

                        // If product has tiered pricing from blueprints
                        if (product.pricing_tiers && product.pricing_blueprint) {
                          const blueprint = product.pricing_blueprint;
                          const priceBreaks = blueprint.price_breaks || [];
                          const prices = product.pricing_tiers;

                          // Find the hero price (eighth - 3.5g)
                          const heroBreak = priceBreaks.find((pb: any) => pb.break_id === '3_5g' || pb.break_id === '3.5g');
                          const heroPriceData = heroBreak ? prices[heroBreak.break_id] : null;

                          // Find supporting prices (1g and 7g)
                          const supportingBreaks = priceBreaks.filter((pb: any) =>
                            pb.break_id === '1g' || pb.break_id === '7g' || pb.break_id === '14g'
                          ).slice(0, 2);

                          return (
                            <>
                              {/* Hero Price - Eighth */}
                              {heroPriceData && heroPriceData.price ? (
                                <div className="mb-2">
                                  <div
                                    className="inline-block rounded-lg px-4 py-2"
                                    style={{
                                      background: theme.styles.price.color + '15',
                                      border: `2px solid ${theme.styles.price.color}`
                                    }}
                                  >
                                    <div
                                      className="text-xs font-bold opacity-70 mb-1"
                                      style={{ color: theme.styles.productName.color }}
                                    >
                                      {heroBreak.display || '3.5g'}
                                    </div>
                                    <div
                                      className="text-2xl font-black"
                                      style={{ color: theme.styles.price.color }}
                                    >
                                      ${parseFloat(heroPriceData.price).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm" style={{ color: theme.styles.productDescription.color, opacity: 0.5 }}>
                                  No eighth price set
                                </div>
                              )}

                              {/* Supporting Prices */}
                              {supportingBreaks.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                  {supportingBreaks.map((priceBreak: any) => {
                                    const priceData = prices[priceBreak.break_id];
                                    if (!priceData || !priceData.price) return null;

                                    return (
                                      <div
                                        key={priceBreak.break_id}
                                        className="text-xs"
                                        style={{ color: theme.styles.productDescription.color }}
                                      >
                                        <span className="font-bold opacity-70">
                                          {priceBreak.display || priceBreak.break_id}:
                                        </span>{' '}
                                        <span className="font-black" style={{ color: theme.styles.productName.color }}>
                                          ${parseFloat(priceData.price).toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        }

                        // Fallback to simple pricing
                        const price = parseFloat(product.regular_price || product.price || 0);
                        return (
                          <div>
                            <div
                              className="text-2xl font-black"
                              style={{ color: theme.styles.price.color }}
                            >
                              ${price.toFixed(2)}
                            </div>
                            {price === 0 && (
                              <div className="text-xs mt-1" style={{ color: theme.styles.productDescription.color, opacity: 0.5 }}>
                                Price not configured
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
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
