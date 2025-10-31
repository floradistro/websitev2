'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Monitor, Grid3x3, Palette, Check } from 'lucide-react';

interface Device {
  id: string;
  device_name: string;
  tv_number: number;
  screen_size_inches: number;
  connection_status: string;
}

interface GroupConfigWizardProps {
  vendorId: string;
  existingGroup?: any;
  onComplete: (groupData: any) => void;
  onClose: () => void;
}

const THEMES = [
  { id: 'midnight-elegance', name: 'Midnight Elegance', description: 'Dark, premium aesthetic' },
  { id: 'fresh-market', name: 'Fresh Market', description: 'Bright and inviting' },
  { id: 'ocean-breeze', name: 'Ocean Breeze', description: 'Cool blues and calm' },
  { id: 'sunset-warmth', name: 'Sunset Warmth', description: 'Warm oranges and reds' },
  { id: 'forest-zen', name: 'Forest Zen', description: 'Natural greens and earth' },
  { id: 'bold-vibrant', name: 'Bold Vibrant', description: 'High contrast and energy' },
];

const DISPLAY_MODES = [
  { id: 'dense', name: 'Dense Grid', description: 'Maximum products on screen' },
  { id: 'carousel', name: 'Carousel', description: 'Rotating pages with transitions' },
];

const PRICE_TIERS = [
  { id: '1g', name: 'Gram', description: 'Show 1g pricing' },
  { id: '3_5g', name: 'Eighth (3.5g)', description: 'Show eighth pricing' },
  { id: '7g', name: 'Quarter (7g)', description: 'Show quarter pricing' },
  { id: '14g', name: 'Half (14g)', description: 'Show half ounce pricing' },
  { id: '28g', name: 'Ounce (28g)', description: 'Show ounce pricing' },
];

const PRICE_DISPLAY_MODES = [
  { id: 'hero_only', name: 'Hero Only', description: 'Show only the main price tier (cleanest)' },
  { id: 'hero_with_supporting', name: 'Hero + Others', description: 'Main price + 1-2 supporting prices' },
  { id: 'all_tiers', name: 'All Tiers', description: 'Show all available price tiers' },
  { id: 'minimal', name: 'Minimal', description: 'Show only smallest tier' },
];

const PRICE_LOCATIONS = [
  { id: 'on_card', name: 'On Product Card', description: 'Pricing shown within each product' },
  { id: 'header', name: 'Header Banner', description: 'Pricing shown in header (coming soon)', disabled: true },
];

