'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Layout, Sparkles, Grid3x3, Monitor } from 'lucide-react';
import { themes, type TVTheme } from '@/lib/themes';
import CategorySelector from '@/components/tv-menus/CategorySelector';

interface MenuEditorModalProps {
  menu: any;
  onClose: () => void;
  onSave: (menuData: any) => void;
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
  updating,
  error,
  availableCategories,
  availableCustomFields,
  availablePriceBreaks
}: MenuEditorModalProps) {
  const [tab, setTab] = useState<'content' | 'layout' | 'style'>('content');

  // Basic info
  const [name, setName] = useState(menu?.name || '');
  const [description, setDescription] = useState(menu?.description || '');

  // Content
  const [categories, setCategories] = useState<string[]>(menu?.config_data?.categories || []);
  const [customFields, setCustomFields] = useState<string[]>(menu?.config_data?.customFields || []);
  const [customFieldsConfig, setCustomFieldsConfig] = useState<{ [field: string]: { showLabel: boolean } }>(
    menu?.config_data?.customFieldsConfig || {}
  );
  const [visiblePriceBreaks, setVisiblePriceBreaks] = useState<string[]>(
    menu?.config_data?.visible_price_breaks || []
  );

  // Layout
  const [layoutStyle, setLayoutStyle] = useState<'single' | 'split'>(menu?.config_data?.layoutStyle || 'single');
  const [gridColumns, setGridColumns] = useState(menu?.config_data?.gridColumns || 6);
  const [gridRows, setGridRows] = useState(menu?.config_data?.gridRows || 5);

  // Split view config
  const [splitLeftCategory, setSplitLeftCategory] = useState(menu?.config_data?.splitLeftCategory || '');
  const [splitLeftTitle, setSplitLeftTitle] = useState(menu?.config_data?.splitLeftTitle || '');
  const [splitLeftCustomFields, setSplitLeftCustomFields] = useState<string[]>(
    menu?.config_data?.splitLeftCustomFields || []
  );
  const [splitLeftPriceBreaks, setSplitLeftPriceBreaks] = useState<string[]>(
    menu?.config_data?.splitLeftPriceBreaks || []
  );
  const [splitRightCategory, setSplitRightCategory] = useState(menu?.config_data?.splitRightCategory || '');
  const [splitRightTitle, setSplitRightTitle] = useState(menu?.config_data?.splitRightTitle || '');
  const [splitRightCustomFields, setSplitRightCustomFields] = useState<string[]>(
    menu?.config_data?.splitRightCustomFields || []
  );
  const [splitRightPriceBreaks, setSplitRightPriceBreaks] = useState<string[]>(
    menu?.config_data?.splitRightPriceBreaks || []
  );

  // Style
  const [theme, setTheme] = useState(menu?.theme || 'midnight-elegance');
  const [enableCarousel, setEnableCarousel] = useState(menu?.config_data?.enableCarousel !== false);
  const [carouselInterval, setCarouselInterval] = useState(menu?.config_data?.carouselInterval || 5);

  const tabs = [
    { id: 'content' as const, label: 'Content', icon: Grid3x3, description: 'Categories, fields, pricing' },
    { id: 'layout' as const, label: 'Layout', icon: Layout, description: 'Grid, single/split view' },
    { id: 'style' as const, label: 'Style', icon: Sparkles, description: 'Theme, auto-slide' }
  ];

  const handleSave = () => {
    onSave({
      name,
      description,
      theme,
      categories,
      customFields,
      customFieldsConfig,
      visiblePriceBreaks,
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
      carouselInterval
    });
  };

  const priceBreakLabels: { [key: string]: string } = {
    '1g': '1g',
    '3_5g': '3.5g',
    '7g': '7g',
    '14g': '14g',
    '28g': '28g'
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
        className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">Edit Menu</h2>
            <p className="text-sm text-white/50 mt-1">Configure your TV display menu</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-6 pt-4 border-b border-white/10">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all relative ${
                  tab === t.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/75 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <div className="text-left">
                  <div className="font-bold text-sm">{t.label}</div>
                  <div className="text-xs opacity-75">{t.description}</div>
                </div>
                {tab === t.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Name & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Menu Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Main Menu, Daily Specials"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      disabled={updating}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <CategorySelector
                    availableCategories={availableCategories}
                    selectedCategories={categories}
                    onCategoriesChange={setCategories}
                    showAllOption={true}
                  />
                </div>

                {/* Custom Fields */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">Product Information</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCustomFields.map((field) => {
                      const isSelected = customFields.includes(field);
                      const displayName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const showLabel = customFieldsConfig[field]?.showLabel !== false;

                      return (
                        <div key={field} className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (isSelected) {
                                setCustomFields(customFields.filter(f => f !== field));
                                const newConfig = { ...customFieldsConfig };
                                delete newConfig[field];
                                setCustomFieldsConfig(newConfig);
                              } else {
                                setCustomFields([...customFields, field]);
                                setCustomFieldsConfig({ ...customFieldsConfig, [field]: { showLabel: true } });
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {displayName}
                          </button>
                          {isSelected && (
                            <button
                              onClick={() => {
                                setCustomFieldsConfig({
                                  ...customFieldsConfig,
                                  [field]: { showLabel: !showLabel }
                                });
                              }}
                              className={`px-2 py-2 rounded-full text-xs font-bold transition-all ${
                                showLabel ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                              }`}
                              title={showLabel ? 'Hide label' : 'Show label'}
                            >
                              ABC
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {customFields.length === 0 && (
                    <p className="text-xs text-white/40 mt-2">No fields selected - only product name and pricing will show</p>
                  )}
                </div>

                {/* Price Breaks */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">Pricing Tiers</label>
                  <div className="flex flex-wrap gap-2">
                    {availablePriceBreaks.map((breakId) => {
                      const isSelected = visiblePriceBreaks.includes(breakId);
                      const displayName = priceBreakLabels[breakId] || breakId;

                      return (
                        <button
                          key={breakId}
                          onClick={() => {
                            if (isSelected) {
                              setVisiblePriceBreaks(visiblePriceBreaks.filter(b => b !== breakId));
                            } else {
                              setVisiblePriceBreaks([...visiblePriceBreaks, breakId]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {displayName}
                        </button>
                      );
                    })}
                  </div>
                  {visiblePriceBreaks.length === 0 && (
                    <p className="text-xs text-white/40 mt-2">No pricing selected - prices won't display</p>
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'layout' && (
              <motion.div
                key="layout"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Layout Style */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">Layout Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['single', 'split'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setLayoutStyle(style as 'single' | 'split')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          layoutStyle === style
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="text-white font-bold mb-1 capitalize">{style} View</div>
                        <div className="text-xs text-white/60">
                          {style === 'single' ? 'One category display' : 'Two categories side-by-side'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Columns</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={gridColumns}
                      onChange={(e) => setGridColumns(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Rows</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={gridRows}
                      onChange={(e) => setGridRows(parseInt(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Split View Config */}
                {layoutStyle === 'split' && (
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="font-bold text-white">Split View Configuration</h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Side */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white">Left Side</h4>
                        <select
                          value={splitLeftCategory}
                          onChange={(e) => setSplitLeftCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select category...</option>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={splitLeftTitle}
                          onChange={(e) => setSplitLeftTitle(e.target.value)}
                          placeholder="Custom title (optional)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Right Side */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white">Right Side</h4>
                        <select
                          value={splitRightCategory}
                          onChange={(e) => setSplitRightCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select category...</option>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={splitRightTitle}
                          onChange={(e) => setSplitRightTitle(e.target.value)}
                          placeholder="Custom title (optional)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'style' && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Theme Selector */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">Display Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((t) => {
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-white shadow-lg shadow-white/20'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div
                            className="h-16 rounded-lg mb-2 overflow-hidden relative"
                            style={{ background: t.preview.background }}
                          >
                            <div className="absolute inset-2 flex items-center justify-center">
                              <div
                                className="w-full h-full rounded flex flex-col items-center justify-center gap-0.5"
                                style={{
                                  background: t.preview.cardBg,
                                  borderColor: t.preview.accent,
                                  borderWidth: '1px',
                                }}
                              >
                                <div className="text-[8px] font-bold" style={{ color: t.preview.textPrimary }}>
                                  Product
                                </div>
                                <div className="text-[10px] font-black" style={{ color: t.preview.accent }}>
                                  $12
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-bold text-xs text-center">{t.name}</div>
                          {isSelected && (
                            <div className="mt-1 text-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auto-Slide Configuration */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Auto-Slide</div>
                      <div className="text-xs text-white/50">Cycle through pages automatically</div>
                    </div>
                    <button
                      onClick={() => setEnableCarousel(!enableCarousel)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableCarousel ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableCarousel ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {enableCarousel && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-white/80">Interval</label>
                        <span className="text-lg font-bold text-purple-300">{carouselInterval}s</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={carouselInterval}
                        onChange={(e) => setCarouselInterval(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>3s (Fast)</span>
                        <span>15s (Slow)</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Always Visible */}
        <div className="border-t border-white/10 p-6 bg-gradient-to-t from-black/50">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || updating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
