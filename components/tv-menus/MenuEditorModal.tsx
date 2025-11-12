"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { themes } from "@/lib/themes";
import CategorySelector from "@/components/tv-menus/CategorySelector";
import { logger } from "@/lib/logger";
import {
  initializeCategoryPricingConfig,
  PRICE_BREAK_LABELS,
  type CategoryPricingConfig,
} from "@/lib/category-pricing-defaults";

interface MenuEditorModalProps {
  menu: any;
  onClose: () => void;
  onSave: (menuData: any) => void;
  onThemeChange?: (menuId: string, newTheme: string) => Promise<boolean>;
  updating: boolean;
  error: string | null;
  availableCategories: string[];
  availableCustomFields: string[];
  availablePriceBreaks: string[];
}

export default function MenuEditorModal({
  menu,
  onClose,
  onSave,
  onThemeChange,
  updating,
  error,
  availableCategories,
  availableCustomFields,
  availablePriceBreaks,
}: MenuEditorModalProps) {
  // Debug logging

  // Basic info
  const [name, setName] = useState(menu?.name || "");
  const [description, setDescription] = useState(menu?.description || "");

  // Content
  const [categories, setCategories] = useState<string[]>(menu?.config_data?.categories || []);
  const [customFields, setCustomFields] = useState<string[]>(menu?.config_data?.customFields || []);
  const [customFieldsConfig, setCustomFieldsConfig] = useState<{
    [field: string]: { showLabel: boolean };
  }>(menu?.config_data?.customFieldsConfig || {});
  const [hideAllFieldLabels, setHideAllFieldLabels] = useState(
    menu?.config_data?.hideAllFieldLabels || false,
  );

  // Per-category pricing configuration
  const [categoryPricingConfig, setCategoryPricingConfig] = useState<CategoryPricingConfig>(
    menu?.config_data?.categoryPricingConfig ||
      initializeCategoryPricingConfig(menu?.config_data?.categories || []),
  );
  const [loadingTiers, setLoadingTiers] = useState(false);

  // Load actual pricing tiers from database when categories change
  useEffect(() => {
    if (categories.length === 0 || !menu?.vendor_id) return;

    const fetchActualTiers = async () => {
      setLoadingTiers(true);
      try {
        const response = await fetch(
          `/api/vendor/category-pricing-tiers?vendor_id=${menu.vendor_id}&categories=${categories.join(",")}`,
        );
        const data = await response.json();

        if (data.success && data.tiers) {
          const updatedConfig: CategoryPricingConfig = {};

          categories.forEach((category) => {
            const matchingKey = Object.keys(data.tiers).find(
              (key) => key.toLowerCase() === category.toLowerCase(),
            );

            const actualTiers = matchingKey ? data.tiers[matchingKey] : [];

            if (actualTiers.length === 0) {
              if (process.env.NODE_ENV === "development") {
                logger.warn(`No pricing tiers found for category: ${category}`);
              }
              return;
            }

            const existingSelection = categoryPricingConfig[category]?.selected || [];

            updatedConfig[category] = {
              available: actualTiers,
              selected:
                existingSelection.filter((tier) => actualTiers.includes(tier)).length > 0
                  ? existingSelection.filter((tier) => actualTiers.includes(tier))
                  : actualTiers,
            };
          });

          setCategoryPricingConfig(updatedConfig);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("[MenuEditorModal] Error fetching category pricing tiers:", error);
        }
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchActualTiers();
  }, [categories.join(","), menu?.vendor_id]);

  // Layout
  const [displayMode, setDisplayMode] = useState<"grid" | "list">(
    menu?.config_data?.displayMode || "grid",
  );
  const [layoutStyle, setLayoutStyle] = useState<"single" | "split">(
    menu?.config_data?.layoutStyle || "single",
  );
  const [gridColumns, setGridColumns] = useState(menu?.config_data?.gridColumns || 6);
  const [gridRows, setGridRows] = useState(menu?.config_data?.gridRows || 5);

  // Split view config
  const [splitLeftCategory, setSplitLeftCategory] = useState(
    menu?.config_data?.splitLeftCategory || "",
  );
  const [splitLeftTitle, setSplitLeftTitle] = useState(menu?.config_data?.splitLeftTitle || "");
  const [splitLeftCustomFields, setSplitLeftCustomFields] = useState<string[]>(
    menu?.config_data?.splitLeftCustomFields || [],
  );
  const [splitLeftPriceBreaks, setSplitLeftPriceBreaks] = useState<string[]>(
    menu?.config_data?.splitLeftPriceBreaks || [],
  );
  const [splitRightCategory, setSplitRightCategory] = useState(
    menu?.config_data?.splitRightCategory || "",
  );
  const [splitRightTitle, setSplitRightTitle] = useState(menu?.config_data?.splitRightTitle || "");
  const [splitRightCustomFields, setSplitRightCustomFields] = useState<string[]>(
    menu?.config_data?.splitRightCustomFields || [],
  );
  const [splitRightPriceBreaks, setSplitRightPriceBreaks] = useState<string[]>(
    menu?.config_data?.splitRightPriceBreaks || [],
  );

  // Style
  const [theme, setTheme] = useState(menu?.theme || "midnight-elegance");
  const [enableCarousel, setEnableCarousel] = useState(menu?.config_data?.enableCarousel !== false);
  const [carouselInterval, setCarouselInterval] = useState(
    menu?.config_data?.carouselInterval || 5,
  );
  const [showSubCategories, setShowSubCategories] = useState(
    menu?.config_data?.showSubCategories || false,
  );

  const handleSave = () => {
    onSave({
      name,
      description,
      theme,
      categories,
      customFields,
      customFieldsConfig,
      categoryPricingConfig,
      hideAllFieldLabels,
      displayMode,
      layoutStyle,
      gridColumns,
      gridRows,
      splitLeftCategory,
      splitLeftTitle,
      splitLeftCustomFields,
      splitLeftPriceBreaks,
      splitRightCategory,
      splitRightTitle,
      splitRightCustomFields,
      splitRightPriceBreaks,
      enableCarousel,
      carouselInterval,
      showSubCategories,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-black border border-white/10 rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Menu</h2>
            <p className="text-xs text-white/40 mt-0.5">Configure your TV display</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Unified Content - No Tabs */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">
                Menu Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Menu, Daily Specials"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                disabled={updating}
              />
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold">Display</h3>

            {/* Mode & Layout in one row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Display Mode */}
              <div>
                <label className="block text-xs text-white/40 mb-2">Mode</label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as "grid" | "list")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
                >
                  <option value="grid" className="bg-black">
                    Grid View
                  </option>
                  <option value="list" className="bg-black">
                    List View
                  </option>
                </select>
              </div>

              {/* Layout Style */}
              <div>
                <label className="block text-xs text-white/40 mb-2">Layout</label>
                <select
                  value={layoutStyle}
                  onChange={(e) => setLayoutStyle(e.target.value as "single" | "split")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
                >
                  <option value="single" className="bg-black">
                    Single Category
                  </option>
                  <option value="split" className="bg-black">
                    Split Screen
                  </option>
                </select>
              </div>
            </div>

            {/* Grid Config - Only show for grid mode */}
            {displayMode === "grid" && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Columns</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={gridColumns}
                    onChange={(e) => setGridColumns(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">Rows</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={gridRows}
                    onChange={(e) => setGridRows(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>
            )}

            {/* Theme */}
            <div>
              <label className="block text-xs text-white/40 mb-2">
                Theme
                <span className="ml-2 text-[10px] text-white/30">(changes apply instantly)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={async () => {
                        console.log("🎨 [THEME BUTTON] Clicked:", t.id);

                        // Update local state immediately for instant UI feedback
                        setTheme(t.id);
                        console.log("🎨 [THEME BUTTON] Local state updated");

                        // If instant theme update function is provided, call it
                        if (onThemeChange && menu?.id) {
                          console.log("🎨 [THEME BUTTON] Calling onThemeChange...");
                          const result = await onThemeChange(menu.id, t.id);
                          console.log("🎨 [THEME BUTTON] Result:", result);
                        } else {
                          console.warn("🎨 [THEME BUTTON] No onThemeChange function or menu ID");
                        }
                      }}
                      className={`p-2 rounded-lg border transition-all ${
                        isSelected
                          ? "border-white bg-white/5"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div
                        className="h-10 rounded mb-1.5"
                        style={{ background: t.preview.background }}
                      />
                      <div className="text-white text-[10px] font-medium text-center">{t.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Slide */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white font-medium">Auto-Slide</div>
                <div className="text-xs text-white/40">Cycle through pages</div>
              </div>
              <div className="flex items-center gap-3">
                {enableCarousel && (
                  <span className="text-sm text-white/60">{carouselInterval}s</span>
                )}
                <button
                  onClick={() => setEnableCarousel(!enableCarousel)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableCarousel ? "bg-white/20" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableCarousel ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {enableCarousel && (
              <div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={carouselInterval}
                  onChange={(e) => setCarouselInterval(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>3s</span>
                  <span>15s</span>
                </div>
              </div>
            )}

            {/* Show Sub-Categories */}
            <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2 pt-4">
              <div>
                <div className="text-sm text-white font-medium">Show Sub-Categories</div>
                <div className="text-xs text-white/40">
                  Display sub-categories as section headers
                </div>
              </div>
              <button
                onClick={() => setShowSubCategories(!showSubCategories)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showSubCategories ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showSubCategories ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold mb-3">
              Categories
            </h3>
            <CategorySelector
              availableCategories={availableCategories}
              selectedCategories={categories}
              onCategoriesChange={setCategories}
              showAllOption={true}
            />
          </div>

          {/* Split View Config - Only show for split mode */}
          {layoutStyle === "split" && (
            <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold">
                  Split Screen Configuration
                </h3>
                {availableCustomFields.length > 0 && (
                  <button
                    onClick={() => setHideAllFieldLabels(!hideAllFieldLabels)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      hideAllFieldLabels
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {hideAllFieldLabels ? "Show Labels" : "Hide Labels"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Left Side */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white/80">Left Side</div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Category</label>
                    <select
                      value={splitLeftCategory}
                      onChange={(e) => setSplitLeftCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-black">
                        Select...
                      </option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat} className="bg-black">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Title (Optional)</label>
                    <input
                      type="text"
                      value={splitLeftTitle}
                      onChange={(e) => setSplitLeftTitle(e.target.value)}
                      placeholder="Custom title..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  {/* Left Custom Fields */}
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Fields</label>
                    <div className="flex flex-wrap gap-1">
                      {availableCustomFields.map((field) => {
                        const isSelected = splitLeftCustomFields.includes(field);
                        const displayName = field
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return (
                          <button
                            key={field}
                            onClick={() => {
                              setSplitLeftCustomFields(
                                isSelected
                                  ? splitLeftCustomFields.filter((f) => f !== field)
                                  : [...splitLeftCustomFields, field],
                              );
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-white/50 hover:bg-white/10"
                            }`}
                          >
                            {displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Left Price Breaks */}
                  {splitLeftCategory && categoryPricingConfig[splitLeftCategory] && (
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Prices</label>
                      <div className="flex flex-wrap gap-1">
                        {categoryPricingConfig[splitLeftCategory].available.map((priceBreak) => {
                          const isSelected = splitLeftPriceBreaks.includes(priceBreak);
                          const displayName = PRICE_BREAK_LABELS[priceBreak] || priceBreak;
                          return (
                            <button
                              key={priceBreak}
                              onClick={() => {
                                setSplitLeftPriceBreaks(
                                  isSelected
                                    ? splitLeftPriceBreaks.filter((p) => p !== priceBreak)
                                    : [...splitLeftPriceBreaks, priceBreak],
                                );
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-white/5 text-white/50 hover:bg-white/10"
                              }`}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white/80">Right Side</div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Category</label>
                    <select
                      value={splitRightCategory}
                      onChange={(e) => setSplitRightCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-black">
                        Select...
                      </option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat} className="bg-black">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Title (Optional)</label>
                    <input
                      type="text"
                      value={splitRightTitle}
                      onChange={(e) => setSplitRightTitle(e.target.value)}
                      placeholder="Custom title..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  {/* Right Custom Fields */}
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Fields</label>
                    <div className="flex flex-wrap gap-1">
                      {availableCustomFields.map((field) => {
                        const isSelected = splitRightCustomFields.includes(field);
                        const displayName = field
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return (
                          <button
                            key={field}
                            onClick={() => {
                              setSplitRightCustomFields(
                                isSelected
                                  ? splitRightCustomFields.filter((f) => f !== field)
                                  : [...splitRightCustomFields, field],
                              );
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-white/50 hover:bg-white/10"
                            }`}
                          >
                            {displayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Price Breaks */}
                  {splitRightCategory && categoryPricingConfig[splitRightCategory] && (
                    <div>
                      <label className="block text-xs text-white/40 mb-1.5">Prices</label>
                      <div className="flex flex-wrap gap-1">
                        {categoryPricingConfig[splitRightCategory].available.map((priceBreak) => {
                          const isSelected = splitRightPriceBreaks.includes(priceBreak);
                          const displayName = PRICE_BREAK_LABELS[priceBreak] || priceBreak;
                          return (
                            <button
                              key={priceBreak}
                              onClick={() => {
                                setSplitRightPriceBreaks(
                                  isSelected
                                    ? splitRightPriceBreaks.filter((p) => p !== priceBreak)
                                    : [...splitRightPriceBreaks, priceBreak],
                                );
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-white/5 text-white/50 hover:bg-white/10"
                              }`}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Information - Only show for single mode */}
          {layoutStyle === "single" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold">
                  Product Information
                </h3>
                {availableCustomFields.length > 0 && (
                  <button
                    onClick={() => setHideAllFieldLabels(!hideAllFieldLabels)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      hideAllFieldLabels
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {hideAllFieldLabels ? "Show Labels" : "Hide Labels"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {availableCustomFields.map((field) => {
                  const isSelected = customFields.includes(field);
                  const displayName = field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  return (
                    <button
                      key={field}
                      onClick={() => {
                        if (isSelected) {
                          setCustomFields(customFields.filter((f) => f !== field));
                        } else {
                          setCustomFields([...customFields, field]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-white/20 text-white border border-white/20"
                          : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
              {customFields.length === 0 && (
                <p className="text-xs text-white/30">
                  No fields selected - only name and pricing will show
                </p>
              )}
            </div>
          )}

          {/* Pricing Tiers - Only show for single mode */}
          {layoutStyle === "single" && categories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold">
                  Pricing Tiers
                </h3>
                {loadingTiers && (
                  <span className="text-xs text-white/40 animate-pulse">Loading...</span>
                )}
              </div>

              <div className="space-y-3">
                {categories.map((category) => {
                  const config = categoryPricingConfig[category];
                  if (!config) return null;

                  const { available, selected } = config;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">{category}</span>
                        <span className="text-xs text-white/40">
                          {selected.length} of {available.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {available.map((priceBreak) => {
                          const isSelected = selected.includes(priceBreak);
                          const displayName = PRICE_BREAK_LABELS[priceBreak] || priceBreak;

                          return (
                            <button
                              key={priceBreak}
                              onClick={() => {
                                const newSelected = isSelected
                                  ? selected.filter((b) => b !== priceBreak)
                                  : [...selected, priceBreak];

                                setCategoryPricingConfig({
                                  ...categoryPricingConfig,
                                  [category]: {
                                    ...config,
                                    selected: newSelected,
                                  },
                                });
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-white/20 text-white border border-white/20"
                                  : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                              }`}
                            >
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          {error && (
            <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || updating}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
