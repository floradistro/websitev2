/**
 * TV Display V2 - Complete Rewrite
 * Matches POS theme, renders menus properly, optimized performance
 */

"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { getTheme } from "@/lib/themes";
import { calculatePrice, calculateTierPrices, type Promotion } from "@/lib/pricing";
import { type CategoryPricingConfig } from "@/lib/category-pricing-defaults";
import { MinimalProductCard } from "@/components/tv-display/MinimalProductCard";
import { ListProductCard } from "@/components/tv-display/ListProductCard";
import { CompactListProductCard } from "@/components/tv-display/CompactListProductCard";
import { SubcategoryGroup } from "@/components/tv-display/SubcategoryGroup";

import { logger } from "@/lib/logger";
interface TVDisplayContentProps {}

function TVDisplayContent() {
  const searchParams = useSearchParams();

  // URL Parameters
  const vendorId = searchParams.get("vendor_id");
  const locationId = searchParams.get("location_id");
  const tvNumberParam = searchParams.get("tv_number");
  const tvNumber = tvNumberParam && tvNumberParam !== "" ? tvNumberParam : "1";
  const menuIdParam = searchParams.get("menu_id");
  const deviceIdParam = searchParams.get("device_id"); // For preview mode
  const isPreview = searchParams.get("preview") === "true"; // Skip registration for iframe previews
  const themeOverride = searchParams.get("theme"); // Instant theme override for atomic updates

  // State
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "error">(
    "offline",
  );
  const [carouselPage, setCarouselPage] = useState(0);
  const [carouselPageLeft, setCarouselPageLeft] = useState(0);
  const [carouselPageRight, setCarouselPageRight] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [displayGroup, setDisplayGroup] = useState<any>(null);
  const [groupMember, setGroupMember] = useState<any>(null);
  // REMOVED: vendorConfigs - prices are now embedded in products via pricing_data
  const [isPortrait, setIsPortrait] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  // REMOVED: configMap - no longer needed, prices are embedded in products.pricing_data

  /**
   * Helper function to group products by their subcategory
   * Returns: { subcategoryName: products[] }
   */
  const groupProductsBySubcategory = (products: any[]) => {
    const grouped = new Map<string, any[]>();
    const ungrouped: any[] = [];

    products.forEach((product) => {
      const hasParent = product.primary_category?.parent_category?.name;

      if (hasParent) {
        // Product has a parent category, group by its own category name (the subcategory)
        const subcategoryName = product.primary_category?.name;
        if (subcategoryName) {
          if (!grouped.has(subcategoryName)) {
            grouped.set(subcategoryName, []);
          }
          grouped.get(subcategoryName)!.push(product);
        }
      } else {
        // No parent category, add to ungrouped
        ungrouped.push(product);
      }
    });

    return { grouped, ungrouped };
  };

  /**
   * Universal Smart Grouping - "It Just Works"™
   * Automatically groups products by their primary type field (*_type pattern)
   * Works for ALL categories: flower (strain_type), beverages (beverage_type), etc.
   *
   * Apple-simple: Zero configuration, uses existing category field_visibility
   */
  const smartGroupProducts = (products: any[], category?: any) => {
    if (!products.length) return products;

    // Step 1: Find the grouping field (first *_type field that exists)
    let groupField: string | null = null;

    // Check category field_visibility if available
    if (category?.field_visibility) {
      const typeFields = Object.keys(category.field_visibility).filter(
        (f) => f.endsWith("_type") && category.field_visibility[f]?.enabled,
      );
      groupField = typeFields[0] || null;
    }

    // Fallback: scan products for any *_type field with data
    if (!groupField) {
      const sample = products[0]?.custom_fields || {};
      groupField = Object.keys(sample).find((k) => k.endsWith("_type")) || null;
    }

    // No grouping field? Return alphabetically sorted
    if (!groupField) {
      return products.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    // Step 2: Special handling for strain_type (preserve logical order)
    if (groupField === "strain_type") {
      const strainOrder: Record<string, number> = {
        Sativa: 1,
        "Sativa Hybrid": 2,
        Hybrid: 3,
        "Indica Hybrid": 4,
        Indica: 5,
      };

      return products.slice().sort((a, b) => {
        const valA = a.custom_fields?.[groupField] || "zzz";
        const valB = b.custom_fields?.[groupField] || "zzz";

        const orderA = strainOrder[valA] || 999;
        const orderB = strainOrder[valB] || 999;

        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    // Step 3: Default grouping (alphabetical by type value, then by name)
    return products.slice().sort((a, b) => {
      const valA = a.custom_fields?.[groupField] || "zzz";
      const valB = b.custom_fields?.[groupField] || "zzz";

      if (valA !== valB) return valA.localeCompare(valB);
      return a.name.localeCompare(b.name);
    });
  };

  /**
   * Orientation & Viewport Detection
   */
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      const width = window.innerWidth;
      setIsPortrait(portrait);
      setViewportWidth(width);
    };

    // Check on mount
    checkOrientation();

    // Listen for resize/orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  /**
   * Device Registration
   */
  useEffect(() => {
    // In preview mode, use the provided device_id instead of registering
    if (isPreview && deviceIdParam) {
      setDeviceId(deviceIdParam);
      setConnectionStatus("online"); // Show as online for preview
      return;
    }

    // Skip device registration if no vendor/tv_number
    if (isPreview) {
      setConnectionStatus("online");
      return;
    }

    if (!vendorId) {
      setError("Missing vendor_id");
      setLoading(false);
      return;
    }

    if (!tvNumber || tvNumber === "null" || tvNumber === "undefined") {
      setError("Missing or invalid tv_number");
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
          .from("tv_devices")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("tv_number", tvNum);

        if (existingDevices && existingDevices.length > 0) {
          // Device exists, just update its status
          const existing = existingDevices[0];

          // Detect screen orientation
          const screenOrientation =
            window.screen.height > window.screen.width
              ? "portrait"
              : "landscape";

          const { data: device, error } = await supabase
            .from("tv_devices")
            .update({
              connection_status: "online",
              location_id: locationId || null, // Update location if URL specifies a different one
              last_seen_at: new Date().toISOString(),
              last_heartbeat_at: new Date().toISOString(),
              user_agent: navigator.userAgent,
              screen_resolution: `${window.screen.width}x${window.screen.height}`,
              screen_orientation: screenOrientation,
              browser_info: {
                platform: navigator.platform,
                language: navigator.language,
              },
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (error) throw new Error(error.message || JSON.stringify(error));

          setDeviceId(device.id);
          setConnectionStatus("online");
        } else {
          // New device, create it
          // Detect screen orientation
          const screenOrientation =
            window.screen.height > window.screen.width
              ? "portrait"
              : "landscape";

          const deviceData: any = {
            device_identifier: crypto.randomUUID(),
            vendor_id: vendorId,
            location_id: locationId || null,
            tv_number: tvNum,
            device_name: `TV ${tvNum}`,
            connection_status: "online",
            last_seen_at: new Date().toISOString(),
            last_heartbeat_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            screen_orientation: screenOrientation,
            browser_info: {
              platform: navigator.platform,
              language: navigator.language,
            },
          };

          const { data: device, error } = await supabase
            .from("tv_devices")
            .insert(deviceData)
            .select()
            .single();

          if (error) {
            // If duplicate key error, device was created between check and insert - just fetch it
            if (error.message?.includes("duplicate key")) {
              const { data: existingDevice } = await supabase
                .from("tv_devices")
                .select("*")
                .eq("vendor_id", vendorId)
                .eq("tv_number", tvNum)
                .single();

              if (existingDevice) {
                setDeviceId(existingDevice.id);
                setConnectionStatus("online");

                return;
              }
            }
            throw new Error(error.message || JSON.stringify(error));
          }
          if (!device) throw new Error("Device registration returned no data");

          setDeviceId(device.id);
          setConnectionStatus("online");
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Device registration failed:", err);
        }
        setConnectionStatus("error");
        setError(err.message || "Device registration failed");
      }
    };

    registerDevice();

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      if (deviceId) {
        await supabase
          .from("tv_devices")
          .update({
            last_heartbeat_at: new Date().toISOString(),
            connection_status: "online",
          })
          .eq("id", deviceId);
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
        // Use API endpoint to bypass RLS
        const response = await fetch(`/api/display-groups/membership?device_id=${deviceId}`);
        const data = await response.json();

        if (!data.success) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error checking group membership:", data.error);
          }
          return;
        }

        if (data.isMember) {
          setDisplayGroup(data.group);
          setGroupMember(data.member);
        } else {
          setDisplayGroup(null);
          setGroupMember(null);
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error checking group membership:", err);
        }
      }
    };

    checkGroupMembership();
  }, [deviceId]);

  /**
   * Load Vendor Pricing Configs (once, cached)
   */
  // REMOVED: loadVendorConfigs - no longer needed, prices are embedded in products via pricing_data

  /**
   * Load Menu & Products
   */
  const loadMenuAndProducts = useCallback(async () => {
    try {
      // Load vendor info first via API (bypasses RLS)
      if (vendorId && !vendor) {
        try {
          const vendorResponse = await fetch(`/api/tv-display/vendor?vendor_id=${vendorId}`);
          const vendorData = await vendorResponse.json();

          if (vendorData.success && vendorData.vendor) {
            setVendor(vendorData.vendor);
          } else {
            if (process.env.NODE_ENV === "development") {
              logger.error("❌ Error loading vendor:", vendorData.error);
            }
          }
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Failed to fetch vendor:", err);
          }
          // Continue anyway - vendor info is not critical for display
        }
      }

      // Preview mode - load specific menu
      if (menuIdParam) {
        const { data: menu, error } = await supabase
          .from("tv_menus")
          .select("*")
          .eq("id", menuIdParam)
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
          .from("tv_devices")
          .select("active_menu_id")
          .eq("id", deviceId)
          .single();

        if (device?.active_menu_id) {
          const { data: menu } = await supabase
            .from("tv_menus")
            .select("*")
            .eq("id", device.active_menu_id)
            .single();

          if (menu) {
            setActiveMenu(menu);
            await loadProducts(menu);
          } else {
            setActiveMenu(null);
            setProducts([]);
          }
        } else {
          setActiveMenu(null);
          setProducts([]);
        }
      }

      setLoading(false);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to load menu:", err);
      }
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
      // Load promotions first
      // CRITICAL: Disable caching - TV menus must be LIVE
      const promosRes = await fetch(
        `/api/vendor/promotions?vendor_id=${vendorId}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      const promosData = await promosRes.json();
      const activePromotions = promosData.success ? promosData.promotions || [] : [];
      setPromotions(activePromotions);

      // Load products via API (bypasses RLS) - filtered by location inventory
      // CRITICAL: Disable caching - TV menus must be LIVE and reflect inventory instantly
      const productsResponse = await fetch(
        `/api/tv-display/products?vendor_id=${vendorId}&location_id=${locationId}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      const productsData = await productsResponse.json();

      if (!productsData.success) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error fetching products:", productsData.error);
        }
        throw new Error(productsData.error || "Failed to fetch products");
      }

      const productData = productsData.products || [];

      // Debug first product's raw data
      if (productData.length > 0) {
      }

      // Pricing is now embedded in products.pricing_data - no separate config needed

      // Enrich products with actual prices and promotions
      let isFirstProduct = true;
      const enrichedProducts = (productData || []).map((product: any) => {
        // Map database fields to expected fields
        let productWithPricing = {
          ...product,
          image_url: product.featured_image || product.image_url, // Map featured_image to image_url
          // Keep custom_fields as is (NEW SYSTEM ONLY - no conversion to metadata)
          custom_fields: product.custom_fields || [],
        };

        // Pricing tiers are already embedded in product.pricing_tiers from the API
        // No need to fetch separate configs - the TV display API already transformed pricing_data
        if (isFirstProduct && product.pricing_tiers) {
          isFirstProduct = false;
        }

        // Apply promotions if any
        if (activePromotions.length > 0) {
          const priceCalc = calculatePrice(productWithPricing, activePromotions, 1);

          return {
            ...productWithPricing,
            promotion_data: priceCalc.appliedPromotion
              ? {
                  originalPrice: priceCalc.originalPrice,
                  finalPrice: priceCalc.finalPrice,
                  savings: priceCalc.savings,
                  badgeText: priceCalc.badge?.text,
                  badgeColor: priceCalc.badge?.color,
                }
              : null,
          };
        }

        return productWithPricing;
      });

      // Filter products by selected categories (if any)
      let filteredProducts = enrichedProducts;

      // Priority 1: Use menu's configured categories
      // CRITICAL FIX: Use the 'menu' parameter passed to this function, NOT activeMenu state!
      let selectedCategories = menu?.config_data?.categories;
      let filterSource = "menu";

      console.log("🔍 [FILTER DEBUG] menu (param):", menu?.name, menu?.id);
      console.log("🔍 [FILTER DEBUG] menu.config_data:", menu?.config_data);
      console.log("🔍 [FILTER DEBUG] selectedCategories from menu:", selectedCategories);

      // Priority 2: Fall back to display group categories if menu doesn't specify
      if (!selectedCategories || selectedCategories.length === 0) {
        selectedCategories = groupMember?.assigned_categories;
        filterSource = "group";
        console.log("🔍 [FILTER DEBUG] Falling back to group categories:", selectedCategories);
      }

      if (selectedCategories && selectedCategories.length > 0) {
        console.log("🔍 [PRODUCT FILTER] Filtering by categories:", selectedCategories);
        console.log("🔍 [PRODUCT FILTER] Total products before filter:", enrichedProducts.length);

        // Debug: show what categories products have
        if (enrichedProducts.length > 0) {
          const categoryCounts = new Map<string, number>();
          enrichedProducts.forEach((p: any) => {
            const catName = p.primary_category?.name || "NO_CATEGORY";
            categoryCounts.set(catName, (categoryCounts.get(catName) || 0) + 1);
          });
          console.log("🔍 [PRODUCT FILTER] Available categories:", Object.fromEntries(categoryCounts));
        }

        filteredProducts = enrichedProducts.filter((p: any) => {
          const categoryName = p.primary_category?.name;
          const parentCategoryName = p.primary_category?.parent_category?.name;

          // Check if product's category OR parent category matches any selected category
          const directMatch = categoryName && selectedCategories.includes(categoryName);
          const parentMatch = parentCategoryName && selectedCategories.includes(parentCategoryName);
          const matches = directMatch || parentMatch;

          return matches;
        });

        console.log("🔍 [PRODUCT FILTER] Products after filter:", filteredProducts.length);
      } else {
        console.log("🔍 [PRODUCT FILTER] No category filter - showing all products");
      }

      // NOTE: Blueprint pricing removed - we now only use tiered pricing via meta_data->pricing_tiers
      // Old pricing_blueprint_id filtering has been removed

      setProducts(filteredProducts);

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
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to load products:", err);
      }
    }
  };

  useEffect(() => {
    loadMenuAndProducts();
  }, [loadMenuAndProducts]);

  /**
   * AUTO-REFRESH: Reload products periodically to show live inventory changes
   * CRITICAL: TV menus must reflect inventory instantly - this is mission critical
   */
  useEffect(() => {
    if (!activeMenu || !vendorId) return;

    // Get auto-refresh interval from menu (in seconds, default 5s for INSTANT updates)
    const refreshInterval = (activeMenu.auto_refresh_interval || 5) * 1000;

    const interval = setInterval(() => {
      loadProducts(activeMenu);
    }, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [activeMenu?.id, activeMenu?.auto_refresh_interval, vendorId]);

  /**
   * Real-time subscription for device changes (menu assignment)
   */
  useEffect(() => {
    // Skip real-time subscription in preview mode
    if (isPreview) return;
    if (!deviceId) return;

    const channel = supabase
      .channel(`device-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tv_devices",
          filter: `id=eq.${deviceId}`,
        },
        (payload) => {
          const newMenuId = payload.new.active_menu_id;
          const currentMenuId = activeMenu?.id || null;

          // If menu changed (including to/from null), reload immediately
          if (newMenuId !== currentMenuId) {
            loadMenuAndProducts();
          }
        },
      )
      .subscribe((status) => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, activeMenu?.id, loadMenuAndProducts, isPreview]);

  /**
   * Real-time subscription for menu changes (theme, name, etc.)
   */
  useEffect(() => {
    if (!activeMenu?.id) return;

    const channel = supabase
      .channel(`menu-${activeMenu.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tv_menus",
          filter: `id=eq.${activeMenu.id}`,
        },
        (payload) => {
          // Force immediate reload
          setActiveMenu(payload.new);
          loadProducts(payload.new);
        },
      )
      .subscribe((status) => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeMenu?.id, isPreview]);

  /**
   * Real-time subscription for display group changes (pricing tier, display config, etc.)
   */
  useEffect(() => {
    if (!displayGroup?.id) return;

    const channel = supabase
      .channel(`display-group-${displayGroup.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tv_display_groups",
          filter: `id=eq.${displayGroup.id}`,
        },
        (payload) => {
          // Update display group immediately
          setDisplayGroup(payload.new);

          // Force products reload with new configuration
          if (activeMenu) {
            loadProducts(activeMenu);
          }
        },
      )
      .subscribe((status) => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [displayGroup?.id, activeMenu]);

  /**
   * AUTO CAROUSEL: Rotates pages based on menu configuration
   */
  useEffect(() => {
    if (products.length === 0 || !displayGroup) {
      return;
    }

    // Get carousel configuration from menu
    const enableCarousel = activeMenu?.config_data?.enableCarousel !== false; // Default true for backward compatibility
    const carouselInterval = (activeMenu?.config_data?.carouselInterval || 5) * 1000; // Convert seconds to milliseconds, default 5s

    // If carousel is disabled, don't set up any intervals
    if (!enableCarousel) {
      return;
    }

    // Check if split view mode
    const layoutStyle = activeMenu?.config_data?.layoutStyle || "single";
    const isSplitView = layoutStyle === "split";

    // Calculate grid capacity
    let gridColumns = displayGroup.shared_grid_columns || 6;
    const gridRows = displayGroup.shared_grid_rows || 5;

    // Adjust for split view - each side has half the columns
    if (isSplitView) {
      gridColumns = Math.max(2, Math.floor(gridColumns / 2));

      // In split view, each side has independent carousel
      const splitLeftCategory = activeMenu?.config_data?.splitLeftCategory;
      const splitRightCategory = activeMenu?.config_data?.splitRightCategory;

      const leftProducts = products.filter(
        (p: any) => p.primary_category?.name === splitLeftCategory,
      );
      const rightProducts = products.filter(
        (p: any) => p.primary_category?.name === splitRightCategory,
      );

      const productsPerPage = gridColumns * gridRows;
      const leftPages = Math.ceil(leftProducts.length / productsPerPage);
      const rightPages = Math.ceil(rightProducts.length / productsPerPage);

      // Setup independent carousel for left side
      let leftInterval: NodeJS.Timeout | null = null;
      if (leftPages > 1) {
        leftInterval = setInterval(() => {
          setCarouselPageLeft((prev) => {
            const next = (prev + 1) % leftPages;
            return next;
          });
        }, carouselInterval);
      } else {
        setCarouselPageLeft(0);
      }

      // Setup independent carousel for right side
      let rightInterval: NodeJS.Timeout | null = null;
      if (rightPages > 1) {
        rightInterval = setInterval(() => {
          setCarouselPageRight((prev) => {
            const next = (prev + 1) % rightPages;
            return next;
          });
        }, carouselInterval);
      } else {
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

      const interval = setInterval(() => {
        setCarouselPage((prev) => {
          const next = (prev + 1) % totalPages;
          return next;
        });
      }, carouselInterval); // Using configured interval instead of hardcoded 5000

      return () => {
        clearInterval(interval);
      };
    }
  }, [
    products.length,
    displayGroup?.shared_grid_columns,
    displayGroup?.shared_grid_rows,
    activeMenu?.config_data?.layoutStyle,
    activeMenu?.config_data?.splitLeftCategory,
    activeMenu?.config_data?.splitRightCategory,
  ]);

  // Loading State
  if (loading) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center bg-black"
        style={{
          padding:
            "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
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
          padding:
            "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
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

  // No Content State - Apply theme even while loading
  if (!activeMenu) {
    // Get theme even when no menu - URL override or default
    const loadingThemeId = themeOverride || null;
    const loadingTheme = getTheme(loadingThemeId);

    // Determine if background is gradient or solid color
    const isGradient = loadingTheme.styles.background?.includes('gradient');

    return (
      <div
        className="w-screen h-screen flex items-center justify-center"
        style={{
          // Use backgroundImage for gradients, backgroundColor for solid colors
          ...(isGradient
            ? { backgroundImage: loadingTheme.styles.background }
            : { backgroundColor: loadingTheme.styles.background }),
          backgroundSize: loadingTheme.styles.backgroundSize,
          animation: loadingTheme.styles.animation,
          padding:
            "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
        }}
      >
        <div className="text-center" style={{ color: loadingTheme.styles.productName.color }}>
          {/* Show vendor logo if available */}
          {vendor?.logo_url ? (
            <div className="mb-8">
              <img
                src={vendor.logo_url}
                alt={vendor.store_name}
                className="mx-auto max-w-md max-h-64 object-contain"
                style={{
                  filter: "drop-shadow(0 0 40px rgba(0, 0, 0, 0.3))",
                }}
              />
            </div>
          ) : (
            <div className="text-6xl mb-4">📺</div>
          )}
          <h1 className="text-3xl font-bold mb-2">{vendor?.store_name || "Display Ready"}</h1>
          <p className="text-xl opacity-60">
            {loading ? "Loading menu..." : "No menu assigned"}
          </p>
          <p className="text-sm opacity-40 mt-2">
            {loading ? "Please wait" : "Please assign a menu from the dashboard"}
          </p>
          {deviceId && (
            <p className="text-xs opacity-30 mt-6">Device ID: {deviceId.substring(0, 8)}...</p>
          )}
        </div>
      </div>
    );
  }

  // Get theme - URL override takes priority (for instant atomic updates), then menu theme, then display group theme
  const themeId = themeOverride || activeMenu.theme || displayGroup?.shared_theme;
  const theme = getTheme(themeId);

  // Comprehensive theme debugging
  console.log("🎨 [TV-DISPLAY] Theme Resolution:", {
    themeOverride,
    menuTheme: activeMenu?.theme,
    groupTheme: displayGroup?.shared_theme,
    finalThemeId: themeId,
    themeFound: !!theme,
    themeName: theme?.name,
    hasAnimation: !!theme?.styles?.animation,
    hasBackgroundSize: !!theme?.styles?.backgroundSize,
  });

  // Check if split view mode
  const layoutStyle = activeMenu?.config_data?.layoutStyle || "single";
  const isSplitView = layoutStyle === "split";

  // Determine if background is gradient or solid color
  const isGradient = theme.styles.background?.includes('gradient');

  // Render Menu
  return (
    <motion.div
      key={theme.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-screen h-screen overflow-hidden relative"
      style={{
        // Use backgroundImage for gradients, backgroundColor for solid colors
        ...(isGradient
          ? { backgroundImage: theme.styles.background }
          : { backgroundColor: theme.styles.background }),
        backgroundSize: theme.styles.backgroundSize,
        animation: theme.styles.animation,
        padding:
          "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
        // Zoom-independent rendering: Use CSS transform scale based on viewport size
        // This ensures consistent display across different browsers and zoom levels
        transformOrigin: "center center",
      }}
    >
      {/* Menu Content */}
      <div className="absolute inset-0 overflow-hidden p-4">
        <div className="h-full w-full flex flex-col">
          {/* Category Header - Compact and always on top (hidden in split view) */}
          {(() => {
            // Use same category priority logic as product filtering
            // Priority 1: Menu categories, Priority 2: Group member categories
            const categoriesRaw =
              activeMenu?.config_data?.categories || groupMember?.assigned_categories || [];
            // Remove duplicates (case-insensitive)
            const displayCategories = Array.from(
              new Set(categoriesRaw.map((cat: string) => cat.toLowerCase()))
            ).map((cat) => categoriesRaw.find((c: string) => c.toLowerCase() === cat) || cat);

            return (
              !isSplitView &&
              displayCategories.length > 0 && (
                <div className="text-center flex-shrink-0 mb-3">
                  <h1
                    className="uppercase tracking-[0.2em] font-black"
                    style={{
                      color: theme.styles.productName.color,
                      fontSize: "clamp(2rem, 4vw, 4.5rem)",
                      lineHeight: 1,
                      letterSpacing: "0.2em",
                      opacity: 0.9,
                    }}
                  >
                    {displayCategories.join(" • ")}
                  </h1>
                </div>
              )
            );
          })()}

          {/* Menu Header - Full header with name and description (removed display_config check) */}
          {false && (
            <div className="text-center flex-shrink-0 mb-4">
              <h1
                className="uppercase tracking-[0.15em]"
                style={{
                  ...theme.styles.menuTitle,
                  fontSize: "5rem",
                  lineHeight: 1,
                  letterSpacing: "0.15em",
                }}
              >
                {activeMenu.name}
              </h1>
              {activeMenu.description && (
                <p
                  className="uppercase tracking-wider font-medium mt-2"
                  style={{
                    ...theme.styles.menuDescription,
                    fontSize: "2rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {activeMenu.description}
                </p>
              )}
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 ? (
            (() => {
              // Use display group settings if available, otherwise fall back to menu settings
              const displayMode =
                displayGroup?.shared_display_mode || activeMenu.display_mode || "dense";

              // SMART GRID: Default to 30 products, user can adjust manually
              const totalProducts = products.length;
              const maxProductsToShow = 30; // Default limit

              let gridColumns, gridRows;

              // Check if user has manually configured the grid
              if (displayGroup?.shared_grid_columns && displayGroup?.shared_grid_rows) {
                // User manual configuration - respect it exactly
                gridColumns = displayGroup.shared_grid_columns;
                gridRows = displayGroup.shared_grid_rows;
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
              }

              // Get display mode (grid or list)
              const menuDisplayMode = activeMenu?.config_data?.displayMode || "grid";

              const productsPerPage = gridColumns * gridRows;

              // Carousel only applies to GRID mode, not LIST mode
              // List mode shows all products in flowing columns
              const needsCarousel = menuDisplayMode === "grid" && products.length > productsPerPage;

              // AUTO CAROUSEL: Only for grid mode
              let productsToShow;
              if (menuDisplayMode === "list") {
                // List mode: ALWAYS show all products (no carousel)
                productsToShow = products;
              } else if (needsCarousel) {
                // Grid carousel mode - rotate through pages every 5 seconds
                const start = carouselPage * productsPerPage;
                const end = start + productsPerPage;
                productsToShow = products.slice(start, end);
              } else {
                // Grid mode: All products fit - show them all
                productsToShow = products;
              }

              // UNIVERSAL SMART GROUPING: Works for ALL categories automatically
              // Finds and groups by *_type fields (strain_type, beverage_type, etc.)
              productsToShow = smartGroupProducts(productsToShow, activeMenu?.primary_category);

              // Adjust grid for split view - reduce columns to prevent squashing
              const adjustedGridColumns = isSplitView
                ? Math.max(2, Math.floor(gridColumns / 2))
                : gridColumns;
              const adjustedGridRows = gridRows;

              // Determine if we should use compact/bulk mode
              // Use compact cards to fit up to 15 items per column (30 total)
              // Activate compact mode at 15+ products to ensure everything fits
              const isBulkMode = theme.id === "bulk" || totalProducts > 15;
              const useCompactCards = isBulkMode && menuDisplayMode === "list";

              // For list mode: use 2-column layout to fit more content without scrolling
              // RESPONSIVE: Use 2 columns only when:
              // - NOT split view
              // - Viewport is wide enough (>= 1200px)
              // - NOT portrait orientation
              // - Product count > 12 (prevents scrolling/carousel)
              // Max capacity: 15 items per column = 30 total with compact cards
              const isNarrowViewport = viewportWidth > 0 && viewportWidth < 1200;
              const shouldStack = isSplitView || isPortrait || isNarrowViewport;
              const listColumns = shouldStack ? 1 : totalProducts > 12 ? 2 : 1;

              // Dynamic grid classes based on display mode
              const gridClasses =
                menuDisplayMode === "list"
                  ? listColumns > 1
                    ? `grid gap-x-4`
                    : "flex flex-col"
                  : `grid gap-2`;

              const gridStyle =
                menuDisplayMode === "list"
                  ? {
                      height: "100%",
                      width: "100%",
                      ...(listColumns > 1 && {
                        gridTemplateColumns: `repeat(${listColumns}, 1fr)`,
                        gridAutoRows: "min-content",
                        alignContent: "start",
                      }),
                    }
                  : {
                      gridTemplateColumns: `repeat(${adjustedGridColumns}, 1fr)`,
                      gridTemplateRows: `repeat(${adjustedGridRows}, 1fr)`,
                      maxHeight: "100%",
                      maxWidth: "100%",
                    };

              // Get category pricing configuration from menu
              const categoryPricingConfig: CategoryPricingConfig =
                activeMenu?.config_data?.categoryPricingConfig || {};

              // Helper function to get price breaks for a product based on its category
              const getPriceBreaksForProduct = (product: any): string[] => {
                const category = product.primary_category?.name || product.custom_fields?.category;
                if (!category) return [];

                // Case-insensitive lookup: find matching key in categoryPricingConfig
                const configKey = Object.keys(categoryPricingConfig).find(
                  (key) => key.toLowerCase() === category.toLowerCase(),
                );
                const categoryConfig = configKey ? categoryPricingConfig[configKey] : null;
                return categoryConfig?.selected || [];
              };

              // Split view rendering
              if (isSplitView) {
                const splitLeftCategory = activeMenu?.config_data?.splitLeftCategory;
                const splitLeftTitle = activeMenu?.config_data?.splitLeftTitle;
                const splitRightCategory = activeMenu?.config_data?.splitRightCategory;
                const splitRightTitle = activeMenu?.config_data?.splitRightTitle;

                // Get per-side configurations
                const splitLeftCustomFields =
                  activeMenu?.config_data?.splitLeftCustomFields ||
                  activeMenu?.config_data?.customFields ||
                  [];
                const splitRightCustomFields =
                  activeMenu?.config_data?.splitRightCustomFields ||
                  activeMenu?.config_data?.customFields ||
                  [];

                // Get category-specific price breaks for each side
                const splitLeftPriceBreaks = splitLeftCategory
                  ? categoryPricingConfig[splitLeftCategory]?.selected || []
                  : [];
                const splitRightPriceBreaks = splitRightCategory
                  ? categoryPricingConfig[splitRightCategory]?.selected || []
                  : [];

                // Filter products for each side from ALL products (not productsToShow)
                // Use case-insensitive matching for category names
                // Support both direct category match AND parent category match (for nested categories)
                let allLeftProducts = products.filter((p: any) => {
                  const categoryName = p.primary_category?.name?.toLowerCase();
                  const parentCategoryName =
                    p.primary_category?.parent_category?.name?.toLowerCase();
                  const targetCategory = splitLeftCategory?.toLowerCase();
                  return categoryName === targetCategory || parentCategoryName === targetCategory;
                });
                let allRightProducts = products.filter((p: any) => {
                  const categoryName = p.primary_category?.name?.toLowerCase();
                  const parentCategoryName =
                    p.primary_category?.parent_category?.name?.toLowerCase();
                  const targetCategory = splitRightCategory?.toLowerCase();
                  return categoryName === targetCategory || parentCategoryName === targetCategory;
                });

                // UNIVERSAL SMART GROUPING: Apply to both sides independently
                // Automatically detects and groups by category-appropriate *_type fields

                allLeftProducts = smartGroupProducts(allLeftProducts);
                allRightProducts = smartGroupProducts(allRightProducts);

                // Apply independent pagination for each side
                // CRITICAL FIX: List mode shows ALL products vertically (no pagination needed)
                // Only paginate in grid mode where space is limited
                const isListMode = menuDisplayMode === "list";
                const productsPerPage = isListMode ? 999 : adjustedGridColumns * adjustedGridRows;

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

                return (
                  <>
                    <div
                      className={`w-full h-full flex gap-4 ${isPortrait ? "flex-col" : "flex-col lg:flex-row"}`}
                      style={{ flex: "1 1 0", minHeight: 0 }}
                    >
                      {/* Left Side */}
                      <div
                        className="flex-1 flex flex-col"
                        style={{
                          minHeight: 0,
                          paddingRight: isPortrait ? "0" : "0.75%",
                          borderRight: isPortrait
                            ? "none"
                            : `1px solid ${theme.styles.productName.color}15`,
                          borderBottom: isPortrait
                            ? `1px solid ${theme.styles.productName.color}15`
                            : "none",
                          paddingBottom: isPortrait ? "0.75%" : "0",
                        }}
                      >
                        {(() => {
                          const { grouped: leftGrouped, ungrouped: leftUngrouped } =
                            groupProductsBySubcategory(leftProducts);
                          const hasLeftSubcategories = leftGrouped.size > 0;

                          // Only show main header if:
                          // 1. There's a custom title (user override), OR
                          // 2. There are NO subcategories (regular category display)
                          const shouldShowHeader = splitLeftTitle || !hasLeftSubcategories;
                          const headerText = splitLeftTitle || splitLeftCategory;

                          return (
                            <>
                              {shouldShowHeader && (splitLeftTitle || splitLeftCategory) && (
                                <h2
                                  className="font-black uppercase tracking-wide text-center mb-2 flex-shrink-0"
                                  style={{
                                    color: theme.styles.productName.color,
                                    fontSize: "clamp(1.5rem, 3vw, 4rem)",
                                    lineHeight: 0.9,
                                  }}
                                >
                                  {headerText}
                                </h2>
                              )}
                            <div
                              className={`w-full ${hasLeftSubcategories ? "overflow-y-auto" : gridClasses}`}
                              style={{
                                ...(!hasLeftSubcategories && gridStyle),
                                flex: "1 1 0",
                                minHeight: 0,
                              }}
                            >
                              {hasLeftSubcategories ? (
                                // Grouped by Subcategory Display
                                <div className="space-y-4 pb-4">
                                  {Array.from(leftGrouped.entries()).map(
                                    ([subcategoryName, subcategoryProducts]) => (
                                      <SubcategoryGroup
                                        key={subcategoryName}
                                        subcategoryName={subcategoryName}
                                        products={subcategoryProducts}
                                        theme={theme}
                                        displayMode={menuDisplayMode}
                                        gridColumns={adjustedGridColumns}
                                        gridRows={adjustedGridRows}
                                        visiblePriceBreaks={splitLeftPriceBreaks}
                                        customFieldsToShow={splitLeftCustomFields}
                                        customFieldsConfig={
                                          activeMenu?.config_data?.customFieldsConfig || {}
                                        }
                                        hideAllFieldLabels={
                                          activeMenu?.config_data?.hideAllFieldLabels || false
                                        }
                                        displayConfig={displayGroup?.display_config}
                                        useCompactCards={useCompactCards}
                                        splitSide="left"
                                      />
                                    ),
                                  )}
                                  {leftUngrouped.length > 0 && (
                                    <div className={gridClasses} style={gridStyle}>
                                      {menuDisplayMode === "list"
                                        ? leftUngrouped.map((product: any, index: number) => {
                                            const CardComponent = useCompactCards
                                              ? CompactListProductCard
                                              : ListProductCard;
                                            return (
                                              <CardComponent
                                                key={product.id}
                                                product={product}
                                                theme={theme}
                                                index={index}
                                                visiblePriceBreaks={splitLeftPriceBreaks}
                                                customFieldsToShow={splitLeftCustomFields}
                                                customFieldsConfig={
                                                  activeMenu?.config_data?.customFieldsConfig || {}
                                                }
                                                hideAllFieldLabels={
                                                  activeMenu?.config_data?.hideAllFieldLabels ||
                                                  false
                                                }
                                              />
                                            );
                                          })
                                        : leftUngrouped.map((product: any, index: number) => (
                                            <MinimalProductCard
                                              key={product.id}
                                              product={product}
                                              theme={theme}
                                              index={index}
                                              visiblePriceBreaks={splitLeftPriceBreaks}
                                              displayConfig={displayGroup?.display_config}
                                              customFieldsToShow={splitLeftCustomFields}
                                              customFieldsConfig={
                                                activeMenu?.config_data?.customFieldsConfig || {}
                                              }
                                              hideAllFieldLabels={
                                                activeMenu?.config_data?.hideAllFieldLabels || false
                                              }
                                              splitSide="left"
                                              gridColumns={adjustedGridColumns}
                                            />
                                          ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // No subcategories - Regular flat display
                                <>
                                  {menuDisplayMode === "list"
                                    ? // List View - Apple Store style (adaptive compact/regular)
                                      leftProducts.map((product: any, index: number) => {
                                        const CardComponent = useCompactCards
                                          ? CompactListProductCard
                                          : ListProductCard;
                                        return (
                                          <CardComponent
                                            key={product.id}
                                            product={product}
                                            theme={theme}
                                            index={index}
                                            visiblePriceBreaks={splitLeftPriceBreaks}
                                            customFieldsToShow={splitLeftCustomFields}
                                            customFieldsConfig={
                                              activeMenu?.config_data?.customFieldsConfig || {}
                                            }
                                            hideAllFieldLabels={
                                              activeMenu?.config_data?.hideAllFieldLabels || false
                                            }
                                          />
                                        );
                                      })
                                    : // Grid View - Card style
                                      leftProducts.map((product: any, index: number) => (
                                        <MinimalProductCard
                                          key={product.id}
                                          product={product}
                                          theme={theme}
                                          index={index}
                                          visiblePriceBreaks={splitLeftPriceBreaks}
                                          displayConfig={displayGroup?.display_config}
                                          customFieldsToShow={splitLeftCustomFields}
                                          customFieldsConfig={
                                            activeMenu?.config_data?.customFieldsConfig || {}
                                          }
                                          hideAllFieldLabels={
                                            activeMenu?.config_data?.hideAllFieldLabels || false
                                          }
                                          splitSide="left"
                                          gridColumns={adjustedGridColumns}
                                        />
                                      ))}
                                </>
                              )}
                            </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Elegant Divider - Steve Jobs style */}
                      <div
                        style={{
                          width: "1px",
                          background: `linear-gradient(to bottom, transparent, ${theme.styles.productName.color}30 20%, ${theme.styles.productName.color}30 80%, transparent)`,
                          alignSelf: "stretch",
                          margin: "0 -0.5%",
                        }}
                      />

                      {/* Right Side */}
                      <div
                        className="flex-1 flex flex-col"
                        style={{
                          minHeight: 0,
                          paddingLeft: "0.75%",
                        }}
                      >
                        {(() => {
                          const { grouped: rightGrouped, ungrouped: rightUngrouped } =
                            groupProductsBySubcategory(rightProducts);
                          const hasRightSubcategories = rightGrouped.size > 0;

                          // Only show main header if:
                          // 1. There's a custom title (user override), OR
                          // 2. There are NO subcategories (regular category display)
                          const shouldShowHeader = splitRightTitle || !hasRightSubcategories;
                          const headerText = splitRightTitle || splitRightCategory;

                          return (
                            <>
                              {shouldShowHeader && (splitRightTitle || splitRightCategory) && (
                                <h2
                                  className="font-black uppercase tracking-wide text-center mb-2 flex-shrink-0"
                                  style={{
                                    color: theme.styles.productName.color,
                                    fontSize: "clamp(1.5rem, 3vw, 4rem)",
                                    lineHeight: 0.9,
                                  }}
                                >
                                  {headerText}
                                </h2>
                              )}
                            <div
                              className={`w-full ${hasRightSubcategories ? "overflow-y-auto" : gridClasses}`}
                              style={{
                                ...(!hasRightSubcategories && gridStyle),
                                flex: "1 1 0",
                                minHeight: 0,
                              }}
                            >
                              {hasRightSubcategories ? (
                                // Grouped by Subcategory Display
                                <div className="space-y-4 pb-4">
                                  {Array.from(rightGrouped.entries()).map(
                                    ([subcategoryName, subcategoryProducts]) => (
                                      <SubcategoryGroup
                                        key={subcategoryName}
                                        subcategoryName={subcategoryName}
                                        products={subcategoryProducts}
                                        theme={theme}
                                        displayMode={menuDisplayMode}
                                        gridColumns={adjustedGridColumns}
                                        gridRows={adjustedGridRows}
                                        visiblePriceBreaks={splitRightPriceBreaks}
                                        customFieldsToShow={splitRightCustomFields}
                                        customFieldsConfig={
                                          activeMenu?.config_data?.customFieldsConfig || {}
                                        }
                                        hideAllFieldLabels={
                                          activeMenu?.config_data?.hideAllFieldLabels || false
                                        }
                                        displayConfig={displayGroup?.display_config}
                                        useCompactCards={useCompactCards}
                                        splitSide="right"
                                      />
                                    ),
                                  )}
                                  {rightUngrouped.length > 0 && (
                                    <div className={gridClasses} style={gridStyle}>
                                      {menuDisplayMode === "list"
                                        ? rightUngrouped.map((product: any, index: number) => {
                                            const CardComponent = useCompactCards
                                              ? CompactListProductCard
                                              : ListProductCard;
                                            return (
                                              <CardComponent
                                                key={product.id}
                                                product={product}
                                                theme={theme}
                                                index={index}
                                                visiblePriceBreaks={splitRightPriceBreaks}
                                                customFieldsToShow={splitRightCustomFields}
                                                customFieldsConfig={
                                                  activeMenu?.config_data?.customFieldsConfig || {}
                                                }
                                                hideAllFieldLabels={
                                                  activeMenu?.config_data?.hideAllFieldLabels ||
                                                  false
                                                }
                                              />
                                            );
                                          })
                                        : rightUngrouped.map((product: any, index: number) => (
                                            <MinimalProductCard
                                              key={product.id}
                                              product={product}
                                              theme={theme}
                                              index={index}
                                              visiblePriceBreaks={splitRightPriceBreaks}
                                              displayConfig={displayGroup?.display_config}
                                              customFieldsToShow={splitRightCustomFields}
                                              customFieldsConfig={
                                                activeMenu?.config_data?.customFieldsConfig || {}
                                              }
                                              hideAllFieldLabels={
                                                activeMenu?.config_data?.hideAllFieldLabels || false
                                              }
                                              splitSide="right"
                                              gridColumns={adjustedGridColumns}
                                            />
                                          ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // No subcategories - Regular flat display
                                <>
                                  {menuDisplayMode === "list"
                                    ? // List View - Apple Store style (adaptive compact/regular)
                                      rightProducts.map((product: any, index: number) => {
                                        const CardComponent = useCompactCards
                                          ? CompactListProductCard
                                          : ListProductCard;
                                        return (
                                          <CardComponent
                                            key={product.id}
                                            product={product}
                                            theme={theme}
                                            index={index}
                                            visiblePriceBreaks={splitRightPriceBreaks}
                                            customFieldsToShow={splitRightCustomFields}
                                            customFieldsConfig={
                                              activeMenu?.config_data?.customFieldsConfig || {}
                                            }
                                            hideAllFieldLabels={
                                              activeMenu?.config_data?.hideAllFieldLabels || false
                                            }
                                          />
                                        );
                                      })
                                    : // Grid View - Card style
                                      rightProducts.map((product: any, index: number) => (
                                        <MinimalProductCard
                                          key={product.id}
                                          product={product}
                                          theme={theme}
                                          index={index}
                                          visiblePriceBreaks={splitRightPriceBreaks}
                                          displayConfig={displayGroup?.display_config}
                                          customFieldsToShow={splitRightCustomFields}
                                          customFieldsConfig={
                                            activeMenu?.config_data?.customFieldsConfig || {}
                                          }
                                          hideAllFieldLabels={
                                            activeMenu?.config_data?.hideAllFieldLabels || false
                                          }
                                          splitSide="right"
                                          gridColumns={adjustedGridColumns}
                                        />
                                      ))}
                                </>
                              )}
                            </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                );
              }

              // Single view rendering (default)
              // Check if we should use grouped subcategory display
              const { grouped, ungrouped } = groupProductsBySubcategory(productsToShow);
              const hasSubcategories = grouped.size > 0;

              return (
                <>
                  <div
                    className={`w-full ${hasSubcategories ? "overflow-y-auto" : gridClasses}`}
                    style={{
                      ...(!hasSubcategories && gridStyle),
                      flex: "1 1 0",
                      minHeight: 0, // Critical: allows grid to shrink
                    }}
                  >
                    {hasSubcategories ? (
                      // Grouped by Subcategory Display
                      <div className="space-y-6 pb-4">
                        {Array.from(grouped.entries()).map(
                          ([subcategoryName, subcategoryProducts]) => (
                            <SubcategoryGroup
                              key={subcategoryName}
                              subcategoryName={subcategoryName}
                              products={subcategoryProducts}
                              theme={theme}
                              displayMode={menuDisplayMode}
                              gridColumns={gridColumns}
                              gridRows={gridRows}
                              visiblePriceBreaks={getPriceBreaksForProduct(subcategoryProducts[0])}
                              customFieldsToShow={activeMenu?.config_data?.customFields || []}
                              customFieldsConfig={activeMenu?.config_data?.customFieldsConfig || {}}
                              hideAllFieldLabels={
                                activeMenu?.config_data?.hideAllFieldLabels || false
                              }
                              displayConfig={displayGroup?.display_config}
                              useCompactCards={useCompactCards}
                            />
                          ),
                        )}
                        {/* Render ungrouped products at the end if any */}
                        {ungrouped.length > 0 && (
                          <div className={gridClasses} style={gridStyle}>
                            {menuDisplayMode === "list"
                              ? ungrouped.map((product: any, index: number) => {
                                  const CardComponent = useCompactCards
                                    ? CompactListProductCard
                                    : ListProductCard;
                                  return (
                                    <CardComponent
                                      key={product.id}
                                      product={product}
                                      theme={theme}
                                      index={index}
                                      visiblePriceBreaks={getPriceBreaksForProduct(product)}
                                      customFieldsToShow={
                                        activeMenu?.config_data?.customFields || []
                                      }
                                      customFieldsConfig={
                                        activeMenu?.config_data?.customFieldsConfig || {}
                                      }
                                      hideAllFieldLabels={
                                        activeMenu?.config_data?.hideAllFieldLabels || false
                                      }
                                    />
                                  );
                                })
                              : ungrouped.map((product: any, index: number) => (
                                  <MinimalProductCard
                                    key={product.id}
                                    product={product}
                                    theme={theme}
                                    index={index}
                                    visiblePriceBreaks={getPriceBreaksForProduct(product)}
                                    displayConfig={displayGroup?.display_config}
                                    customFieldsToShow={activeMenu?.config_data?.customFields || []}
                                    customFieldsConfig={
                                      activeMenu?.config_data?.customFieldsConfig || {}
                                    }
                                    hideAllFieldLabels={
                                      activeMenu?.config_data?.hideAllFieldLabels || false
                                    }
                                    gridColumns={gridColumns}
                                  />
                                ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // No subcategories - Regular flat display
                      <>
                        {menuDisplayMode === "list"
                          ? // List View - Apple Store style (adaptive compact/regular)
                            productsToShow.map((product: any, index: number) => {
                              const CardComponent = useCompactCards
                                ? CompactListProductCard
                                : ListProductCard;
                              return (
                                <CardComponent
                                  key={product.id}
                                  product={product}
                                  theme={theme}
                                  index={index}
                                  visiblePriceBreaks={getPriceBreaksForProduct(product)}
                                  customFieldsToShow={activeMenu?.config_data?.customFields || []}
                                  customFieldsConfig={
                                    activeMenu?.config_data?.customFieldsConfig || {}
                                  }
                                  hideAllFieldLabels={
                                    activeMenu?.config_data?.hideAllFieldLabels || false
                                  }
                                />
                              );
                            })
                          : // Grid View - Card style
                            productsToShow.map((product: any, index: number) => (
                              <MinimalProductCard
                                key={product.id}
                                product={product}
                                theme={theme}
                                index={index}
                                visiblePriceBreaks={getPriceBreaksForProduct(product)}
                                displayConfig={displayGroup?.display_config}
                                customFieldsToShow={activeMenu?.config_data?.customFields || []}
                                customFieldsConfig={
                                  activeMenu?.config_data?.customFieldsConfig || {}
                                }
                                hideAllFieldLabels={
                                  activeMenu?.config_data?.hideAllFieldLabels || false
                                }
                                gridColumns={gridColumns}
                              />
                            ))}
                      </>
                    )}
                  </div>

                  {/* Carousel Page Indicators */}
                  {needsCarousel &&
                    (() => {
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
                                width: i === carouselPage ? "28px" : "8px",
                                height: "8px",
                                background:
                                  i === carouselPage
                                    ? theme.styles.price.color
                                    : theme.styles.productDescription.color,
                                opacity: i === carouselPage ? 1 : 0.3,
                              }}
                            />
                          ))}
                        </div>
                      );
                    })()}
                </>
              );
            })()
          ) : (
            <div
              className="text-center flex-1 flex items-center justify-center"
              style={{ color: theme.styles.productDescription.color }}
            >
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
            connectionStatus === "online"
              ? "bg-green-400 shadow-lg shadow-green-400/50"
              : connectionStatus === "error"
                ? "bg-red-400 shadow-lg shadow-red-400/50"
                : "bg-gray-400"
          }`}
        />
        <span className="text-white text-xs font-bold uppercase tracking-wider">
          {connectionStatus === "online"
            ? "Connected"
            : connectionStatus === "error"
              ? "Error"
              : "Offline"}
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
