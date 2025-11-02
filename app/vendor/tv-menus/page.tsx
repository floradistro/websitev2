'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tv, X, ExternalLink, Circle, Pencil, Trash2, Palette, LayoutGrid, RotateCw, Sparkles, Grid3x3 } from 'lucide-react';
import { themes, getTheme, type TVTheme } from '@/lib/themes';
import { type CategoryPricingConfig } from '@/lib/category-pricing-defaults';
import CategorySelector from '@/components/tv-menus/CategorySelector';
import DisplayConfigWizard from '@/components/ai/DisplayConfigWizard';
import AIRecommendationViewer from '@/components/ai/AIRecommendationViewer';
import DisplayGroupManager from '@/components/display-groups/DisplayGroupManager';
import MenuEditorModal from '@/components/tv-menus/MenuEditorModal';

interface Location {
  id: string;
  name: string;
}

interface TVDevice {
  id: string;
  tv_number: number;
  device_name: string;
  connection_status: 'online' | 'offline' | 'error';
  active_menu_id: string | null;
  location_id: string | null;
  last_heartbeat_at: string;
}

interface TVMenu {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  location_id: string | null;
  config_data: any;
  theme?: string;
}

export default function SimpleTVMenusPage() {
  const { vendor } = useAppAuth();

  // State
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [menus, setMenus] = useState<TVMenu[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit/Delete state
  const [editingMenu, setEditingMenu] = useState<TVMenu | null>(null);
  const [editMenuName, setEditMenuName] = useState('');
  const [editMenuDescription, setEditMenuDescription] = useState('');
  const [editMenuTheme, setEditMenuTheme] = useState('midnight-elegance');
  const [editMenuDisplayMode, setEditMenuDisplayMode] = useState<'dense' | 'carousel'>('dense');
  const [editorTab, setEditorTab] = useState<'content' | 'layout' | 'style'>('content');
  const [editMenuCategories, setEditMenuCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [editMenuCustomFields, setEditMenuCustomFields] = useState<string[]>([]);
  const [availableCustomFields, setAvailableCustomFields] = useState<string[]>([]);

  // Grid configuration - moved from display groups
  const [gridColumns, setGridColumns] = useState(6);
  const [gridRows, setGridRows] = useState(5);

  // New comprehensive menu config state
  const [customFieldsConfig, setCustomFieldsConfig] = useState<{ [field: string]: { showLabel: boolean } }>({});
  const [hideAllFieldLabels, setHideAllFieldLabels] = useState(false);

  // Split view / dual category state - with per-side configuration
  const [layoutStyle, setLayoutStyle] = useState<'single' | 'split'>('single');
  const [splitLeftCategory, setSplitLeftCategory] = useState('');
  const [splitLeftTitle, setSplitLeftTitle] = useState('');
  const [splitLeftCustomFields, setSplitLeftCustomFields] = useState<string[]>([]);
  const [splitLeftPriceBreaks, setSplitLeftPriceBreaks] = useState<string[]>([]);
  const [splitRightCategory, setSplitRightCategory] = useState('');
  const [splitRightTitle, setSplitRightTitle] = useState('');
  const [splitRightCustomFields, setSplitRightCustomFields] = useState<string[]>([]);
  const [splitRightPriceBreaks, setSplitRightPriceBreaks] = useState<string[]>([]);

  // Carousel / Auto-slide configuration
  const [enableCarousel, setEnableCarousel] = useState(true); // Enable auto-carousel when products exceed grid
  const [carouselInterval, setCarouselInterval] = useState(5); // Seconds between slides

  const [deletingMenu, setDeletingMenu] = useState<TVMenu | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<TVDevice | null>(null);
  const [updating, setUpdating] = useState(false);
  const [previewRefresh, setPreviewRefresh] = useState(Date.now());

  // AI state
  const [showAIConfigWizard, setShowAIConfigWizard] = useState(false);
  const [aiConfigDevice, setAIConfigDevice] = useState<TVDevice | null>(null);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [aiRecommendation, setAIRecommendation] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'displays' | 'groups'>('displays');

  // Reset location filter on mount to prevent React Fast Refresh from preserving stale state
  useEffect(() => {
    console.log('🔄 Component mounted, ensuring location is reset');
    setSelectedLocation(null);
  }, []);

  // Debug: Track when selectedLocation changes
  useEffect(() => {
    console.log('🔄 selectedLocation changed to:', selectedLocation);
  }, [selectedLocation]);

  // Load everything
  const loadData = useCallback(async () => {
    if (!vendor) {
      console.log('⏸️ loadData: No vendor, skipping');
      return;
    }

    console.log('🔄 loadData: Starting...');
    console.log('   vendorId:', vendor.id);
    console.log('   selectedLocation:', selectedLocation);
    console.log('   selectedLocation type:', typeof selectedLocation);
    console.log('   selectedLocation === null:', selectedLocation === null);
    console.log('   selectedLocation === "":', selectedLocation === '');

    try {
      // Load locations
      console.log('📍 Loading locations...');
      const locRes = await fetch(`/api/vendor/locations?vendor_id=${vendor.id}`);
      const locData = await locRes.json();
      console.log(`   Response:`, locData.success ? `${locData.locations?.length || 0} locations` : 'failed');

      if (locData.success) {
        setLocations(locData.locations || []);
        // Don't auto-select first location - start with "All Locations"
      }

      // Load devices
      console.log('📺 Building device query...');
      let devQuery = supabase
        .from('tv_devices')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('tv_number');

      if (selectedLocation && selectedLocation !== '') {
        console.log(`   ⚠️ Filtering by location: ${selectedLocation}`);
        devQuery = devQuery.eq('location_id', selectedLocation);
      } else {
        console.log(`   ✅ No location filter (showing all)`);
      }

      const { data: devData, error: devError } = await devQuery;

      if (devError) {
        console.error('❌ Error loading devices:', devError);
      } else {
        console.log(`✅ Loaded ${devData?.length || 0} devices (raw):`);

        // Check heartbeat timestamps and update status
        const now = new Date();
        const devicesWithStatus = devData?.map(device => {
          const lastHeartbeat = device.last_heartbeat_at ? new Date(device.last_heartbeat_at) : null;
          const secondsSinceHeartbeat = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 1000 : Infinity;

          // Device is offline if no heartbeat in last 60 seconds
          const actualStatus = secondsSinceHeartbeat > 60 ? 'offline' : device.connection_status;

          console.log(`   - TV ${device.tv_number}: ${device.device_name}`);
          console.log(`     DB status: ${device.connection_status}`);
          console.log(`     Last heartbeat: ${secondsSinceHeartbeat.toFixed(0)}s ago`);
          console.log(`     Actual status: ${actualStatus}`);

          return {
            ...device,
            connection_status: actualStatus
          };
        }) || [];

        setDevices(devicesWithStatus);
      }

      // Load menus
      console.log('📋 Loading menus...');
      const menuRes = await fetch(`/api/vendor/tv-menus?vendor_id=${vendor.id}`);
      const menuData = await menuRes.json();
      console.log(`   Response:`, menuData.success ? `${menuData.menus?.length || 0} menus` : 'failed');

      if (menuData.success) {
        setMenus(menuData.menus || []);
      }

      setLoading(false);
      console.log('✅ loadData: Complete');
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setLoading(false);
    }
  }, [vendor, selectedLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Real-time subscriptions for instant updates
   */
  useEffect(() => {
    if (!vendor) return;

    console.log('🔴 Setting up real-time subscriptions for vendor:', vendor.id);

    // Subscribe to device changes
    const devicesChannel = supabase
      .channel('tv-devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tv_devices',
          filter: `vendor_id=eq.${vendor.id}`,
        },
        (payload) => {
          console.log('🔴 Device change detected:', payload.eventType, payload);
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('🔴 Devices subscription status:', status);
      });

    // Subscribe to menu changes
    const menusChannel = supabase
      .channel('tv-menus-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tv_menus',
          filter: `vendor_id=eq.${vendor.id}`,
        },
        (payload) => {
          console.log('🔴 Menu change detected:', payload.eventType, payload);
          console.log('🎨 Triggering preview refresh for theme update');
          setPreviewRefresh(Date.now()); // Force iframe remount
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('🔴 Menus subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up subscriptions');
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(menusChannel);
    };
  }, [vendor, loadData]);

  // Create menu
  const createMenu = async () => {
    if (!vendor || !newMenuName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      console.log('Creating menu:', { vendor_id: vendor.id, location_id: null, name: newMenuName });

      const response = await fetch('/api/vendor/tv-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.id,
          location_id: null, // Make menus global by default
          name: newMenuName,
          description: '',
          menu_type: 'product_menu',
          is_active: true,
          config_data: {
            backgroundColor: '#000000',
            fontColor: '#ffffff',
            headerTitleSize: 60,
            cardTitleSize: 18,
            priceSize: 32
          }
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        console.log('✅ Menu created successfully:', data.menu);
        setNewMenuName('');
        setShowCreateMenu(false);

        // Reload all data to ensure consistency
        await loadData();
      } else {
        setError(data.error || 'Failed to create menu');
        console.error('❌ API returned error:', data.error);
      }
    } catch (err: any) {
      console.error('❌ Error creating menu:', err);
      setError(err.message || 'Failed to create menu');
    } finally {
      setCreating(false);
    }
  };

  // Assign menu to device
  const assignMenu = async (deviceId: string, menuId: string | null) => {
    try {
      console.log('🔄 Assigning menu:', { deviceId, menuId });

      const { data, error } = await supabase
        .from('tv_devices')
        .update({ active_menu_id: menuId })
        .eq('id', deviceId)
        .select();

      if (error) {
        console.error('❌ Error assigning menu:', error);
        setError(`Failed to assign menu: ${error.message}`);
        return;
      }

      console.log('✅ Menu assigned successfully:', data);
      // Force preview refresh immediately
      setPreviewRefresh(Date.now());
      await loadData();
    } catch (err: any) {
      console.error('❌ Exception assigning menu:', err);
      setError(err.message || 'Failed to assign menu');
    }
  };

  // Edit menu
  const openEditMenu = async (menu: TVMenu) => {
    setEditingMenu(menu);
    setEditMenuName(menu.name);
    setEditMenuDescription(menu.description || '');
    setEditMenuTheme(menu.theme || 'midnight-elegance');
    setEditMenuDisplayMode((menu as any).display_mode || 'dense');
    setEditMenuCategories(menu.config_data?.categories || []);
    setEditMenuCustomFields(menu.config_data?.customFields || []);
    setCustomFieldsConfig(menu.config_data?.customFieldsConfig || {});
    setHideAllFieldLabels(menu.config_data?.hideAllFieldLabels || false);

    // Load grid configuration
    setGridColumns(menu.config_data?.gridColumns || 6);
    setGridRows(menu.config_data?.gridRows || 5);

    // Load split view config with per-side settings
    setLayoutStyle(menu.config_data?.layoutStyle || 'single');
    setSplitLeftCategory(menu.config_data?.splitLeftCategory || '');
    setSplitLeftTitle(menu.config_data?.splitLeftTitle || '');
    setSplitLeftCustomFields(menu.config_data?.splitLeftCustomFields || []);
    setSplitLeftPriceBreaks(menu.config_data?.splitLeftPriceBreaks || []);
    setSplitRightCategory(menu.config_data?.splitRightCategory || '');
    setSplitRightTitle(menu.config_data?.splitRightTitle || '');
    setSplitRightCustomFields(menu.config_data?.splitRightCustomFields || []);
    setSplitRightPriceBreaks(menu.config_data?.splitRightPriceBreaks || []);

    // Load carousel configuration
    setEnableCarousel(menu.config_data?.enableCarousel !== false); // Default true
    setCarouselInterval(menu.config_data?.carouselInterval || 5); // Default 5 seconds

    setError(null);

    // Fetch available categories and custom fields from API
    if (vendor) {
      try {
        // Fetch categories
        console.log('🔍 Fetching categories for vendor:', vendor.id);
        const catResponse = await fetch(`/api/vendor/products/categories?vendor_id=${vendor.id}`);
        const catData = await catResponse.json();

        if (catData.success) {
          console.log('📂 Fetched categories:', catData.categories);
          setAvailableCategories(catData.categories || []);
        } else {
          console.error('❌ Error fetching categories:', catData.error);
          setAvailableCategories([]);
        }

        // Fetch custom fields
        console.log('🔍 Fetching custom fields for vendor:', vendor.id);
        const fieldsResponse = await fetch(`/api/vendor/products/custom-fields?vendor_id=${vendor.id}`);
        const fieldsData = await fieldsResponse.json();

        if (fieldsData.success) {
          console.log('📋 Fetched custom fields:', fieldsData.customFields);
          setAvailableCustomFields(fieldsData.customFields || []);
        } else {
          console.error('❌ Error fetching custom fields:', fieldsData.error);
          setAvailableCustomFields([]);
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setAvailableCategories([]);
        setAvailableCustomFields([]);
      }
    }
  };

  const updateMenu = async (menuData: any) => {
    if (!editingMenu) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/vendor/tv-menus/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          menuId: editingMenu.id,
          name: menuData.name,
          description: menuData.description || null,
          theme: menuData.theme,
          display_mode: 'dense',
          gridColumns: menuData.gridColumns,
          gridRows: menuData.gridRows,
          categories: menuData.categories,
          customFields: menuData.customFields,
          customFieldsConfig: menuData.customFieldsConfig,
          categoryPricingConfig: menuData.categoryPricingConfig,
          hideAllFieldLabels: menuData.hideAllFieldLabels || false,
          displayMode: menuData.displayMode || 'grid',
          layoutStyle: menuData.layoutStyle,
          splitLeftCategory: menuData.splitLeftCategory,
          splitLeftTitle: menuData.splitLeftTitle,
          splitLeftCustomFields: menuData.splitLeftCustomFields,
          splitLeftPriceBreaks: menuData.splitLeftPriceBreaks,
          splitRightCategory: menuData.splitRightCategory,
          splitRightTitle: menuData.splitRightTitle,
          splitRightCustomFields: menuData.splitRightCustomFields,
          splitRightPriceBreaks: menuData.splitRightPriceBreaks,
          enableCarousel: menuData.enableCarousel,
          carouselInterval: menuData.carouselInterval
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Update error:', data.error);
        throw new Error(data.error || 'Failed to update menu');
      }

      console.log('✅ Menu updated successfully:', data.menu);

      // Force preview refresh immediately
      setPreviewRefresh(Date.now());

      setEditingMenu(null);
      await loadData();
    } catch (err: any) {
      console.error('Error updating menu:', err);
      setError(err.message || 'Failed to update menu');
    } finally {
      setUpdating(false);
    }
  };

  // Delete menu
  const deleteMenu = async () => {
    if (!deletingMenu) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/vendor/tv-menus/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId: deletingMenu.id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete menu');
      }

      setDeletingMenu(null);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting menu:', err);
      setError(err.message || 'Failed to delete menu');
    } finally {
      setUpdating(false);
    }
  };

  // Delete device
  const deleteDevice = async () => {
    if (!deletingDevice) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/vendor/tv-devices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deletingDevice.id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete device');
      }

      setDeletingDevice(null);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting device:', err);
      setError(err.message || 'Failed to delete device');
    } finally {
      setUpdating(false);
    }
  };

  // AI: Open config wizard
  const openAIConfig = (device: TVDevice) => {
    setAIConfigDevice(device);
    setShowAIConfigWizard(true);
  };

  // AI: Profile saved, generate recommendation
  const handleProfileComplete = async (profileId: string) => {
    if (!aiConfigDevice || !vendor) return;

    setShowAIConfigWizard(false);
    setGeneratingAI(true);

    try {
      const response = await fetch('/api/ai/optimize-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: aiConfigDevice.id,
          menuId: aiConfigDevice.active_menu_id,
          vendorId: vendor.id,
          useLLM: false, // Start with rule-based, can enable LLM later
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate recommendation');
      }

      setAIRecommendation({
        ...data.recommendation,
        recommendationId: data.recommendationId,
      });
      setShowAIRecommendation(true);
    } catch (err: any) {
      console.error('Error generating AI recommendation:', err);
      setError(err.message || 'Failed to generate AI recommendation');
    } finally {
      setGeneratingAI(false);
    }
  };

  // AI: Layout applied
  const handleLayoutApplied = () => {
    setShowAIRecommendation(false);
    setAIRecommendation(null);
    setAIConfigDevice(null);
    loadData(); // Refresh to show updated menu
  };

  // Show loading spinner while data is loading
  // (auth loading is handled by the layout)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
                Digital Signage
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                {devices.filter(d => d.connection_status === 'online').length} of {devices.length} Displays Online · {menus.length} Menus
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Location Selector */}
              {locations.length > 0 && (
                <select
                  value={selectedLocation || ''}
                  onChange={(e) => setSelectedLocation(e.target.value || null)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="" className="bg-black">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-black">
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Create Menu Button */}
              <button
                onClick={() => setShowCreateMenu(true)}
                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10"
              >
                <Plus size={18} />
                New Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('displays')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
              activeTab === 'displays'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <Tv className="w-4 h-4" />
            Displays & Menus
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
              activeTab === 'groups'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Display Groups
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'groups' ? (
          /* Display Groups View */
          vendor && <DisplayGroupManager vendorId={vendor.id} />
        ) : (
          <>
        {/* No Devices State */}
        {devices.length === 0 ? (
          <div className="text-center py-20">
            {/* Show vendor logo if available */}
            {vendor?.logo_url ? (
              <motion.button
                onClick={async () => {
                  // Get the next available TV number
                  const { data: existingDevices } = await supabase
                    .from('tv_devices')
                    .select('tv_number')
                    .eq('vendor_id', vendor.id)
                    .order('tv_number', { ascending: false })
                    .limit(1);

                  const nextNumber = existingDevices && existingDevices.length > 0
                    ? existingDevices[0].tv_number + 1
                    : 1;

                  const url = `${window.location.origin}/tv-display?vendor_id=${vendor?.id}&tv_number=${nextNumber}${selectedLocation ? `&location_id=${selectedLocation}` : ''}`;
                  window.open(url, '_blank');

                  // Reload data after a short delay to show the new device
                  setTimeout(() => loadData(), 1000);
                }}
                className="mb-8 mx-auto block cursor-pointer hover:scale-105 transition-transform duration-300"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={vendor.logo_url}
                  alt={vendor.store_name || 'Vendor Logo'}
                  className="mx-auto max-w-sm max-h-48 object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.15))'
                  }}
                />
                <p className="text-white/60 text-sm mt-4 font-medium">Click to open display</p>
              </motion.button>
            ) : (
              <button
                onClick={async () => {
                  if (!vendor?.id) return;

                  // Get the next available TV number
                  const { data: existingDevices } = await supabase
                    .from('tv_devices')
                    .select('tv_number')
                    .eq('vendor_id', vendor.id)
                    .order('tv_number', { ascending: false })
                    .limit(1);

                  const nextNumber = existingDevices && existingDevices.length > 0
                    ? existingDevices[0].tv_number + 1
                    : 1;

                  const url = `${window.location.origin}/tv-display?vendor_id=${vendor?.id}&tv_number=${nextNumber}${selectedLocation ? `&location_id=${selectedLocation}` : ''}`;
                  window.open(url, '_blank');

                  // Reload data after a short delay
                  setTimeout(() => loadData(), 1000);
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Tv size={40} className="text-white/20" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-white mb-2">No displays yet{selectedLocation ? ' at this location' : ''}</h2>
            <p className="text-white/40 max-w-md mx-auto mb-8">
              Set up your first TV display by opening this URL on your display device:
            </p>
            <code className="inline-block bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white/60 font-mono text-sm break-all">
              /tv-display?vendor_id={vendor?.id}&tv_number=1{selectedLocation ? `&location_id=${selectedLocation}` : ''}
            </code>
          </div>
        ) : (
          /* Displays Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => {
              const assignedMenu = menus.find(m => m.id === device.active_menu_id);

              return (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
                >
                  {/* Device Header */}
                  <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Circle
                          size={8}
                          className={`${
                            device.connection_status === 'online'
                              ? 'fill-green-500 text-green-500'
                              : 'fill-gray-500 text-gray-500'
                          }`}
                        />
                        <h3 className="text-white font-bold">{device.device_name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAIConfig(device)}
                          className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors group"
                          title="AI Optimize Layout"
                        >
                          <Sparkles size={14} className="text-purple-400 group-hover:text-purple-300" />
                        </button>
                        <a
                          href={`/tv-display?vendor_id=${vendor?.id}&location_id=${device.location_id || ''}&tv_number=${device.tv_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="Open display"
                        >
                          <ExternalLink size={14} className="text-white" />
                        </a>
                        <button
                          onClick={() => {
                            setDeletingDevice(device);
                            setError(null);
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete display"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="relative aspect-video bg-black">
                    {device.connection_status === 'online' && device.active_menu_id ? (
                      <iframe
                        key={`${device.id}-${device.active_menu_id}-${previewRefresh}`}
                        src={`/tv-display?vendor_id=${vendor?.id}&location_id=${device.location_id || ''}&tv_number=${device.tv_number}&device_id=${device.id}&menu_id=${device.active_menu_id}&preview=true`}
                        className="w-full h-full border-0 pointer-events-none"
                        title={device.device_name}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Tv size={40} className="text-white/10 mx-auto mb-2" />
                          <p className="text-white/30 text-sm">
                            {device.connection_status === 'offline' ? 'Offline' : 'No menu assigned'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menu Selector */}
                  <div className="p-4">
                    <label className="block text-white/40 text-xs font-medium uppercase tracking-wide mb-2">
                      Playing
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={device.active_menu_id || ''}
                        onChange={(e) => {
                          console.log('Assigning menu:', e.target.value, 'to device:', device.id);
                          assignMenu(device.id, e.target.value || null);
                        }}
                        className="flex-1 appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                      >
                        <option value="" className="bg-black">None</option>
                        {menus
                          .filter(m => {
                            // Show all menus without location_id, or menus matching device location
                            const show = !m.location_id || m.location_id === device.location_id;
                            if (!show) {
                              console.log(`Menu "${m.name}" hidden: menu location=${m.location_id}, device location=${device.location_id}`);
                            }
                            return show;
                          })
                          .map((menu) => (
                            <option key={menu.id} value={menu.id} className="bg-black">
                              {menu.name}
                            </option>
                          ))}
                      </select>
                      {device.active_menu_id && (
                        <button
                          onClick={() => assignMenu(device.id, null)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                          title="Clear menu"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-white/30 text-xs mt-1">
                      {menus.filter(m => !m.location_id || m.location_id === device.location_id).length} available
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Always Show: Open New Display Section */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-black text-white mb-4" style={{ fontWeight: 900 }}>
            Open New Display
          </h2>
          <p className="text-white/40 text-sm mb-4">
            Open this URL on any device to add a new display{selectedLocation ? ' at this location' : ''}:
          </p>

          <div className="space-y-3">
            {/* Next available TV number */}
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-wide mb-2">
                Next Available Display
              </label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono text-sm break-all">
                  {typeof window !== 'undefined' && window.location.origin}/tv-display?vendor_id={vendor?.id}&tv_number={Math.max(...devices.map(d => d.tv_number), 0) + 1}{selectedLocation ? `&location_id=${selectedLocation}` : ''}
                </code>
                <button
                  onClick={async () => {
                    // Get the next available TV number from database
                    const { data: existingDevices } = await supabase
                      .from('tv_devices')
                      .select('tv_number')
                      .eq('vendor_id', vendor?.id)
                      .order('tv_number', { ascending: false })
                      .limit(1);

                    const nextNumber = existingDevices && existingDevices.length > 0
                      ? existingDevices[0].tv_number + 1
                      : 1;

                    const url = `${window.location.origin}/tv-display?vendor_id=${vendor?.id}&tv_number=${nextNumber}${selectedLocation ? `&location_id=${selectedLocation}` : ''}`;
                    window.open(url, '_blank');

                    // Reload data after a short delay to show the new device
                    setTimeout(() => loadData(), 1000);
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <ExternalLink size={16} />
                  Open
                </button>
              </div>
            </div>

            {/* Custom TV number */}
            <details className="group">
              <summary className="cursor-pointer text-white/40 text-xs font-medium uppercase tracking-wide hover:text-white/60 transition-colors">
                Custom Display Number
              </summary>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter TV number"
                  id="custom-tv-number"
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('custom-tv-number') as HTMLInputElement;
                    const tvNum = parseInt(input.value);
                    if (tvNum && tvNum > 0) {
                      const url = `${window.location.origin}/tv-display?vendor_id=${vendor?.id}&tv_number=${tvNum}${selectedLocation ? `&location_id=${selectedLocation}` : ''}`;
                      window.open(url, '_blank');
                      input.value = '';
                    }
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <ExternalLink size={16} />
                  Open
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Menu Library Section */}
        {menus.length > 0 && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-black text-white mb-4" style={{ fontWeight: 900 }}>
              Menu Library
            </h2>
            <p className="text-white/40 text-sm mb-6">
              Manage all your menus - edit names, descriptions, or delete unused menus
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menus.map((menu) => {
                // Count devices using this menu
                const devicesUsingMenu = devices.filter(d => d.active_menu_id === menu.id).length;

                return (
                  <div
                    key={menu.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base truncate">
                          {menu.name}
                        </h3>
                        {menu.description && (
                          <p className="text-white/40 text-xs mt-1 line-clamp-2">
                            {menu.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/30 text-xs">
                        {devicesUsingMenu > 0 ? (
                          <>Used by {devicesUsingMenu} display{devicesUsingMenu !== 1 ? 's' : ''}</>
                        ) : (
                          <>Not in use</>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditMenu(menu)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="Edit menu"
                        >
                          <Pencil size={14} className="text-white" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingMenu(menu);
                            setError(null);
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete menu"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Create Menu Modal */}
      <AnimatePresence>
        {showCreateMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white" style={{ fontWeight: 900 }}>
                  New Menu
                </h2>
                <button
                  onClick={() => setShowCreateMenu(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Menu Name
                  </label>
                  <input
                    type="text"
                    value={newMenuName}
                    onChange={(e) => setNewMenuName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !creating && createMenu()}
                    placeholder="e.g., Main Menu, Daily Specials"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    autoFocus
                    disabled={creating}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setError(null);
                      setNewMenuName('');
                    }}
                    disabled={creating}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createMenu}
                    disabled={!newMenuName.trim() || creating}
                    className="flex-1 px-4 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Menu Modal */}
      <AnimatePresence>
        {editingMenu && (
          <MenuEditorModal
            menu={editingMenu}
            onClose={() => {
              setEditingMenu(null);
              setError(null);
            }}
            onSave={updateMenu}
            updating={updating}
            error={error}
            availableCategories={availableCategories}
            availableCustomFields={availableCustomFields}
            availablePriceBreaks={[]}
          />
        )}
      </AnimatePresence>

      {/* Delete Menu Confirmation Modal */}
      <AnimatePresence>
        {deletingMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setDeletingMenu(null);
              setError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white" style={{ fontWeight: 900 }}>
                  Delete Menu
                </h2>
                <button
                  onClick={() => {
                    setDeletingMenu(null);
                    setError(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-white text-sm">
                    Are you sure you want to delete <span className="font-bold">{deletingMenu.name}</span>?
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    This will unassign it from all displays. This action cannot be undone.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setDeletingMenu(null);
                      setError(null);
                    }}
                    disabled={updating}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteMenu}
                    disabled={updating}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                  >
                    {updating ? 'Deleting...' : 'Delete Menu'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Device Confirmation Modal */}
      <AnimatePresence>
        {deletingDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setDeletingDevice(null);
              setError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white" style={{ fontWeight: 900 }}>
                  Delete Display
                </h2>
                <button
                  onClick={() => {
                    setDeletingDevice(null);
                    setError(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-white text-sm">
                    Are you sure you want to delete <span className="font-bold">{deletingDevice.device_name} (TV {deletingDevice.tv_number})</span>?
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    This will permanently remove this display from your account. This action cannot be undone.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setDeletingDevice(null);
                      setError(null);
                    }}
                    disabled={updating}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteDevice}
                    disabled={updating}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                  >
                    {updating ? 'Deleting...' : 'Delete Display'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Configuration Wizard */}
      {aiConfigDevice && (
        <DisplayConfigWizard
          isOpen={showAIConfigWizard}
          onClose={() => {
            setShowAIConfigWizard(false);
            setAIConfigDevice(null);
          }}
          deviceId={aiConfigDevice.id}
          deviceName={aiConfigDevice.device_name}
          vendorId={vendor?.id || ''}
          onComplete={handleProfileComplete}
        />
      )}

      {/* AI Recommendation Viewer */}
      {aiRecommendation && aiConfigDevice && (
        <AIRecommendationViewer
          isOpen={showAIRecommendation}
          onClose={() => {
            setShowAIRecommendation(false);
            setAIRecommendation(null);
            setAIConfigDevice(null);
          }}
          recommendation={aiRecommendation}
          deviceName={aiConfigDevice.device_name}
          menuId={aiConfigDevice.active_menu_id || ''}
          onApply={handleLayoutApplied}
        />
      )}

      {/* AI Generating Loader */}
      <AnimatePresence>
        {generatingAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Display...</h3>
              <p className="text-white/60 text-sm">Our AI is optimizing your layout</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
