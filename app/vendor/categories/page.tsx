"use client";

import { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Trash2, Globe, Lock, Save, X, Upload, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import PageHeader, { Button } from '@/components/dashboard/PageHeader';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
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
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [formIconType, setFormIconType] = useState<'emoji' | 'image'>('emoji');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');

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
    setFormIconType('emoji');
    setIconFile(null);
    setIconPreview('');
    setShowCreateModal(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormIcon(category.icon || '📦');
    setFormIconType(category.image_url ? 'image' : 'emoji');
    setIconFile(null);
    setIconPreview(category.image_url || '');
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('📦');
    setFormIconType('emoji');
    setIconFile(null);
    setIconPreview('');
  }

  function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormIconType('image');
    }
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
      let imageUrl = '';

      // Upload image if custom icon selected
      if (formIconType === 'image' && iconFile) {
        const formData = new FormData();
        formData.append('file', iconFile);
        formData.append('type', 'category-icon');

        const uploadRes = await fetch('/api/supabase/vendor/upload', {
          method: 'POST',
          headers: { 'x-vendor-id': vendor?.id || '' },
          body: formData
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Icon upload failed');
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.file.url;
      }

      const method = editingCategory ? 'PUT' : 'POST';
      const body: any = {
        name: formName,
        description: formDescription,
      };

      if (editingCategory) {
        body.id = editingCategory.id;
      }

      // Set icon based on type
      if (formIconType === 'image') {
        body.image_url = imageUrl || iconPreview; // Use new upload or existing preview
        body.icon = null; // Clear emoji if using custom image
      } else {
        body.icon = formIcon;
        body.image_url = null; // Clear custom image if using emoji
      }

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

  function toggleSelectCategory(categoryId: string) {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  }

  function toggleSelectAll() {
    if (selectedCategories.size === customCategories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(customCategories.map(c => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedCategories.size === 0) {
      showNotification({
        type: 'warning',
        title: 'No Selection',
        message: 'Please select categories to delete'
      });
      return;
    }

    const count = selectedCategories.size;
    if (!confirm(`Delete ${count} selected ${count === 1 ? 'category' : 'categories'}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const deletePromises = Array.from(selectedCategories).map(categoryId =>
        fetch(`/api/categories?id=${categoryId}`, {
          method: 'DELETE',
          headers: {
            'x-vendor-id': vendor?.id || ''
          }
        }).then(res => res.json())
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        showNotification({
          type: 'success',
          title: 'Categories Deleted',
          message: `Successfully deleted ${count} ${count === 1 ? 'category' : 'categories'}`
        });
      } else {
        showNotification({
          type: 'warning',
          title: 'Partial Success',
          message: `Deleted ${count - failed.length} of ${count} categories`
        });
      }

      setSelectedCategories(new Set());
      loadCategories();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Could not delete categories'
      });
    } finally {
      setIsDeleting(false);
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
          <div className="flex gap-2">
            {selectedCategories.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 size={14} strokeWidth={2.5} className="mr-1.5" />
                Delete ({selectedCategories.size})
              </Button>
            )}
            <Button onClick={openCreateModal}>
              <Plus size={14} strokeWidth={2.5} className="mr-1.5" />
              New Category
            </Button>
          </div>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-white/60" strokeWidth={2} />
                <h2 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  Your Custom Categories
                </h2>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                  {customCategories.length} custom
                </span>
              </div>

              {customCategories.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-[0.15em] font-black"
                  style={{ fontWeight: 900 }}
                >
                  {selectedCategories.size === customCategories.length ? (
                    <>
                      <CheckSquare size={14} strokeWidth={2.5} />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square size={14} strokeWidth={2.5} />
                      Select All
                    </>
                  )}
                </button>
              )}
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
                {customCategories.map((category) => {
                  const isSelected = selectedCategories.has(category.id);
                  return (
                    <div
                      key={category.id}
                      className={`bg-white/5 border rounded-2xl p-4 transition-all group relative ${
                        isSelected
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={() => toggleSelectCategory(category.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-white text-black'
                              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} strokeWidth={2.5} />
                          ) : (
                            <Square size={16} strokeWidth={2.5} />
                          )}
                        </button>
                      </div>

                      <div className="flex items-start justify-between mb-3 pr-10">
                        <div className="flex items-center gap-3">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-10 h-10 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <span className="text-3xl">{category.icon || '📦'}</span>
                          )}
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
                  );
                })}
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
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-8 h-8 rounded-lg object-cover border border-white/10"
                        />
                      ) : (
                        <span className="text-xl">{category.icon || '📦'}</span>
                      )}
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
              {/* Icon Type Selector */}
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block mb-3">
                  Icon Type
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormIconType('emoji')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formIconType === 'emoji'
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">📦</div>
                    <div className="text-white/80 text-[10px] uppercase tracking-[0.15em] font-black">Emoji</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIconType('image')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formIconType === 'image'
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ImageIcon size={24} className="mx-auto mb-1 text-white/60" />
                    <div className="text-white/80 text-[10px] uppercase tracking-[0.15em] font-black">Custom</div>
                  </button>
                </div>

                {/* Emoji Picker */}
                {formIconType === 'emoji' && (
                  <div>
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
                )}

                {/* Custom Image Upload */}
                {formIconType === 'image' && (
                  <div className="space-y-4">
                    {iconPreview && (
                      <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setIconPreview('');
                            setIconFile(null);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors bg-black/50 rounded-2xl">
                        <Upload size={24} className="text-white/40 mx-auto mb-2" />
                        <div className="text-white/80 text-[10px] uppercase tracking-[0.15em] font-black">
                          Upload Custom Icon
                        </div>
                        <div className="text-white/40 text-[9px] mt-1">
                          PNG, JPG, SVG • Max 5MB
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
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
