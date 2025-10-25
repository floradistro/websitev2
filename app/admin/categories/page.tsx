"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Star, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '@/components/NotificationToast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  image_url?: string;
  banner_url?: string;
  display_order: number;
  is_active: boolean;
  featured: boolean;
  product_count: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  image_url: string;
  banner_url: string;
  display_order: number;
  is_active: boolean;
  featured: boolean;
  meta_title: string;
  meta_description: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    banner_url: '',
    display_order: 0,
    is_active: true,
    featured: false,
    meta_title: '',
    meta_description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        showError('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showError('Error loading categories');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      image_url: '',
      banner_url: '',
      display_order: 0,
      is_active: true,
      featured: false,
      meta_title: '',
      meta_description: ''
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(category: Category) {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id || '',
      image_url: category.image_url || '',
      banner_url: category.banner_url || '',
      display_order: category.display_order,
      is_active: category.is_active,
      featured: category.featured,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || ''
    });
    setEditingId(category.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = '/api/admin/categories';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(editingId ? 'Category updated successfully' : 'Category created successfully');
        resetForm();
        loadCategories();
      } else {
        showError(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Error saving category');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Category deleted successfully');
        loadCategories();
      } else {
        showError(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Error deleting category');
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentState })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Category ${!currentState ? 'activated' : 'deactivated'}`);
        loadCategories();
      } else {
        showError(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Error updating category');
    }
  }

  async function toggleFeatured(id: string, currentState: boolean) {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, featured: !currentState })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Category ${!currentState ? 'featured' : 'unfeatured'}`);
        loadCategories();
      } else {
        showError(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Error updating category');
    }
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    });
  }

  // Group categories by parent
  const topLevelCategories = categories.filter(c => !c.parent_id);
  const getChildCategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        input[type="checkbox"]:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
        }
        input[type="checkbox"]:checked {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid rgba(255, 255, 255, 0.9);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            Collections
          </h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            {loading ? 'LOADING...' : `${categories.length} CATEGORIES`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2 text-sm font-medium"
        >
          {showForm ? (
            <>
              <X size={18} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={18} />
              Add Category
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-black border border-white/10 p-6 mb-6">
          <h2 className="text-white text-lg font-medium mb-4">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                >
                  <option value="">None (Top Level)</option>
                  {topLevelCategories
                    .filter(c => c.id !== editingId)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Image */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Category Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        showError('Image must be less than 5MB');
                        return;
                      }

                      try {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        uploadFormData.append('categorySlug', formData.slug || 'temp');
                        uploadFormData.append('imageType', 'image');

                        const response = await fetch('/api/admin/categories/upload', {
                          method: 'POST',
                          body: uploadFormData
                        });

                        const data = await response.json();
                        if (data.success) {
                          setFormData({ ...formData, image_url: data.url });
                          showSuccess('Image uploaded successfully');
                        } else {
                          showError(data.error || 'Upload failed');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        showError('Failed to upload image');
                      }
                    }}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-white/10 file:text-white file:text-sm hover:file:bg-white/20"
                  />
                  {formData.image_url && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="flex-1 bg-black/30 border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-white/30"
                        placeholder="Or paste URL..."
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="px-3 py-2 bg-red-500/10 text-red-500 text-xs border border-red-500/20 hover:bg-red-500/20"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover border border-white/10" />
                  )}
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Banner Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        showError('Image must be less than 5MB');
                        return;
                      }

                      try {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        uploadFormData.append('categorySlug', formData.slug || 'temp');
                        uploadFormData.append('imageType', 'banner');

                        const response = await fetch('/api/admin/categories/upload', {
                          method: 'POST',
                          body: uploadFormData
                        });

                        const data = await response.json();
                        if (data.success) {
                          setFormData({ ...formData, banner_url: data.url });
                          showSuccess('Banner uploaded successfully');
                        } else {
                          showError(data.error || 'Upload failed');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        showError('Failed to upload banner');
                      }
                    }}
                    className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-white/10 file:text-white file:text-sm hover:file:bg-white/20"
                  />
                  {formData.banner_url && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={formData.banner_url}
                        onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                        className="flex-1 bg-black/30 border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-white/30"
                        placeholder="Or paste URL..."
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, banner_url: '' })}
                        className="px-3 py-2 bg-red-500/10 text-red-500 text-xs border border-red-500/20 hover:bg-red-500/20"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  {formData.banner_url && (
                    <img src={formData.banner_url} alt="Preview" className="w-full h-32 object-cover border border-white/10" />
                  )}
                </div>
              </div>
            </div>

            {/* SEO Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Meta Description
                </label>
                <input
                  type="text"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 text-white px-4 py-2.5 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white/70 text-sm">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white/70 text-sm">Featured</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <Save size={18} />
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-white/10 text-white hover:border-white/30 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-black border border-white/10 p-12 text-center">
            <div className="text-white/40">Loading categories...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-black border border-white/10 p-12 text-center">
            <div className="text-white/40 mb-4">No categories yet</div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-white text-black hover:bg-white/90 transition-all text-sm font-medium"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-black border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Category</th>
                    <th className="text-left text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Slug</th>
                    <th className="text-left text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Parent</th>
                    <th className="text-center text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Products</th>
                    <th className="text-center text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Order</th>
                    <th className="text-center text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Status</th>
                    <th className="text-right text-white/50 text-xs uppercase tracking-wider p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topLevelCategories.map((category) => (
                    <React.Fragment key={category.id}>
                      {/* Parent Category */}
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {category.image_url ? (
                              <img src={category.image_url} alt={category.name} className="w-10 h-10 object-cover bg-white/5" />
                            ) : (
                              <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                                <ImageIcon size={20} className="text-white/30" />
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium flex items-center gap-2">
                                {category.name}
                                {category.featured && (
                                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                              {category.description && (
                                <div className="text-white/40 text-xs mt-0.5 line-clamp-1">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white/60 text-sm font-mono">
                            {category.slug}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-white/40 text-sm">—</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-white/70 text-sm">
                            {category.product_count}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-white/70 text-sm">
                            {category.display_order}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleActive(category.id, category.is_active)}
                            className={`px-3 py-1 text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-red-500/20 text-red-500'
                            }`}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleFeatured(category.id, category.featured)}
                              className="p-2 hover:bg-white/5 transition-colors"
                              title={category.featured ? 'Unfeature' : 'Feature'}
                            >
                              <Star size={16} className={category.featured ? 'text-yellow-500 fill-yellow-500' : 'text-white/40'} />
                            </button>
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 hover:bg-white/5 transition-colors"
                            >
                              <Edit2 size={16} className="text-white/60" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-2 hover:bg-white/5 transition-colors"
                            >
                              <Trash2 size={16} className="text-red-500/60" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Child Categories */}
                      {getChildCategories(category.id).map((child) => (
                        <tr key={child.id} className="border-b border-white/5 hover:bg-white/5 bg-white/[0.02]">
                          <td className="p-4 pl-12">
                            <div className="flex items-center gap-3">
                              <ChevronRight size={16} className="text-white/30" />
                              {child.image_url ? (
                                <img src={child.image_url} alt={child.name} className="w-8 h-8 object-cover bg-white/5" />
                              ) : (
                                <div className="w-8 h-8 bg-white/5 flex items-center justify-center">
                                  <ImageIcon size={16} className="text-white/30" />
                                </div>
                              )}
                              <div>
                                <div className="text-white/80 text-sm flex items-center gap-2">
                                  {child.name}
                                  {child.featured && (
                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-white/50 text-sm font-mono">
                              {child.slug}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-white/60 text-sm">
                              {category.name}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-white/60 text-sm">
                              {child.product_count}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-white/60 text-sm">
                              {child.display_order}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleActive(child.id, child.is_active)}
                              className={`px-3 py-1 text-xs font-medium ${
                                child.is_active
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {child.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleFeatured(child.id, child.featured)}
                                className="p-2 hover:bg-white/5 transition-colors"
                                title={child.featured ? 'Unfeature' : 'Feature'}
                              >
                                <Star size={16} className={child.featured ? 'text-yellow-500 fill-yellow-500' : 'text-white/40'} />
                              </button>
                              <button
                                onClick={() => handleEdit(child)}
                                className="p-2 hover:bg-white/5 transition-colors"
                              >
                                <Edit2 size={16} className="text-white/60" />
                              </button>
                              <button
                                onClick={() => handleDelete(child.id)}
                                className="p-2 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 size={16} className="text-red-500/60" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {topLevelCategories.map((category) => (
                <div key={category.id}>
                  {/* Parent Category Card */}
                  <div className="bg-black border border-white/10 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-16 h-16 object-cover bg-white/5" />
                      ) : (
                        <div className="w-16 h-16 bg-white/5 flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={24} className="text-white/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium mb-1 flex items-center gap-2">
                          {category.name}
                          {category.featured && (
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="text-white/40 text-xs font-mono mb-2">
                          {category.slug}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/50">{category.product_count} products</span>
                          <span className="text-white/30">•</span>
                          <span className={category.is_active ? 'text-green-500' : 'text-red-500'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => toggleActive(category.id, category.is_active)}
                        className="flex-1 py-2 border border-white/10 text-white text-xs hover:bg-white/5 flex items-center justify-center gap-2"
                      >
                        {category.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        {category.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 py-2 border border-white/10 text-white text-xs hover:bg-white/5 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="py-2 px-4 border border-red-500/20 text-red-500 text-xs hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Child Categories */}
                  {getChildCategories(category.id).map((child) => (
                    <div key={child.id} className="bg-black border border-white/10 p-4 ml-6">
                      <div className="flex items-start gap-3 mb-3">
                        <ChevronRight size={16} className="text-white/30 mt-1 flex-shrink-0" />
                        {child.image_url ? (
                          <img src={child.image_url} alt={child.name} className="w-12 h-12 object-cover bg-white/5" />
                        ) : (
                          <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={20} className="text-white/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-white/90 text-sm font-medium mb-1 flex items-center gap-2">
                            {child.name}
                            {child.featured && (
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="text-white/40 text-xs font-mono mb-2">
                            {child.slug}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-white/50">{child.product_count} products</span>
                            <span className="text-white/30">•</span>
                            <span className={child.is_active ? 'text-green-500' : 'text-red-500'}>
                              {child.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => toggleActive(child.id, child.is_active)}
                          className="flex-1 py-2 border border-white/10 text-white text-xs hover:bg-white/5 flex items-center justify-center gap-2"
                        >
                          {child.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          {child.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(child)}
                          className="flex-1 py-2 border border-white/10 text-white text-xs hover:bg-white/5 flex items-center justify-center gap-2"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(child.id)}
                          className="py-2 px-4 border border-red-500/20 text-red-500 text-xs hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

