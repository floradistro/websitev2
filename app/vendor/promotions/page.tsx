'use client';

import { useEffect, useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, X, Trash2, Calendar, Clock, Percent, DollarSign, Package, Grid3x3, Layers, Globe } from 'lucide-react';

interface Promotion {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  promotion_type: 'product' | 'category' | 'tier' | 'global';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  target_product_ids?: string[];
  target_categories?: string[];
  target_tier_rules?: any;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  time_of_day_start?: string;
  time_of_day_end?: string;
  badge_text?: string;
  badge_color?: string;
  show_original_price?: boolean;
  priority?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  category?: string;
}

const BADGE_COLORS = [
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function PromotionsPage() {
  const { vendor } = useAppAuth();

  // State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'product' | 'category' | 'tier' | 'global'>('product');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formTargetProducts, setFormTargetProducts] = useState<string[]>([]);
  const [formTargetCategories, setFormTargetCategories] = useState<string[]>([]);
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formBadgeColor, setFormBadgeColor] = useState('red');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([]);
  const [formTimeStart, setFormTimeStart] = useState('');
  const [formTimeEnd, setFormTimeEnd] = useState('');
  const [formPriority, setFormPriority] = useState('0');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    if (vendor) {
      loadData();
    }
  }, [vendor]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!vendor) return;

    const channel = supabase
      .channel('promotions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'promotions',
        filter: `vendor_id=eq.${vendor.id}`,
      }, (payload) => {
        console.log('🎉 Promotion changed:', payload);
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor]);

  const loadData = async () => {
    if (!vendor) return;

    try {
      setLoading(true);

      // Load promotions
      const promotionsRes = await fetch(`/api/vendor/promotions?vendor_id=${vendor.id}`);
      const promotionsData = await promotionsRes.json();

      if (promotionsData.success) {
        setPromotions(promotionsData.promotions || []);
      }

      // Load products for product picker
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('vendor_id', vendor.id)
        .eq('status', 'published')
        .order('name');

      if (productsData) {
        setProducts(productsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setFormName(promotion.name);
    setFormDescription(promotion.description || '');
    setFormType(promotion.promotion_type);
    setFormDiscountType(promotion.discount_type);
    setFormDiscountValue(String(promotion.discount_value));
    setFormTargetProducts(promotion.target_product_ids || []);
    setFormTargetCategories(promotion.target_categories || []);
    setFormBadgeText(promotion.badge_text || '');
    setFormBadgeColor(promotion.badge_color || 'red');
    setFormStartTime(promotion.start_time || '');
    setFormEndTime(promotion.end_time || '');
    setFormDaysOfWeek(promotion.days_of_week || []);
    setFormTimeStart(promotion.time_of_day_start || '');
    setFormTimeEnd(promotion.time_of_day_end || '');
    setFormPriority(String(promotion.priority || 0));
    setFormIsActive(promotion.is_active);
    setEditingPromotion(promotion);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormType('product');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormTargetProducts([]);
    setFormTargetCategories([]);
    setFormBadgeText('');
    setFormBadgeColor('red');
    setFormStartTime('');
    setFormEndTime('');
    setFormDaysOfWeek([]);
    setFormTimeStart('');
    setFormTimeEnd('');
    setFormPriority('0');
    setFormIsActive(true);
    setEditingPromotion(null);
  };

  const handleSave = async () => {
    if (!vendor || !formName || !formDiscountValue) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        vendor_id: vendor.id,
        name: formName,
        description: formDescription || null,
        promotion_type: formType,
        discount_type: formDiscountType,
        discount_value: parseFloat(formDiscountValue),
        target_product_ids: formType === 'product' ? formTargetProducts : null,
        target_categories: formType === 'category' ? formTargetCategories : null,
        target_tier_rules: formType === 'tier' ? {} : null,
        start_time: formStartTime || null,
        end_time: formEndTime || null,
        days_of_week: formDaysOfWeek.length > 0 ? formDaysOfWeek : null,
        time_of_day_start: formTimeStart || null,
        time_of_day_end: formTimeEnd || null,
        badge_text: formBadgeText || null,
        badge_color: formBadgeColor,
        show_original_price: true,
        priority: parseInt(formPriority) || 0,
        is_active: formIsActive,
      };

      let res;
      if (editingPromotion) {
        // Update
        res = await fetch('/api/vendor/promotions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPromotion.id, ...payload }),
        });
      } else {
        // Create
        res = await fetch('/api/vendor/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        setShowCreateModal(false);
        resetForm();
        loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/promotions?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setDeletingPromotion(null);
        loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const toggleDay = (day: number) => {
    if (formDaysOfWeek.includes(day)) {
      setFormDaysOfWeek(formDaysOfWeek.filter(d => d !== day));
    } else {
      setFormDaysOfWeek([...formDaysOfWeek, day].sort());
    }
  };

  const toggleProduct = (productId: string) => {
    if (formTargetProducts.includes(productId)) {
      setFormTargetProducts(formTargetProducts.filter(id => id !== productId));
    } else {
      setFormTargetProducts([...formTargetProducts, productId]);
    }
  };

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package size={16} />;
      case 'category': return <Grid3x3 size={16} />;
      case 'tier': return <Layers size={16} />;
      case 'global': return <Globe size={16} />;
      default: return <Tag size={16} />;
    }
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Product';
      case 'category': return 'Category';
      case 'tier': return 'Tier';
      case 'global': return 'Global';
      default: return type;
    }
  };

  const formatDiscount = (promo: Promotion) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% OFF`;
    } else {
      return `$${promo.discount_value} OFF`;
    }
  };

  const isPromotionActive = (promo: Promotion) => {
    if (!promo.is_active) return false;

    const now = new Date();

    // Check date range
    if (promo.start_time && new Date(promo.start_time) > now) return false;
    if (promo.end_time && new Date(promo.end_time) < now) return false;

    // Check day of week
    if (promo.days_of_week && promo.days_of_week.length > 0) {
      const currentDay = now.getDay();
      if (!promo.days_of_week.includes(currentDay)) return false;
    }

    // Check time of day
    if (promo.time_of_day_start && promo.time_of_day_end) {
      const currentTime = now.toTimeString().slice(0, 8);
      if (currentTime < promo.time_of_day_start || currentTime > promo.time_of_day_end) {
        return false;
      }
    }

    return true;
  };

  const activePromotions = promotions.filter(p => isPromotionActive(p));
  const inactivePromotions = promotions.filter(p => !isPromotionActive(p));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 text-xs">Loading promotions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
              Promotions
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              System-Wide Sales · POS · TV Menus · Storefront
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="px-6 py-3 bg-white text-purple-900 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Create Promotion
          </motion.button>
        </div>
      </div>

      {/* Active Promotions */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Active Now ({activePromotions.length})</h2>
        {activePromotions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center">
            <Tag className="mx-auto mb-4 text-white/40" size={48} />
            <p className="text-white/60">No active promotions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromotions.map((promo) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 relative"
              >
                {/* Badge */}
                {promo.badge_text && (
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-lg text-xs font-black uppercase"
                    style={{
                      backgroundColor: BADGE_COLORS.find(c => c.value === promo.badge_color)?.hex + '30',
                      color: BADGE_COLORS.find(c => c.value === promo.badge_color)?.hex,
                      border: `2px solid ${BADGE_COLORS.find(c => c.value === promo.badge_color)?.hex}`,
                    }}
                  >
                    {promo.badge_text}
                  </div>
                )}

                {/* Type */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-white/60">
                    {getPromotionTypeIcon(promo.promotion_type)}
                  </div>
                  <div className="text-white/60 text-sm font-bold uppercase tracking-wider">
                    {getPromotionTypeLabel(promo.promotion_type)}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-white text-xl font-black mb-2">{promo.name}</h3>

                {/* Discount */}
                <div className="text-green-400 text-2xl font-black mb-3">
                  {formatDiscount(promo)}
                </div>

                {/* Description */}
                {promo.description && (
                  <p className="text-white/60 text-sm mb-4">{promo.description}</p>
                )}

                {/* Schedule Info */}
                <div className="space-y-2 mb-4">
                  {promo.start_time && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Calendar size={14} />
                      <span>Starts: {new Date(promo.start_time).toLocaleDateString()}</span>
                    </div>
                  )}
                  {promo.end_time && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Calendar size={14} />
                      <span>Ends: {new Date(promo.end_time).toLocaleDateString()}</span>
                    </div>
                  )}
                  {promo.time_of_day_start && promo.time_of_day_end && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Clock size={14} />
                      <span>{promo.time_of_day_start.slice(0, 5)} - {promo.time_of_day_end.slice(0, 5)}</span>
                    </div>
                  )}
                  {promo.days_of_week && promo.days_of_week.length > 0 && (
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <div
                          key={day.value}
                          className={`text-xs px-2 py-1 rounded ${
                            promo.days_of_week!.includes(day.value)
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(promo)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingPromotion(promo)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-bold transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive/Scheduled Promotions */}
      {inactivePromotions.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Scheduled & Inactive ({inactivePromotions.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactivePromotions.map((promo) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 opacity-60"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-white/40">
                    {getPromotionTypeIcon(promo.promotion_type)}
                  </div>
                  <div className="text-white/40 text-sm font-bold uppercase tracking-wider">
                    {getPromotionTypeLabel(promo.promotion_type)}
                  </div>
                </div>

                <h3 className="text-white text-xl font-black mb-2">{promo.name}</h3>
                <div className="text-gray-400 text-2xl font-black mb-3">
                  {formatDiscount(promo)}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(promo)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingPromotion(promo)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-bold transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingPromotion) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-white">
                  {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-white/60 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-white/60 text-sm font-bold mb-2">Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="20% Off All Sativas"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white/60 text-sm font-bold mb-2">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Save 20% on all sativa strains this week!"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none"
                  />
                </div>

                {/* Promotion Type */}
                <div>
                  <label className="block text-white/60 text-sm font-bold mb-2">Type *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'product', label: 'Product', icon: <Package size={16} /> },
                      { value: 'category', label: 'Category', icon: <Grid3x3 size={16} /> },
                      { value: 'tier', label: 'Tier', icon: <Layers size={16} /> },
                      { value: 'global', label: 'Global', icon: <Globe size={16} /> },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFormType(type.value as any)}
                        className={`px-4 py-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition ${
                          formType === type.value
                            ? 'bg-white text-purple-900'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Products (if product type) */}
                {formType === 'product' && (
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Select Products</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-48 overflow-y-auto">
                      {products.map((product) => (
                        <label key={product.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 rounded px-2">
                          <input
                            type="checkbox"
                            checked={formTargetProducts.includes(product.id)}
                            onChange={() => toggleProduct(product.id)}
                            className="w-5 h-5"
                          />
                          <span className="text-white text-sm">{product.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Discount Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFormDiscountType('percentage')}
                        className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                          formDiscountType === 'percentage'
                            ? 'bg-white text-purple-900'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        <Percent size={16} />
                        %
                      </button>
                      <button
                        onClick={() => setFormDiscountType('fixed_amount')}
                        className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                          formDiscountType === 'fixed_amount'
                            ? 'bg-white text-purple-900'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        <DollarSign size={16} />
                        $
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Value *</label>
                    <input
                      type="number"
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      placeholder={formDiscountType === 'percentage' ? '20' : '5.00'}
                      step={formDiscountType === 'percentage' ? '1' : '0.01'}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Badge */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Badge Text</label>
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder="20% OFF"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Badge Color</label>
                    <div className="grid grid-cols-6 gap-2">
                      {BADGE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormBadgeColor(color.value)}
                          className={`w-full aspect-square rounded-lg border-2 transition ${
                            formBadgeColor === color.value
                              ? 'border-white scale-110'
                              : 'border-white/20 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">End Date</label>
                    <input
                      type="datetime-local"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Days of Week */}
                <div>
                  <label className="block text-white/60 text-sm font-bold mb-2">Days of Week (optional)</label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`flex-1 px-3 py-2 rounded-lg font-bold text-sm transition ${
                          formDaysOfWeek.includes(day.value)
                            ? 'bg-white text-purple-900'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time of Day */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Time Start (optional)</label>
                    <input
                      type="time"
                      value={formTimeStart}
                      onChange={(e) => setFormTimeStart(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Time End (optional)</label>
                    <input
                      type="time"
                      value={formTimeEnd}
                      onChange={(e) => setFormTimeEnd(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Priority & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Priority</label>
                    <input
                      type="number"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm font-bold mb-2">Status</label>
                    <button
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`w-full px-4 py-3 rounded-xl font-bold transition ${
                        formIsActive
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {formIsActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formName || !formDiscountValue}
                    className="flex-1 px-6 py-3 bg-white text-purple-900 rounded-xl font-bold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : editingPromotion ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingPromotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeletingPromotion(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-red-900 rounded-3xl p-8 max-w-md border-2 border-red-500/50"
            >
              <h3 className="text-2xl font-black text-white mb-4">Delete Promotion?</h3>
              <p className="text-white/60 mb-6">
                Are you sure you want to delete "{deletingPromotion.name}"? This will immediately remove the promotion from all systems.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingPromotion(null)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingPromotion.id)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
