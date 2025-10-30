"use client";

import { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Trash2, Globe, Lock, Save, X } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import PageHeader, { Button } from '@/components/dashboard/PageHeader';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  vendor_id: string | null;
  parent_id: string | null;
}

export default function VendorCategoriesPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('📦');

  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor?.id) {
      loadCategories();
    }
  }, [authLoading, isAuthenticated, vendor?.id]);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories?vendor_id=${vendor?.id}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load categories'
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('📦');
    setShowCreateModal(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIcon(category.icon || '📦');
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('📦');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter a category name'
      });
      return;
    }

    setSaving(true);

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { id: editingCategory.id, name: formName, description: formDescription, icon: formIcon }
        : { name: formName, description: formDescription, icon: formIcon };

      const res = await fetch('/api/categories', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor?.id || ''
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: editingCategory ? 'Category Updated' : 'Category Created',
          message: `${formName} has been ${editingCategory ? 'updated' : 'created'} successfully`
        });
        closeModal();
        loadCategories();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || 'Could not save category'
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!category.vendor_id) {
      showNotification({
        type: 'error',
        title: 'Cannot Delete',
        message: 'Global categories cannot be deleted'
      });
      return;
    }

    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/categories?id=${category.id}`, {
        method: 'DELETE',
        headers: {
          'x-vendor-id': vendor?.id || ''
        }
      });

      const data = await res.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Category Deleted',
          message: `${category.name} has been deleted`
        });
        loadCategories();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Could not delete category'
      });
    } finally {
      setSaving(false);
    }
  }

  // Separate global and custom categories
  const globalCategories = categories.filter(c => !c.vendor_id);
  const customCategories = categories.filter(c => c.vendor_id);

  const commonEmojis = ['📦', '🌿', '🍃', '💨', '🔥', '💊', '🍪', '🍬', '🧪', '💎', '🎯', '✨', '🌟', '🎁', '🏆', '⚡'];

  return (
    <div className="w-full px-4 lg:px-0">
      <PageHeader
        title="Categories"
        subtitle="Organize your products with custom categories"
        icon={FolderTree}
        actions={
          <Button onClick={openCreateModal}>
            <Plus size={14} strokeWidth={2.5} className="mr-1.5" />
            New Category
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <div className="flex gap-1 mr-3">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em]">Loading categories</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Categories */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-white/60" strokeWidth={2} />
              <h2 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                Your Custom Categories
              </h2>
              <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                {customCategories.length} custom
              </span>
            </div>

            {customCategories.length === 0 ? (
              <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🎨</div>
                <div className="text-white/60 text-sm font-black uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
                  Create Your First Category
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-6">
                  Organize products exactly how you want
                </p>
                <button
                  onClick={openCreateModal}
                  className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all inline-flex items-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Create Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.icon || '📦'}</span>
                        <div>
                          <h3 className="text-white font-black text-sm tracking-tight" style={{ fontWeight: 900 }}>
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mt-0.5">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(category)}
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-[9px] uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/20 font-black transition-all flex items-center justify-center gap-1.5"
                        style={{ fontWeight: 900 }}
                      >
                        <Edit2 size={10} strokeWidth={2.5} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={saving}
                        className="flex-1 bg-white/5 border border-white/10 text-red-400 rounded-xl px-3 py-2 text-[9px] uppercase tracking-[0.15em] hover:bg-red-500/10 hover:border-red-500/20 font-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ fontWeight: 900 }}
                      >
                        <Trash2 size={10} strokeWidth={2.5} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Categories */}
          {globalCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-white/60" strokeWidth={2} />
                <h2 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Global Categories
                </h2>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                  {globalCategories.length} available
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {globalCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-xs font-black tracking-tight truncate" style={{ fontWeight: 900 }}>
                          {category.name}
                        </h3>
                        <p className="text-white/40 text-[8px] uppercase tracking-[0.15em]">
                          System
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-black text-lg tracking-tight" style={{ fontWeight: 900 }}>
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 hover:text-white transition-all"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Icon Picker */}
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-3">
                  Icon
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-5xl">{formIcon}</div>
                  <div className="text-white/60 text-[10px] uppercase tracking-[0.15em]">
                    Select an icon
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        formIcon === emoji
                          ? 'bg-white/20 border-2 border-white/30'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., House Blends, Limited Edition"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 text-[10px] uppercase tracking-[0.15em] font-black transition-all"
                  style={{ fontWeight: 900 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formName.trim()}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} strokeWidth={2.5} />
                      {editingCategory ? 'Update' : 'Create'} Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
