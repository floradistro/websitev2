/**
 * TV Display V2 - Complete Rewrite
 * Matches POS theme, renders menus properly, optimized performance
 */

'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { getTheme } from '@/lib/themes';
import { calculatePrice, calculateTierPrices, type Promotion } from '@/lib/pricing';
import { MinimalProductCard } from '@/components/tv-display/MinimalProductCard';

interface TVDisplayContentProps {}

function TVDisplayContent() {
  const searchParams = useSearchParams();

  // URL Parameters
  const vendorId = searchParams.get('vendor_id');
  const locationId = searchParams.get('location_id');
  const tvNumberParam = searchParams.get('tv_number');
  const tvNumber = tvNumberParam && tvNumberParam !== '' ? tvNumberParam : '1';
  const menuIdParam = searchParams.get('menu_id');
  const deviceIdParam = searchParams.get('device_id'); // For preview mode
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
  const [carouselPageLeft, setCarouselPageLeft] = useState(0);
  const [carouselPageRight, setCarouselPageRight] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [displayGroup, setDisplayGroup] = useState<any>(null);
  const [groupMember, setGroupMember] = useState<any>(null);
  const [vendorConfigs, setVendorConfigs] = useState<any[]>([]);
  const [isPortrait, setIsPortrait] = useState(false);

  /**
   * Memoized pricing config map for better performance
   */
  const configMap = useMemo(() => {
    const map = new Map(
      (vendorConfigs || []).map((config: any) => [config.blueprint_id, config.pricing_values])
    );
    console.log('🗺️ Created pricing config map with', map.size, 'entries');
    return map;
  }, [vendorConfigs]);

  /**
   * Orientation Detection
   */
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      console.log(`📱 Orientation: ${portrait ? 'Portrait' : 'Landscape'} (${window.innerWidth}x${window.innerHeight})`);
    };

    // Check on mount
    checkOrientation();

    // Listen for resize/orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  /**
   * Device Registration
   */
  useEffect(() => {
    // In preview mode, use the provided device_id instead of registering
    if (isPreview && deviceIdParam) {
      console.log('👁️ Preview mode - using provided device ID:', deviceIdParam);
      setDeviceId(deviceIdParam);
      setConnectionStatus('online'); // Show as online for preview
      return;
    }

    // Skip device registration if no vendor/tv_number
    if (isPreview) {
      console.log('👁️ Preview mode but no device_id - skipping registration');
      setConnectionStatus('online');
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
  }, [vendorId, locationId, tvNumber, deviceId, isPreview, deviceIdParam]);

  /**
   * Check for Display Group Membership
   */
  useEffect(() => {
    if (!deviceId) return;
    // Allow preview mode to check groups too - just need deviceId

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
  }, [deviceId]);

  /**
   * Load Vendor Pricing Configs (once, cached)
   */
  useEffect(() => {
    if (!vendorId) return;

    const loadVendorConfigs = async () => {
      try {
        console.log('💵 Loading vendor pricing configs (cached)...');
        const configsResponse = await fetch(`/api/vendor/pricing-configs-for-display?vendor_id=${vendorId}`);
        const configsData = await configsResponse.json();

        if (configsData.success) {
          setVendorConfigs(configsData.configs || []);
          console.log('💵 Cached vendor pricing configs:', configsData.configs?.length || 0);
        } else {
          console.error('❌ Error loading vendor pricing configs:', configsData.error);
        }
      } catch (err) {
        console.error('❌ Failed to load vendor configs:', err);
      }
    };

    loadVendorConfigs();
  }, [vendorId]);

  /**
   * Reload products when vendor pricing configs are loaded
   */
  useEffect(() => {
    if (vendorConfigs.length > 0 && activeMenu) {
      console.log('🔄 Vendor pricing configs loaded, reloading products with pricing...');
      loadProducts(activeMenu);
    }
  }, [vendorConfigs, activeMenu]);

  /**
   * Load Menu & Products
   */
  const loadMenuAndProducts = useCallback(async () => {
    try {
      // Load vendor info first via API (bypasses RLS)
      if (vendorId && !vendor) {
        console.log('📦 Loading vendor info:', vendorId);
        try {
          const vendorResponse = await fetch(`/api/tv-display/vendor?vendor_id=${vendorId}`);
          const vendorData = await vendorResponse.json();

          if (vendorData.success && vendorData.vendor) {
            setVendor(vendorData.vendor);
            console.log('✅ Vendor loaded:', vendorData.vendor.store_name);
          } else {
            console.error('❌ Error loading vendor:', vendorData.error);
          }
        } catch (err) {
          console.error('❌ Failed to fetch vendor:', err);
          // Continue anyway - vendor info is not critical for display
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

      // Load products via API (bypasses RLS) - filtered by location inventory
      console.log('🔍 Fetching products for vendor:', vendorId, 'location:', locationId);
      const productsResponse = await fetch(`/api/tv-display/products?vendor_id=${vendorId}&location_id=${locationId}`);
      const productsData = await productsResponse.json();

      if (!productsData.success) {
        console.error('❌ Error fetching products:', productsData.error);
        throw new Error(productsData.error || 'Failed to fetch products');
      }

      const productData = productsData.products || [];
      console.log(`✅ Fetched ${productData.length} published products from API`);

      // Debug first product's raw data
      if (productData.length > 0) {
        console.log('🔍 First product raw data:', {
          name: productData[0].name,
          has_pricing_assignments: !!productData[0].pricing_assignments,
          pricing_assignments_count: productData[0].pricing_assignments?.length || 0,
          first_assignment: productData[0].pricing_assignments?.[0]
        });
      }

      // Check if pricing configs are loaded yet
      console.log('💵 Pricing config map size:', configMap.size, 'entries');
      if (configMap.size === 0) {
        console.log('⚠️  WARNING: No vendor pricing configs loaded yet! Products will show "No pricing".');
        console.log('   This usually means vendorConfigs is still loading or empty.');
      }

      // Enrich products with actual prices and promotions
      let isFirstProduct = true;
      const enrichedProducts = (productData || []).map((product: any) => {
        // Map database fields to expected fields
        let productWithPricing = {
          ...product,
          image_url: product.featured_image || product.image_url, // Map featured_image to image_url
          // Keep custom_fields as is (NEW SYSTEM ONLY - no conversion to metadata)
          custom_fields: product.custom_fields || []
        };

        if (product.pricing_assignments && product.pricing_assignments.length > 0) {
          let assignment;

          // Priority 1: If device is in a display group, use that group's pricing tier
          if (displayGroup?.pricing_tier_id) {
            assignment = product.pricing_assignments.find(
              (a: any) => a.blueprint_id === displayGroup.pricing_tier_id && a.is_active
            );
            if (assignment) {
              console.log(`💰 Using display group pricing tier for ${product.name}:`, displayGroup.name);
            }
          }

          // Priority 2: Fall back to first active assignment
          if (!assignment) {
            assignment = product.pricing_assignments[0];
          }

          if (assignment) {
            const blueprint = assignment.blueprint;
            const vendorPrices = configMap.get(assignment.blueprint_id) || {};
            const productOverrides = assignment.price_overrides || {};

            // Merge vendor prices with product overrides (product overrides take priority)
            const finalPrices = { ...vendorPrices, ...productOverrides };

            // Debug first product's pricing
            if (isFirstProduct) {
              console.log('💰 First product pricing:', {
                product: productWithPricing.name,
                blueprint_id: assignment.blueprint_id,
                has_vendor_prices: Object.keys(vendorPrices).length > 0,
                vendor_prices: vendorPrices,
                has_product_overrides: Object.keys(productOverrides).length > 0,
                product_overrides: productOverrides,
                final_prices: finalPrices
              });
              isFirstProduct = false;
            }

            productWithPricing = {
              ...productWithPricing,  // Keep the mapped fields (image_url, metadata)
              pricing_blueprint: blueprint,
              pricing_tiers: finalPrices
            };
          }
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

      // Priority 1: Use menu's configured categories
      let selectedCategories = menu?.config_data?.categories;
      let filterSource = 'menu';

      console.log('🎯 Category filtering logic:');
      console.log('   - Menu config categories:', menu?.config_data?.categories);
      console.log('   - Display group member:', groupMember ? groupMember.id : 'none');
      console.log('   - Group member categories:', groupMember?.assigned_categories);

      // Priority 2: Fall back to display group categories if menu doesn't specify
      if (!selectedCategories || selectedCategories.length === 0) {
        selectedCategories = groupMember?.assigned_categories;
        filterSource = 'group';
        console.log('   - Using GROUP categories (fallback):', selectedCategories);
      } else {
        console.log('   - Using MENU categories:', selectedCategories);
      }

      if (selectedCategories && selectedCategories.length > 0) {
        console.log(`🔍 Filtering ${enrichedProducts.length} products by ${filterSource} categories:`, selectedCategories);

        // Debug: show what categories each product has
        if (enrichedProducts.length > 0) {
          console.log('📦 Sample product categories:');
          enrichedProducts.slice(0, 5).forEach((p: any) => {
            const categoryName = p.primary_category?.name || null;
            console.log(`   - "${p.name}": [${categoryName || 'NO CATEGORY'}]`);
          });
        }

        filteredProducts = enrichedProducts.filter((p: any) => {
          // Check if product has any of the selected categories
          const categoryName = p.primary_category?.name;
          const matches = categoryName && selectedCategories.includes(categoryName);

          if (!matches && categoryName) {
            console.log(`   ⚠️ Product "${p.name}" filtered out - has "${categoryName}", need one of [${selectedCategories.join(', ')}]`);
          }

          return matches;
        });
        console.log(`🎯 Filtered to ${filteredProducts.length} products from ${enrichedProducts.length} (${filterSource} categories: ${selectedCategories.join(', ')})`);
      } else {
        console.log('📋 No category filter - showing all products');
      }

      // Filter by pricing tier if configured
      if (displayGroup?.pricing_tier_id) {
        console.log(`💰 Display group pricing tier filter:`, displayGroup.pricing_tier_id, `(${displayGroup.name})`);

        const beforeFilterCount = filteredProducts.length;

        // Filter to only show products with this pricing tier
        filteredProducts = filteredProducts.filter((p: any) =>
          p.pricing_blueprint?.id === displayGroup.pricing_tier_id
        );

        console.log(`💰 Filtered by pricing tier: ${filteredProducts.length}/${beforeFilterCount} products match tier`);

        if (filteredProducts.length === 0) {
          console.warn(`⚠️ No products match pricing tier "${displayGroup.pricing_tier_id}"`);
        }
      }

      setProducts(filteredProducts);
      console.log(`✅ Loaded ${filteredProducts.length} products with pricing`);

      console.log('📊 Sample product data:', filteredProducts[0] ? {
        name: filteredProducts[0].name,
        has_image: !!filteredProducts[0].image_url,
        image_url: filteredProducts[0].image_url,
        has_metadata: !!filteredProducts[0].metadata,
        metadata: filteredProducts[0].metadata,
        has_assignment: !!filteredProducts[0].pricing_assignments,
        has_blueprint: !!filteredProducts[0].pricing_blueprint,
        blueprint_name: filteredProducts[0].pricing_blueprint?.name,
        has_tiers: !!filteredProducts[0].pricing_tiers,
        tiers: filteredProducts[0].pricing_tiers,
        has_promotion: !!filteredProducts[0].promotion_data
      } : 'No products');

      // Extract unique categories (from ALL products, not just filtered)
      const categorySet = new Set<string>();
      enrichedProducts.forEach((p: any) => {
        if (p.primary_category?.name) {
          categorySet.add(p.primary_category.name);
        }
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
   * Real-time subscription for display group changes (pricing tier, display config, etc.)
   */
  useEffect(() => {
    if (!displayGroup?.id) return;

    console.log('🎯 Setting up real-time subscription for display group:', displayGroup.id);

    const channel = supabase
      .channel(`display-group-${displayGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tv_display_groups',
          filter: `id=eq.${displayGroup.id}`,
        },
        (payload) => {
          console.log('🎯 DISPLAY GROUP UPDATED!', payload);
          console.log('   Old config:', displayGroup);
          console.log('   New config:', payload.new);

          // Update display group immediately
          setDisplayGroup(payload.new);

          // Force products reload with new configuration
          if (activeMenu) {
            console.log('🔄 Reloading products with new display group config...');
            loadProducts(activeMenu);
          }
        }
      )
      .subscribe((status) => {
        console.log('🎯 Display group subscription status:', status);
      });

    return () => {
      console.log('🎯 Cleaning up display group subscription');
      supabase.removeChannel(channel);
    };
  }, [displayGroup?.id, activeMenu]);

  /**
   * AUTO CAROUSEL: Rotates pages every 5 seconds when products exceed grid capacity
   */
  useEffect(() => {
    if (products.length === 0 || !displayGroup) {
      return;
    }

    // Check if split view mode
    const layoutStyle = activeMenu?.config_data?.layoutStyle || 'single';
    const isSplitView = layoutStyle === 'split';

    // Calculate grid capacity
    let gridColumns = displayGroup.shared_grid_columns || 6;
    const gridRows = displayGroup.shared_grid_rows || 5;

    // Adjust for split view - each side has half the columns
    if (isSplitView) {
      gridColumns = Math.max(2, Math.floor(gridColumns / 2));

      // In split view, each side has independent carousel
      const splitLeftCategory = activeMenu?.config_data?.splitLeftCategory;
      const splitRightCategory = activeMenu?.config_data?.splitRightCategory;

      const leftProducts = products.filter((p: any) => p.primary_category?.name === splitLeftCategory);
      const rightProducts = products.filter((p: any) => p.primary_category?.name === splitRightCategory);

      const productsPerPage = gridColumns * gridRows;
      const leftPages = Math.ceil(leftProducts.length / productsPerPage);
      const rightPages = Math.ceil(rightProducts.length / productsPerPage);

      console.log(`🎠 Split View Carousel Check:`, {
        leftProducts: leftProducts.length,
        leftPages,
        rightProducts: rightProducts.length,
        rightPages,
        capacity: productsPerPage
      });

      // Setup independent carousel for left side
      let leftInterval: NodeJS.Timeout | null = null;
      if (leftPages > 1) {
        console.log(`🎠 LEFT side needs carousel: ${leftPages} pages`);
        leftInterval = setInterval(() => {
          setCarouselPageLeft((prev) => {
            const next = (prev + 1) % leftPages;
            console.log(`🎠 LEFT Page ${next + 1}/${leftPages}`);
            return next;
          });
        }, 5000);
      } else {
        console.log(`✅ LEFT side fits on one page - no carousel`);
        setCarouselPageLeft(0);
      }

      // Setup independent carousel for right side
      let rightInterval: NodeJS.Timeout | null = null;
      if (rightPages > 1) {
        console.log(`🎠 RIGHT side needs carousel: ${rightPages} pages`);
        rightInterval = setInterval(() => {
          setCarouselPageRight((prev) => {
            const next = (prev + 1) % rightPages;
            console.log(`🎠 RIGHT Page ${next + 1}/${rightPages}`);
            return next;
          });
        }, 5000);
      } else {
        console.log(`✅ RIGHT side fits on one page - no carousel`);
        setCarouselPageRight(0);
      }

      return () => {
        if (leftInterval) clearInterval(leftInterval);
        if (rightInterval) clearInterval(rightInterval);
      };
    } else {
      // Single view - normal calculation
      const productsPerPage = gridColumns * gridRows;
      const totalPages = Math.ceil(products.length / productsPerPage);

      // Only enable carousel if products exceed capacity
      if (totalPages <= 1) {
        setCarouselPage(0); // Reset to first page
        return;
      }

      console.log(`🎠 AUTO CAROUSEL: ${totalPages} pages, rotating every 5 seconds`);

      const interval = setInterval(() => {
        setCarouselPage((prev) => {
          const next = (prev + 1) % totalPages;
          console.log(`🎠 Page ${next + 1}/${totalPages}`);
          return next;
        });
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [products.length, displayGroup?.shared_grid_columns, displayGroup?.shared_grid_rows, activeMenu?.config_data?.layoutStyle, activeMenu?.config_data?.splitLeftCategory, activeMenu?.config_data?.splitRightCategory]);

  // Loading State
  if (loading) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center bg-black"
        style={{
          padding: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)'
        }}
      >
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
      <div
        className="w-screen h-screen flex items-center justify-center bg-black"
        style={{
          padding: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)'
        }}
      >
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
      <div
        className="w-screen h-screen flex items-center justify-center bg-black"
        style={{
          padding: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)'
        }}
      >
        <div className="text-center text-white">
          {/* Show vendor logo if available */}
          {vendor?.logo_url ? (
            <div className="mb-8">
              <img
                src={vendor.logo_url}
                alt={vendor.store_name}
                className="mx-auto max-w-md max-h-64 object-contain"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.1))'
                }}
              />
            </div>
          ) : (
            <div className="text-6xl mb-4">📺</div>
          )}
          <h1 className="text-3xl font-bold mb-2">{vendor?.store_name || 'Display Ready'}</h1>
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

  // Check if split view mode
  const layoutStyle = activeMenu?.config_data?.layoutStyle || 'single';
  const isSplitView = layoutStyle === 'split';

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
        backgroundImage: theme.styles.backgroundImage,
        padding: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)',
        // Zoom-independent rendering: Use CSS transform scale based on viewport size
        // This ensures consistent display across different browsers and zoom levels
        transformOrigin: 'center center',
      }}
    >
      {/* Menu Content */}
      <div className="absolute inset-0 overflow-hidden p-4">
        <div className="h-full w-full flex flex-col">
          {/* Category Header - Compact and always on top (hidden in split view) */}
          {(!isSplitView && displayGroup?.display_config?.show_category_header === true && groupMember?.assigned_categories && groupMember.assigned_categories.length > 0) && (
            <div className="text-center flex-shrink-0 mb-3">
              <h1
                className="uppercase tracking-[0.2em] font-black text-white"
                style={{
                  fontSize: '4.5rem',
                  lineHeight: 1,
                  letterSpacing: '0.2em',
                  opacity: 0.9
                }}
              >
                {groupMember.assigned_categories.join(' • ')}
              </h1>
            </div>
          )}

          {/* Menu Header - Full header with name and description */}
          {(displayGroup?.display_config?.show_header === true) && (
            <div className="text-center flex-shrink-0 mb-4">
              <h1
                className="uppercase tracking-[0.15em]"
                style={{
                  ...theme.styles.menuTitle,
                  fontSize: '5rem',
                  lineHeight: 1,
                  letterSpacing: '0.15em'
                }}
              >
                {activeMenu.name}
              </h1>
              {activeMenu.description && (
                <p
                  className="uppercase tracking-wider font-medium mt-2"
                  style={{
                    ...theme.styles.menuDescription,
                    fontSize: '2rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  {activeMenu.description}
                </p>
              )}
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 ? (() => {
            // Use display group settings if available, otherwise fall back to menu settings
            const displayMode = displayGroup?.shared_display_mode || activeMenu.display_mode || 'dense';

            // SMART GRID: Default to 30 products, user can adjust manually
            const totalProducts = products.length;
            const maxProductsToShow = 30; // Default limit

            let gridColumns, gridRows;

            // Check if user has manually configured the grid
            if (displayGroup?.shared_grid_columns && displayGroup?.shared_grid_rows) {
              // User manual configuration - respect it exactly
              gridColumns = displayGroup.shared_grid_columns;
              gridRows = displayGroup.shared_grid_rows;
              console.log('📐 Using manual grid configuration:', { gridColumns, gridRows, capacity: gridColumns * gridRows });
            } else {
              // Smart auto-optimization for default 30 products
              const productsToFit = Math.min(totalProducts, maxProductsToShow);

              if (isPortrait) {
                // Portrait: Optimize for vertical displays (9:16 aspect ratio)
                // Example: 30 products → 5 cols × 6 rows
                gridColumns = Math.ceil(Math.sqrt(productsToFit * 0.5625)); // 9/16 = 0.5625
                gridRows = Math.ceil(productsToFit / gridColumns);
              } else {
                // Landscape: Optimize for horizontal displays (16:9 aspect ratio)
                // Example: 30 products → 6 cols × 5 rows
                gridColumns = Math.ceil(Math.sqrt(productsToFit * 1.78)); // 16/9 = 1.78
                gridRows = Math.ceil(productsToFit / gridColumns);
              }

              console.log('🤖 Smart auto-optimization:', {
                orientation: isPortrait ? 'portrait' : 'landscape',
                totalProducts,
                showing: Math.min(totalProducts, maxProductsToShow),
                gridColumns,
                gridRows,
                capacity: gridColumns * gridRows
              });
            }

            const productsPerPage = gridColumns * gridRows;
            const needsCarousel = products.length > productsPerPage;

            console.log('📐 Grid settings:', {
              orientation: isPortrait ? 'portrait' : 'landscape',
              gridColumns,
              gridRows,
              capacity: productsPerPage,
              totalProducts: products.length,
              needsCarousel,
              source: displayGroup ? 'group' : 'menu'
            });

            // AUTO CAROUSEL: If products exceed grid capacity, enable carousel
            let productsToShow;
            if (needsCarousel) {
              // Carousel mode - rotate through pages every 5 seconds
              const start = carouselPage * productsPerPage;
              const end = start + productsPerPage;
              productsToShow = products.slice(start, end);
              console.log(`🎠 Carousel: Page ${carouselPage + 1}/${Math.ceil(products.length / productsPerPage)} (${start + 1}-${Math.min(end, products.length)} of ${products.length})`);
            } else {
              // All products fit - show them all
              productsToShow = products;
              console.log(`📦 Static: Showing all ${products.length} products`);
            }

            console.log('🎨 Layout style:', layoutStyle, '(defined at top level)');

            // Adjust grid for split view - reduce columns to prevent squashing
            const adjustedGridColumns = isSplitView ? Math.max(2, Math.floor(gridColumns / 2)) : gridColumns;
            const adjustedGridRows = gridRows;

            console.log(`📐 Grid: ${adjustedGridColumns}x${adjustedGridRows} (original: ${gridColumns}x${gridRows}, split: ${isSplitView})`);

            // Dynamic grid classes based on group settings - minimal gaps
            const gridClasses = `grid gap-2`;
            const gridStyle = {
              gridTemplateColumns: `repeat(${adjustedGridColumns}, 1fr)`,
              gridTemplateRows: `repeat(${adjustedGridRows}, 1fr)`,
              maxHeight: '100%',
              maxWidth: '100%',
            };

            // Get visible price breaks - Priority 1: Menu config, Priority 2: Display group (fallback)
            const visiblePriceBreaks = activeMenu?.config_data?.visible_price_breaks || displayGroup?.visible_price_breaks || [];

            console.log('💰 Visible price breaks:', visiblePriceBreaks.length > 0 ? visiblePriceBreaks : 'none configured (will show no pricing)');
            console.log('   Source: menu =', activeMenu?.config_data?.visible_price_breaks, ', group =', displayGroup?.visible_price_breaks);

            // Split view rendering
            if (isSplitView) {
              const splitLeftCategory = activeMenu?.config_data?.splitLeftCategory;
              const splitLeftTitle = activeMenu?.config_data?.splitLeftTitle;
              const splitRightCategory = activeMenu?.config_data?.splitRightCategory;
              const splitRightTitle = activeMenu?.config_data?.splitRightTitle;

              console.log('📱 Split view config:', {
                left: { category: splitLeftCategory, title: splitLeftTitle },
                right: { category: splitRightCategory, title: splitRightTitle }
              });

              // Filter products for each side from ALL products (not productsToShow)
              const allLeftProducts = products.filter((p: any) => p.primary_category?.name === splitLeftCategory);
              const allRightProducts = products.filter((p: any) => p.primary_category?.name === splitRightCategory);

              // Apply independent pagination for each side
              const productsPerPage = adjustedGridColumns * adjustedGridRows;

              // Left side pagination
              const leftStart = carouselPageLeft * productsPerPage;
              const leftEnd = leftStart + productsPerPage;
              const leftProducts = allLeftProducts.slice(leftStart, leftEnd);
              const leftTotalPages = Math.ceil(allLeftProducts.length / productsPerPage);

              // Right side pagination
              const rightStart = carouselPageRight * productsPerPage;
              const rightEnd = rightStart + productsPerPage;
              const rightProducts = allRightProducts.slice(rightStart, rightEnd);
              const rightTotalPages = Math.ceil(allRightProducts.length / productsPerPage);

              console.log(`📊 Split products:`, {
                left: {
                  total: allLeftProducts.length,
                  showing: leftProducts.length,
                  page: `${carouselPageLeft + 1}/${leftTotalPages}`,
                  needsCarousel: leftTotalPages > 1
                },
                right: {
                  total: allRightProducts.length,
                  showing: rightProducts.length,
                  page: `${carouselPageRight + 1}/${rightTotalPages}`,
                  needsCarousel: rightTotalPages > 1
                }
              });

              return (
                <>
                  <div className="w-full h-full flex gap-4" style={{ flex: '1 1 0', minHeight: 0 }}>
                    {/* Left Side */}
                    <div
                      className="flex-1 flex flex-col"
                      style={{
                        minHeight: 0,
                        paddingRight: '0.75%',
                        borderRight: `1px solid ${theme.styles.productName.color}15`,
                      }}
                    >
                      {splitLeftTitle && (
                        <h2
                          className="font-black uppercase tracking-wide text-center mb-2 flex-shrink-0"
                          style={{
                            color: theme.styles.productName.color,
                            fontSize: 'clamp(1.5rem, 3vw, 4rem)',
                            lineHeight: 0.9,
                          }}
                        >
                          {splitLeftTitle}
                        </h2>
                      )}
                      <div className={`${gridClasses} w-full`} style={{
                        ...gridStyle,
                        flex: '1 1 0',
                        minHeight: 0,
                      }}>
                        {leftProducts.map((product: any, index: number) => (
                          <MinimalProductCard
                            key={product.id}
                            product={product}
                            theme={theme}
                            index={index}
                            visiblePriceBreaks={visiblePriceBreaks}
                            displayConfig={displayGroup?.display_config}
                            customFieldsToShow={activeMenu?.config_data?.customFields || []}
                            customFieldsConfig={activeMenu?.config_data?.customFieldsConfig || {}}
                            hideAllFieldLabels={activeMenu?.config_data?.hideAllFieldLabels || false}
                            splitSide="left"
                            gridColumns={adjustedGridColumns}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Elegant Divider - Steve Jobs style */}
                    <div
                      style={{
                        width: '1px',
                        background: `linear-gradient(to bottom, transparent, ${theme.styles.productName.color}30 20%, ${theme.styles.productName.color}30 80%, transparent)`,
                        alignSelf: 'stretch',
                        margin: '0 -0.5%',
                      }}
                    />

                    {/* Right Side */}
                    <div
                      className="flex-1 flex flex-col"
                      style={{
                        minHeight: 0,
                        paddingLeft: '0.75%',
                      }}
                    >
                      {splitRightTitle && (
                        <h2
                          className="font-black uppercase tracking-wide text-center mb-2 flex-shrink-0"
                          style={{
                            color: theme.styles.productName.color,
                            fontSize: 'clamp(1.5rem, 3vw, 4rem)',
                            lineHeight: 0.9,
                          }}
                        >
                          {splitRightTitle}
                        </h2>
                      )}
                      <div className={`${gridClasses} w-full`} style={{
                        ...gridStyle,
                        flex: '1 1 0',
                        minHeight: 0,
                      }}>
                        {rightProducts.map((product: any, index: number) => (
                          <MinimalProductCard
                            key={product.id}
                            product={product}
                            theme={theme}
                            index={index}
                            visiblePriceBreaks={visiblePriceBreaks}
                            displayConfig={displayGroup?.display_config}
                            customFieldsToShow={activeMenu?.config_data?.customFields || []}
                            customFieldsConfig={activeMenu?.config_data?.customFieldsConfig || {}}
                            hideAllFieldLabels={activeMenu?.config_data?.hideAllFieldLabels || false}
                            splitSide="right"
                            gridColumns={adjustedGridColumns}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            }

            // Single view rendering (default)
            return (
              <>
                <div className={`${gridClasses} w-full`} style={{
                  ...gridStyle,
                  flex: '1 1 0',
                  minHeight: 0, // Critical: allows grid to shrink
                }}>
                  {productsToShow.map((product: any, index: number) => (
                    <MinimalProductCard
                      key={product.id}
                      product={product}
                      theme={theme}
                      index={index}
                      visiblePriceBreaks={visiblePriceBreaks}
                      displayConfig={displayGroup?.display_config}
                      customFieldsToShow={activeMenu?.config_data?.customFields || []}
                      customFieldsConfig={activeMenu?.config_data?.customFieldsConfig || {}}
                      hideAllFieldLabels={activeMenu?.config_data?.hideAllFieldLabels || false}
                      gridColumns={gridColumns}
                    />
                  ))}
                </div>

                {/* Carousel Page Indicators */}
                {needsCarousel && (() => {
                  const productsPerPage = gridColumns * gridRows;
                  const totalPages = Math.ceil(products.length / productsPerPage);

                  if (totalPages <= 1) return null;

                  return (
                    <div className="flex justify-center gap-2 mt-3 flex-shrink-0">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all"
                          style={{
                            width: i === carouselPage ? '28px' : '8px',
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
                <div className="text-8xl mb-6">📦</div>
                <p className="text-3xl uppercase tracking-wider font-bold">No products available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
        <div
          className={`w-2 h-2 rounded-full ${
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