export default function GroupConfigWizard({ vendorId, existingGroup, onComplete, onClose }: GroupConfigWizardProps) {
  const [step, setStep] = useState(1);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availablePricingTiers, setAvailablePricingTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [theme, setTheme] = useState('midnight-elegance');
  const [displayMode, setDisplayMode] = useState('dense');
  const [gridColumns, setGridColumns] = useState(6);
  const [gridRows, setGridRows] = useState(5);
  const [deviceCategories, setDeviceCategories] = useState<{ [deviceId: string]: string[] }>({});

  // Pricing tier selection (which tier of products to show - e.g., "Budget", "Mid", "Premium")
  const [pricingTierId, setPricingTierId] = useState<string>('');
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);

  // Visible price breaks (which sizes to show - e.g., ['1g', '3_5g', '28g'])
  const [visiblePriceBreaks, setVisiblePriceBreaks] = useState<string[]>([]);

  // Display configuration - all enabled by default
  const [showImages, setShowImages] = useState(true);
  const [showCategoryHeader, setShowCategoryHeader] = useState(true);
  const [showHeader, setShowHeader] = useState(false);
  const [showStrainType, setShowStrainType] = useState(true);
  const [showThc, setShowThc] = useState(true);
  const [showCbd, setShowCbd] = useState(true);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    loadData();
  }, [vendorId]);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingGroup) {
      setGroupName(existingGroup.name || '');
      setGroupDescription(existingGroup.description || '');
      setTheme(existingGroup.shared_theme || 'midnight-elegance');
      setDisplayMode(existingGroup.shared_display_mode || 'dense');
      setGridColumns(existingGroup.shared_grid_columns || 4);
      setGridRows(existingGroup.shared_grid_rows || 3);

      // Pricing configuration
      setPricingTierId(existingGroup.pricing_tier_id || '');
      setVisiblePriceBreaks(existingGroup.visible_price_breaks || []);

      // Display configuration
      if (existingGroup.display_config) {
        setShowImages(existingGroup.display_config.show_images !== false);
        setShowCategoryHeader(existingGroup.display_config.show_category_header !== false);
        setShowHeader(existingGroup.display_config.show_header === true);
        setShowStrainType(existingGroup.display_config.show_strain_type !== false);
        setShowThc(existingGroup.display_config.show_thc !== false);
        setShowCbd(existingGroup.display_config.show_cbd !== false);
        setShowBrand(existingGroup.display_config.show_brand === true);
      }

      // Set selected devices and categories
      if (existingGroup.members) {
        const deviceIds = existingGroup.members.map((m: any) => m.device_id);
        setSelectedDevices(deviceIds);

        const categories: { [deviceId: string]: string[] } = {};
        existingGroup.members.forEach((m: any) => {
          categories[m.device_id] = m.assigned_categories || [];
        });
        setDeviceCategories(categories);
      }
    }
  }, [existingGroup]);

  const loadData = async () => {
    try {
      // Load available devices
      const devicesResponse = await fetch(`/api/vendor/tv-devices?vendor_id=${vendorId}`);
      const devicesData = await devicesResponse.json();
      if (devicesData.success) {
        setAvailableDevices(devicesData.devices);
      }

      // Load available categories
      const categoriesResponse = await fetch(`/api/vendor/products/categories?vendor_id=${vendorId}`);
      const categoriesData = await categoriesResponse.json();
      console.log('📂 Categories API response:', categoriesData);
      if (categoriesData.success) {
        console.log('✅ Loaded categories:', categoriesData.categories);
        setAvailableCategories(categoriesData.categories || []);
      } else {
        console.error('❌ Failed to load categories:', categoriesData.error);
        setAvailableCategories([]);
      }

      // Load pricing tier blueprints (for filtering products by tier)
      const blueprintsResponse = await fetch(`/api/vendor/pricing/blueprints?vendor_id=${vendorId}`);
      const blueprintsData = await blueprintsResponse.json();
      if (blueprintsData.success) {
        setPricingTiers(blueprintsData.blueprints || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleCategoryToggle = (deviceId: string, category: string) => {
    setDeviceCategories((prev) => {
      const current = prev[deviceId] || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, [deviceId]: updated };
    });
  };

  const handleComplete = () => {
    const devices = selectedDevices.map((deviceId, index) => ({
      deviceId,
      position: index + 1,
      categories: deviceCategories[deviceId] || [],
    }));

    onComplete({
      name: groupName,
      description: groupDescription,
      theme,
      displayMode,
      gridColumns,
      gridRows,
      pricingTierId: pricingTierId || null, // Which pricing tier (filters products)
      visible_price_breaks: visiblePriceBreaks, // Which sizes to show (1g, 3.5g, etc.)
      devices,
      displayConfig: {
        show_images: showImages,
        show_category_header: showCategoryHeader,
        show_header: showHeader,
        show_strain_type: showStrainType,
        show_thc: showThc,
        show_cbd: showCbd,
        show_brand: showBrand,
      },
    });
  };

  const canProceed = () => {
    if (step === 1) return groupName.trim() && selectedDevices.length >= 2;
    if (step === 2) return true;
    if (step === 3) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Display Group</h2>
            <p className="text-white/60 text-sm mt-1">
              Step {step} of 3: {step === 1 ? 'Select Displays' : step === 2 ? 'Configure Layout' : 'Assign Categories'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Displays */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Main Wall, Checkout Counter"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Brief description of this display group"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Select Displays (minimum 2) *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableDevices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => handleDeviceToggle(device.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedDevices.includes(device.id)
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-white/60" />
                            <span className="font-medium text-white">{device.device_name}</span>
                          </div>
                          {selectedDevices.includes(device.id) && (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <span>{device.screen_size_inches}"</span>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <span>TV #{device.tv_number}</span>
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                device.connection_status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            />
                            <span>{device.connection_status}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedDevices.length === 1 && (
                    <p className="text-yellow-400 text-sm mt-2">
                      Select at least one more display to create a group
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Configure Layout */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Theme (all displays will use this theme)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          theme === t.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{t.name}</span>
                          {theme === t.id && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-white/60">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Display Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DISPLAY_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setDisplayMode(mode.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          displayMode === mode.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{mode.name}</span>
                          {displayMode === mode.id && (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-white/60">{mode.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Grid Columns
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="12"
                      value={gridColumns || 6}
                      onChange={(e) => setGridColumns(parseInt(e.target.value) || 6)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-white/40 mt-1">3-12 columns</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Grid Rows
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={gridRows || 5}
                      onChange={(e) => setGridRows(parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-white/40 mt-1">3-10 rows</p>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Grid3x3 className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div className="text-sm text-white/80">
                      <div className="font-medium mb-1">Layout Preview</div>
                      <div>
                        Each display will show {gridColumns} × {gridRows} = {gridColumns * gridRows} products per page
                      </div>
                      <div className="text-white/60 mt-1">
                        Total across {selectedDevices.length} displays: {gridColumns * gridRows * selectedDevices.length} products visible at once
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Configuration */}
                <div className="border-t border-white/10 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    Pricing Configuration
                  </h3>

                  {/* Step 1: Which pricing tier (which products to show) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white mb-3">
                      Which pricing tier to show
                    </label>
                    <p className="text-xs text-white/50 mb-3">
                      Choose which tier of products to display (e.g., Budget, Mid-tier, Premium). Leave empty to show all tiers.
                    </p>
                    <select
                      value={pricingTierId}
                      onChange={(e) => setPricingTierId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Show all pricing tiers</option>
                      {pricingTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name} {tier.description ? `- ${tier.description}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Which price breaks to show (1g, 3.5g, etc.) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white mb-3">
                      Which sizes to show
                    </label>
                    <p className="text-xs text-white/50 mb-4">
                      Select which sizes/weights to display (e.g., 1g, 3.5g, 28g)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PRICE_TIERS.map((tier) => {
                        const isSelected = visiblePriceBreaks.includes(tier.id);
                        return (
                          <button
                            key={tier.id}
                            onClick={() => {
                              if (isSelected) {
                                setVisiblePriceBreaks(visiblePriceBreaks.filter(id => id !== tier.id));
                              } else {
                                setVisiblePriceBreaks([...visiblePriceBreaks, tier.id]);
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-white text-sm">{tier.name}</span>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-white/60">{tier.description}</div>
                          </button>
                        );
                      })}
                    </div>
                    {visiblePriceBreaks.length === 0 && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-200">
                          Select at least one price tier to display
                        </p>
                      </div>
                    )}
                    {visiblePriceBreaks.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-white/70">
                          <span className="font-semibold">Selected:</span> {visiblePriceBreaks.map(id => PRICE_TIERS.find(t => t.id === id)?.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display Configuration */}
                <div className="border-t border-white/10 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-purple-400" />
                    What to Display
                  </h3>
                  <p className="text-sm text-white/60 mb-4">
                    Customize what information appears on your TV displays
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Product Images */}
                    <button
                      onClick={() => setShowImages(!showImages)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showImages
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Images</span>
                        {showImages && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">Product photos</p>
                    </button>

                    {/* Category Header */}
                    <button
                      onClick={() => setShowCategoryHeader(!showCategoryHeader)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showCategoryHeader
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Category</span>
                        {showCategoryHeader && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">Show category name</p>
                    </button>

                    {/* Menu Header */}
                    <button
                      onClick={() => setShowHeader(!showHeader)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showHeader
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Menu Header</span>
                        {showHeader && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">Menu name & desc</p>
                    </button>

                    {/* Strain Type */}
                    <button
                      onClick={() => {
                        console.log('🔄 Toggling Strain Type:', !showStrainType);
                        setShowStrainType(!showStrainType);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showStrainType
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Strain Type</span>
                        {showStrainType && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">I/S/H badge</p>
                    </button>

                    {/* THC % */}
                    <button
                      onClick={() => setShowThc(!showThc)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showThc
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">THC %</span>
                        {showThc && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">THC content</p>
                    </button>

                    {/* CBD % */}
                    <button
                      onClick={() => setShowCbd(!showCbd)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showCbd
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">CBD %</span>
                        {showCbd && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">CBD content</p>
                    </button>

                    {/* Brand */}
                    <button
                      onClick={() => setShowBrand(!showBrand)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        showBrand
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">Brand</span>
                        {showBrand && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60">Brand name</p>
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-sm text-white/80">
                      <div className="font-medium mb-1">Display Options</div>
                      <div className="text-white/60">
                        {[
                          showImages && 'Product images',
                          showHeader && 'Menu header',
                          showStrainType && 'Strain type',
                          showThc && 'THC%',
                          showCbd && 'CBD%',
                          showBrand && 'Brand'
                        ].filter(Boolean).join(', ') || 'Nothing selected'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Assign Categories */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                  <h3 className="text-white font-semibold mb-2">Category Assignment</h3>
                  <p className="text-sm text-white/60">
                    Assign specific product categories to each display. Each display will only show products from its assigned categories.
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    💡 Tip: Leave empty to show all categories on that display
                  </p>
                </div>

                {availableCategories.length === 0 ? (
                  <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                    <p className="text-yellow-200 mb-2">No categories found</p>
                    <p className="text-sm text-white/60">
                      Add product categories in your Products page first, then they'll appear here.
                    </p>
                  </div>
                ) : (
                  selectedDevices.map((deviceId, index) => {
                    const device = availableDevices.find((d) => d.id === deviceId);
                    if (!device) return null;

                    const selectedCount = (deviceCategories[deviceId] || []).length;

                    return (
                      <div key={deviceId} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{device.device_name}</div>
                              <div className="text-xs text-white/40">
                                Display {index + 1} of {selectedDevices.length}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {selectedCount > 0 ? (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                {selectedCount} {selectedCount === 1 ? 'category' : 'categories'}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-white/10 text-white/40 rounded-full">
                                All categories
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {availableCategories.map((category) => {
                            const isSelected = (deviceCategories[deviceId] || []).includes(category);
                            return (
                              <button
                                key={category}
                                onClick={() => handleCategoryToggle(deviceId, category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                {category}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-sm text-white/80">
                    <div className="font-medium mb-1">AI Tip</div>
                    <div className="text-white/60">
                      Try to balance product counts across displays for a professional look. Categories with similar product counts work best together.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                <Check className="w-4 h-4" />
                Create Display Group
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
