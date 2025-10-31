"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Search, Package, Eye, DollarSign, Trash2, Grid3x3, Layers, Sparkles,
  FolderTree, ImageIcon, Edit2, Check, X, Upload, Tag, Copy, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { ProductQuickView } from '@/components/vendor/ProductQuickView';
import { PricingBlueprintModal } from '@/components/vendor/PricingBlueprintModal';
import axios from 'axios';

// Supabase image transformation helper - uses render API for proper thumbnails
const getSupabaseImageUrl = (url: string | null | undefined, width: number = 400, height: number = 400): string => {
  if (!url) return '';

  // If it's already a full URL, check if it's from Supabase
  if (url.startsWith('http')) {
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      // Extract the bucket and path from the URL
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+?)(\?|$)/);
      if (match) {
        const bucket = match[1];
        const path = match[2];
        const supabaseUrl = url.split('/storage/v1/object')[0];
        // Use the render endpoint with transformation
        return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?width=${width}&height=${height}&resize=cover&quality=80`;
      }
    }
    return url;
  }

  // If it's a relative path like "vendor-product-images/abc123.jpg"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) return url;

  // Parse bucket and path
  const parts = url.split('/');
  if (parts.length >= 2) {
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?width=${width}&height=${height}&resize=cover&quality=80`;
  }

  // Fallback to object URL
  return `${supabaseUrl}/storage/v1/object/public/${url}`;
};

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  description?: string;
  status: 'approved' | 'pending' | 'rejected';
  total_stock: number;
  custom_fields: any[];
  pricing_tiers: any[];
  images: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  vendor_id?: string;
  parent_id?: string;
  display_order?: number;
}

interface FieldGroup {
  id: string;
  vendor_id: string | null;
  name: string;
  slug: string;
  description?: string;
  fields: any[];
  is_active: boolean;
  category_id?: string; // For admin field groups assigned to categories
  category_name?: string; // For display purposes
}

interface PricingBlueprint {
  id: string;
  vendor_id: string | null;
  name: string;
  description?: string;
  context: string;
  tier_type: string;
  quality_tier?: string;
  price_breaks: any[];
  applicable_to_categories?: string[];
  is_active: boolean;
}

interface BusinessTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  industry_type?: string;
  icon?: string;
  image_url?: string;
  is_active: boolean;
}

type TabType = 'catalog' | 'categories' | 'pricing';

export default function ProductsClient() {
  const { isAuthenticated, vendor } = useAppAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('catalog');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);

  // Pricing state
  const [pricingBlueprints, setPricingBlueprints] = useState<PricingBlueprint[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [templates, setTemplates] = useState<BusinessTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Check if vendor needs onboarding (no products, no categories)
  useEffect(() => {
    if (isAuthenticated && vendor && products.length === 0 && categories.length === 0 && !loading) {
      setShowOnboarding(true);
      loadTemplates();
    }
  }, [isAuthenticated, vendor, products, categories, loading]);

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await axios.get('/api/business-templates');
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Import template
  const handleImportTemplate = async (templateId: string) => {
    try {
      const response = await axios.post('/api/business-templates/import', {
        template_id: templateId,
        import_categories: true,
        import_field_groups: true
      }, {
        headers: { 'x-vendor-id': vendor?.id }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Template Imported',
          message: `${response.data.categories_created} categories and ${response.data.field_groups_created} field groups added`
        });
        setShowOnboarding(false);
        loadCategories();
        loadFieldGroups();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Import Failed',
        message: error.response?.data?.error || 'Failed to import template'
      });
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const vendorId = vendor?.id;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await axios.get('/api/vendor/products/full', {
        headers: { 'x-vendor-id': vendorId },
        timeout: 30000
      });

      if (response.data.success) {
        const prods = response.data.products || [];
        console.log('📦 Loaded products:', prods.length);
        console.log('🏷️ Sample categories:', prods.slice(0, 5).map(p => ({ name: p.name, category: p.category })));
        setProducts(prods);
      }
    } catch (error: any) {
      console.error('Products load error:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load products'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get(`/api/categories?vendor_id=${vendor?.id}`);
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load field groups
  const loadFieldGroups = async () => {
    if (!vendor?.id) return;

    try {
      const response = await axios.get(`/api/vendor/product-fields`, {
        headers: { 'x-vendor-id': vendor.id }
      });
      if (response.data.success) {
        // Map vendor fields to field groups (one per field)
        const fieldGroups = (response.data.fields || []).map((field: any) => ({
          id: field.id,
          vendor_id: vendor.id,
          name: field.label || field.definition?.label || 'Unnamed',
          slug: field.fieldId || field.slug,
          description: field.description || field.definition?.description,
          fields: [field],
          is_active: true,
          category_id: field.categoryId
        }));

        setFieldGroups(fieldGroups);
      }
    } catch (error) {
      console.error('Error loading field groups:', error);
      // Don't block the page from loading - just set empty array
      setFieldGroups([]);
    }
  };

  // Load pricing blueprints
  const loadPricingBlueprints = async () => {
    try {
      setLoadingPricing(true);
      const response = await axios.get('/api/vendor/pricing-blueprints', {
        headers: { 'x-vendor-id': vendor?.id }
      });
      if (response.data.success) {
        setPricingBlueprints(response.data.blueprints || []);
      }
    } catch (error) {
      console.error('Error loading pricing blueprints:', error);
    } finally {
      setLoadingPricing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && vendor) {
      loadProducts();
      loadCategories();
      loadFieldGroups();
      loadPricingBlueprints();
    }
  }, [isAuthenticated, vendor]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let items = [...products];

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.sku && p.sku.toLowerCase().includes(s))
      );
    }

    if (statusFilter !== 'all') {
      items = items.filter(p => p.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      console.log('🔍 Filtering by category:', categoryFilter);
      console.log('📦 Sample product categories:', items.slice(0, 3).map(p => ({ name: p.name, category: p.category })));
      items = items.filter(p => {
        const matches = p.category === categoryFilter;
        if (!matches && items.length < 20) {
          console.log(`❌ Product "${p.name}" category "${p.category}" doesn't match filter "${categoryFilter}"`);
        }
        return matches;
      });
      console.log('✅ Filtered to', items.length, 'products');
    }

    return items;
  }, [products, search, statusFilter, categoryFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Get unique categories from products
  const productCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    const result = ['all', ...Array.from(cats)];
    console.log('🏷️ Available categories:', result);
    return result;
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter(p => p.status === 'approved').length;
    const pending = products.filter(p => p.status === 'pending').length;
    const rejected = products.filter(p => p.status === 'rejected').length;

    return { total, approved, pending, rejected };
  }, [products]);

  // Delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    await showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/vendor/products?product_id=${productId}`, {
            headers: { 'x-vendor-id': vendor?.id }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Deleted',
              message: 'Product deleted successfully'
            });
            loadProducts();
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete product'
          });
        }
      }
    });
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    await showConfirm({
      title: 'Delete Category',
      message: `Delete "${categoryName}"? Products will not be deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/categories?id=${categoryId}`, {
            headers: { 'x-vendor-id': vendor?.id }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Deleted',
              message: 'Category deleted successfully'
            });
            loadCategories();
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete category'
          });
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Please sign in to manage products</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <Sparkles size={48} className="mx-auto mb-4 text-blue-400" />
              <h2 className="text-white text-2xl font-black mb-2" style={{ fontWeight: 900 }}>
                Welcome! What do you sell?
              </h2>
              <p className="text-white/60 text-sm">
                Choose a template to set up your catalog instantly, or start from scratch
              </p>
            </div>

            {loadingTemplates ? (
              <div className="text-center py-12">
                <div className="text-white/60">Loading templates...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleImportTemplate(template.id)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl p-6 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{template.icon || '📦'}</span>
                      <div>
                        <h3 className="text-white font-black text-base" style={{ fontWeight: 900 }}>
                          {template.name}
                        </h3>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">
                          {template.industry_type}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">
                      {template.description}
                    </p>
                  </button>
                ))}

                {/* Start from scratch option */}
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl p-6 text-left transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">✨</span>
                    <div>
                      <h3 className="text-white font-black text-base" style={{ fontWeight: 900 }}>
                        Start from Scratch
                      </h3>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">
                        Custom Setup
                      </p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm">
                    Build your own categories and pricing from the ground up
                  </p>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowOnboarding(false)}
              className="w-full py-3 text-white/60 hover:text-white text-sm transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
            Products
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">
            Manage your catalog, categories, and pricing
          </p>
        </div>

        {activeTab === 'catalog' && (
          <Link
            href="/vendor/products/new"
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all inline-flex items-center gap-2"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add Product
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
            activeTab === 'catalog'
              ? 'text-white border-b-2 border-white'
              : 'text-white/40 hover:text-white/60'
          }`}
          style={{ fontWeight: 900 }}
        >
          <div className="flex items-center gap-2">
            <Package size={14} />
            Catalog
            <span className="px-2 py-0.5 bg-white/10 rounded text-[8px]">
              {stats.total}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
            activeTab === 'categories'
              ? 'text-white border-b-2 border-white'
              : 'text-white/40 hover:text-white/60'
          }`}
          style={{ fontWeight: 900 }}
        >
          <div className="flex items-center gap-2">
            <FolderTree size={14} />
            Categories
            <span className="px-2 py-0.5 bg-white/10 rounded text-[8px]">
              {categories.length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
            activeTab === 'pricing'
              ? 'text-white border-b-2 border-white'
              : 'text-white/40 hover:text-white/60'
          }`}
          style={{ fontWeight: 900 }}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={14} />
            Pricing Rules
            <span className="px-2 py-0.5 bg-white/10 rounded text-[8px]">
              {pricingBlueprints.filter(b => b.vendor_id === vendor?.id).length}
            </span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'catalog' && (
        <CatalogTab
          products={paginatedProducts}
          loading={loading}
          stats={stats}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          productCategories={productCategories}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          setQuickViewProduct={setQuickViewProduct}
          handleDeleteProduct={handleDeleteProduct}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesTab
          categories={categories}
          fieldGroups={fieldGroups}
          loading={loadingCategories}
          expandedCategory={expandedCategory}
          setExpandedCategory={setExpandedCategory}
          handleDeleteCategory={handleDeleteCategory}
          loadCategories={loadCategories}
          loadFieldGroups={loadFieldGroups}
          vendorId={vendor?.id || ''}
        />
      )}

      {activeTab === 'pricing' && (
        <PricingTab
          blueprints={pricingBlueprints}
          loading={loadingPricing}
          vendorId={vendor?.id || ''}
          loadPricingBlueprints={loadPricingBlueprints}
          categories={categories}
          products={products}
        />
      )}

      {/* Quick View Modal */}
      {quickViewProduct && vendor?.id && (
        <ProductQuickView
          product={quickViewProduct}
          vendorId={vendor.id}
          isOpen={true}
          onClose={() => setQuickViewProduct(null)}
          onSave={loadProducts}
          onDelete={loadProducts}
        />
      )}
    </div>
  );
}

// ============================================================================
// CATALOG TAB
// ============================================================================

interface CatalogTabProps {
  products: Product[];
  loading: boolean;
  stats: any;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (f: any) => void;
  categoryFilter: string;
  setCategoryFilter: (f: string) => void;
  productCategories: string[];
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  setQuickViewProduct: (p: Product | null) => void;
  handleDeleteProduct: (id: string, name: string) => void;
}

function CatalogTab({
  products,
  loading,
  stats,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  productCategories,
  page,
  setPage,
  totalPages,
  setQuickViewProduct,
  handleDeleteProduct
}: CatalogTabProps) {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2">Total</div>
          <div className="text-white text-2xl font-black" style={{ fontWeight: 900 }}>{stats.total}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2">Active</div>
          <div className="text-white text-2xl font-black" style={{ fontWeight: 900 }}>{stats.approved}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2">Pending</div>
          <div className="text-white text-2xl font-black" style={{ fontWeight: 900 }}>{stats.pending}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2">Rejected</div>
          <div className="text-white text-2xl font-black" style={{ fontWeight: 900 }}>{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-white/5 rounded-xl text-white placeholder:text-white/30 text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#0a0a0a] border border-white/5 rounded-xl text-white text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/10"
        >
          <option value="all">All Status</option>
          <option value="approved">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-[#0a0a0a] border border-white/5 rounded-xl text-white text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/10"
        >
          {productCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/40 text-[10px] uppercase tracking-wider">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <Package size={48} className="mx-auto mb-4 text-white/20" />
          <div className="text-white text-xs uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>No products found</div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider mb-6">Start adding products to your catalog</div>
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
                      <Image
                        src={getSupabaseImageUrl(product.images[0], 112, 112)}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5">
                      <Package size={20} className="text-white/20" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-xs uppercase tracking-tight truncate font-black" style={{ fontWeight: 900 }}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-white/40 text-[9px] uppercase tracking-[0.15em]">{product.sku}</span>
                      <span className="text-white/20 text-[9px]">•</span>
                      <span className="text-white/40 text-[9px] uppercase tracking-[0.15em]">{product.category}</span>
                      {product.status === 'approved' && (
                        <>
                          <span className="text-white/20 text-[9px]">•</span>
                          <span className="text-green-400/80 text-[8px] uppercase tracking-wider px-2 py-0.5 bg-green-500/10 rounded">Active</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white text-lg font-black" style={{ fontWeight: 900 }}>${product.price.toFixed(2)}</div>
                    <div className="text-white/30 text-[9px] uppercase tracking-wider mt-0.5">
                      Stock: {product.total_stock}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Quick View"
                    >
                      <Eye size={14} className="text-white/60" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-[#0a0a0a] border border-white/5 rounded-xl text-white text-[10px] uppercase tracking-[0.15em] font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-white/10 transition-all"
                style={{ fontWeight: 900 }}
              >
                Previous
              </button>
              <div className="px-4 py-2 text-white/40 text-[10px] uppercase tracking-wider">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#0a0a0a] border border-white/5 rounded-xl text-white text-[10px] uppercase tracking-[0.15em] font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 hover:border-white/10 transition-all"
                style={{ fontWeight: 900 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// CATEGORIES TAB
// ============================================================================

interface CategoriesTabProps {
  categories: Category[];
  fieldGroups: FieldGroup[];
  loading: boolean;
  expandedCategory: string | null;
  setExpandedCategory: (id: string | null) => void;
  handleDeleteCategory: (id: string, name: string) => void;
  loadCategories: () => void;
  loadFieldGroups: () => void;
  vendorId: string;
}

function CategoriesTab({
  categories,
  fieldGroups,
  loading,
  expandedCategory,
  setExpandedCategory,
  handleDeleteCategory,
  loadCategories,
  loadFieldGroups,
  vendorId
}: CategoriesTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    description: '',
    imageFile: null as File | null
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Field configuration state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldCategory, setFieldCategory] = useState<Category | null>(null);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Field builder state
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [fieldFormData, setFieldFormData] = useState({
    label: '',
    fieldId: '',
    type: 'text' as 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date',
    required: false,
    description: '',
    placeholder: '',
    defaultValue: '',
    options: [] as string[],
    validation: {
      min: '',
      max: '',
      pattern: ''
    }
  });
  const [savingField, setSavingField] = useState(false);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: '', description: '', imageFile: null });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      imageFile: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', icon: '', description: '', imageFile: null });
  };

  const openFieldModal = async (category: Category) => {
    setFieldCategory(category);
    setShowFieldModal(true);
    await loadCategoryFields(category.id);
  };

  const closeFieldModal = () => {
    setShowFieldModal(false);
    setFieldCategory(null);
    setCategoryFields([]);
  };

  const loadCategoryFields = async (categoryId: string) => {
    try {
      setLoadingFields(true);
      const response = await axios.get(`/api/vendor/product-fields?category_id=${categoryId}`, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        // Use new simplified fields response
        setCategoryFields(response.data.fields || []);
      }
    } catch (error) {
      console.error('Error loading category fields:', error);
      setCategoryFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const openFieldBuilder = (field?: any) => {
    if (field) {
      setEditingField(field);
      setFieldFormData({
        label: field.definition?.label || '',
        fieldId: field.fieldId || '',
        type: field.definition?.type || 'text',
        required: field.definition?.required || false,
        description: field.definition?.description || '',
        placeholder: field.definition?.placeholder || '',
        defaultValue: field.definition?.defaultValue || '',
        options: field.definition?.options || [],
        validation: {
          min: field.definition?.validation?.min || '',
          max: field.definition?.validation?.max || '',
          pattern: field.definition?.validation?.pattern || ''
        }
      });
    } else {
      setEditingField(null);
      setFieldFormData({
        label: '',
        fieldId: '',
        type: 'text',
        required: false,
        description: '',
        placeholder: '',
        defaultValue: '',
        options: [],
        validation: { min: '', max: '', pattern: '' }
      });
    }
    setShowFieldBuilder(true);
  };

  const closeFieldBuilder = () => {
    setShowFieldBuilder(false);
    setEditingField(null);
    setFieldFormData({
      label: '',
      fieldId: '',
      type: 'text',
      required: false,
      description: '',
      placeholder: '',
      defaultValue: '',
      options: [],
      validation: { min: '', max: '', pattern: '' }
    });
  };

  const handleSaveField = async () => {
    if (!fieldFormData.label.trim()) {
      showNotification({
        type: 'error',
        title: 'Label Required',
        message: 'Please enter a field label'
      });
      return;
    }

    if (!fieldCategory) return;

    try {
      setSavingField(true);

      // Generate field ID from label if not editing
      const fieldId = editingField?.fieldId || fieldFormData.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      // Build validation object (only include non-empty values)
      const validation: any = {};
      if (fieldFormData.validation.min) validation.min = parseFloat(fieldFormData.validation.min);
      if (fieldFormData.validation.max) validation.max = parseFloat(fieldFormData.validation.max);
      if (fieldFormData.validation.pattern) validation.pattern = fieldFormData.validation.pattern;

      const fieldDefinition: any = {
        type: fieldFormData.type,
        label: fieldFormData.label,
        required: fieldFormData.required,
        description: fieldFormData.description || undefined,
        placeholder: fieldFormData.placeholder || undefined,
        defaultValue: fieldFormData.defaultValue || undefined
      };

      if (Object.keys(validation).length > 0) {
        fieldDefinition.validation = validation;
      }

      if (fieldFormData.type === 'select' && fieldFormData.options.length > 0) {
        fieldDefinition.options = fieldFormData.options;
      }

      const response = await axios.post('/api/vendor/product-fields', {
        fieldId,
        categoryId: fieldCategory.id,
        fieldDefinition
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: editingField ? 'Field Updated' : 'Field Created',
          message: `${fieldFormData.label} has been ${editingField ? 'updated' : 'created'} successfully`
        });
        closeFieldBuilder();
        await loadCategoryFields(fieldCategory.id);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save field'
      });
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!fieldCategory) return;

    const confirmed = await showConfirm({
      title: 'Delete Field',
      message: 'Are you sure you want to delete this field? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const response = await axios.delete(`/api/vendor/product-fields?field_id=${fieldId}&category_id=${fieldCategory.id}`, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Field Deleted',
          message: 'Field has been deleted successfully'
        });
        await loadCategoryFields(fieldCategory.id);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.response?.data?.error || 'Failed to delete field'
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'category-icons');

      const response = await axios.post('/api/supabase/vendor/upload', formData, {
        headers: {
          'x-vendor-id': vendorId,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return response.data.url;
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload category image'
      });
    } finally {
      setUploading(false);
    }
    return null;
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Name Required',
        message: 'Please enter a category name'
      });
      return;
    }

    try {
      setSaving(true);

      let imageUrl = editingCategory?.image_url || null;
      if (formData.imageFile) {
        imageUrl = await handleImageUpload(formData.imageFile);
      }

      const payload = {
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        icon: formData.icon,
        description: formData.description || null,
        image_url: imageUrl
      };

      if (editingCategory) {
        const response = await axios.put(`/api/categories?id=${editingCategory.id}`, payload, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'Updated',
            message: 'Category updated successfully'
          });
          closeModal();
          loadCategories();
        }
      } else {
        const response = await axios.post('/api/categories', payload, {
          headers: { 'x-vendor-id': vendorId }
        });

        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'Created',
            message: 'Category created successfully'
          });
          closeModal();
          loadCategories();
        }
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: editingCategory ? 'Update Failed' : 'Create Failed',
        message: error.response?.data?.error || `Failed to ${editingCategory ? 'update' : 'create'} category`
      });
    } finally {
      setSaving(false);
    }
  };

  // Only show vendor-owned categories (no global categories exist anymore)
  const vendorCategories = categories.filter(c => c.vendor_id === vendorId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1 font-black" style={{ fontWeight: 900 }}>
            Your Categories
          </h3>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">
            Organize your products and configure custom fields
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all flex items-center gap-2 border border-white/20"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} />
            NEW CATEGORY
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/40 text-[10px] uppercase tracking-wider">Loading categories...</div>
        </div>
      ) : vendorCategories.length === 0 ? (
        <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <FolderTree size={40} className="text-white/40" />
          </div>
          <h4 className="text-white text-xs uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            No Categories Yet
          </h4>
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-6 max-w-md mx-auto">
            Create categories to organize your products and add custom fields like THC%, strain type, etc.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all inline-flex items-center gap-2 border border-white/20"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} />
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vendorCategories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const categoryFields = fieldGroups.filter(fg => fg.category_id === category.id);

            return (
              <div
                key={category.id}
                className="bg-white/[0.02] border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {category.image_url ? (
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                          <Image
                            src={getSupabaseImageUrl(category.image_url, 80, 80)}
                            alt={category.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                          <Package size={20} className="text-white/40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-xs uppercase tracking-tight font-black" style={{ fontWeight: 900 }}>
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-white/40 text-[9px] uppercase tracking-[0.15em]">
                        <span>{categoryFields.length} field{categoryFields.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} className="text-white/60" />
                      </button>
                      <button
                        onClick={() => openFieldModal(category)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Configure Fields"
                      >
                        <Layers size={14} className="text-white/60" />
                      </button>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronDown size={14} className="text-white/60" /> : <ChevronRight size={14} className="text-white/60" />}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Field Groups Section */}
                {isExpanded && (
                  <div className="border-t border-white/[0.08] bg-black/40 backdrop-blur-sm">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white/80 text-sm font-bold tracking-wide flex items-center gap-2">
                          <Layers size={14} className="text-white/60" />
                          CUSTOM FIELDS
                        </h4>
                        <button
                          onClick={() => openFieldModal(category)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-medium transition-all flex items-center gap-1.5"
                        >
                          <Plus size={12} />
                          Configure
                        </button>
                      </div>

                      {(() => {
                        // Filter field groups for this specific category
                        const categoryFieldGroups = fieldGroups.filter(fg =>
                          fg.category_id === category.id ||
                          (!fg.category_id && fg.vendor_id === vendorId) // Include vendor custom fields with no category
                        );

                        return categoryFieldGroups.length === 0 ? (
                          <div className="text-center py-8 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                            <Layers size={32} className="mx-auto mb-3 text-white/20" />
                            <p className="text-white/40 text-sm mb-2">No custom fields configured</p>
                            <button
                              onClick={() => openFieldModal(category)}
                              className="text-white/60 hover:text-white text-xs font-medium"
                            >
                              Set up custom fields →
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {categoryFieldGroups.map((fg) => (
                              <div
                                key={fg.id}
                                className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 hover:border-white/20 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-white font-medium text-sm mb-1">{fg.name}</div>
                                    <div className="text-white/40 text-xs">
                                      {fg.fields.length} {fg.fields.length === 1 ? 'field' : 'fields'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => openFieldModal(category)}
                                    className="text-white/60 hover:text-white text-xs font-medium"
                                  >
                                    View →
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
              <FolderTree size={20} className="text-white/40" />
              <div>
                <h2 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">
                  {editingCategory ? 'Update category details' : 'Add a new product category'}
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
              {/* Name */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.G., FLOWER, EDIBLES, CONCENTRATES"
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📦"
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white text-center text-2xl focus:outline-none focus:border-white/10 transition-colors"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                    Category Image
                  </label>
                  <label className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white/40 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2 h-[52px] text-[10px] uppercase tracking-wider">
                    <Upload size={14} />
                    {formData.imageFile ? formData.imageFile.name : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, imageFile: file });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {(formData.imageFile || editingCategory?.image_url) && (
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  {formData.imageFile ? (
                    <>
                      <ImageIcon size={20} className="text-green-400" />
                      <span className="text-white/80 text-sm flex-1">{formData.imageFile.name}</span>
                      <button
                        onClick={() => setFormData({ ...formData, imageFile: null })}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : editingCategory?.image_url ? (
                    <>
                      <div className="w-10 h-10 relative rounded overflow-hidden bg-white/5">
                        <Image
                          src={getSupabaseImageUrl(editingCategory.image_url, 80, 80)}
                          alt="Current"
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white/80 text-sm">Current image</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-white/5">
              <button
                onClick={closeModal}
                disabled={saving || uploading}
                className="flex-1 px-6 py-3 bg-black/20 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-colors disabled:opacity-30"
                style={{ fontWeight: 900 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={saving || uploading || !formData.name.trim()}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
                style={{ fontWeight: 900 }}
              >
                {saving || uploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Configuration Modal */}
      {showFieldModal && fieldCategory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[75vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-black">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
                    Configure Fields
                  </h2>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">
                    {fieldCategory.name}
                  </div>
                </div>
                <button
                  onClick={closeFieldModal}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={16} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6"  style={{ minHeight: 0 }}>

            {loadingFields ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Loading fields...</p>
              </div>
            ) : (
              <>
                {/* Existing Fields */}
                {categoryFields.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-[0.15em] mb-4" style={{ fontWeight: 900 }}>
                      Configured Fields ({categoryFields.length})
                    </h3>
                    <div className="space-y-3">
                      {categoryFields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-black text-xs uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                                    {field.definition?.label || field.fieldId}
                                  </h4>
                                  {field.source === 'admin' && (
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 text-[9px] font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                                      ADMIN · {field.definition?.fields?.length || 0} FIELDS
                                    </span>
                                  )}
                                </div>
                                {field.definition?.description && (
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">{field.definition.description}</p>
                                )}
                              </div>
                              {field.source !== 'admin' && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => openFieldBuilder(field)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                                    title="Edit field"
                                  >
                                    <Edit2 size={12} className="text-white/60" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteField(field.fieldId)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                                    title="Delete field"
                                  >
                                    <Trash2 size={12} className="text-white/60" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Show individual fields for admin field groups */}
                            {field.source === 'admin' && field.definition?.fields && field.definition.fields.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                {field.definition.fields.map((f: any, idx: number) => (
                                  <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-2.5">
                                    <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ fontWeight: 900 }}>
                                      {f.name || f.slug || 'Unnamed'}
                                    </div>
                                    <div className="text-white/40 text-[9px] uppercase tracking-wider">
                                      {f.type}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Field Button */}
                <button
                  onClick={() => openFieldBuilder()}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} className="text-white/60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                    Add Custom Field
                  </span>
                </button>

                {categoryFields.length === 0 && (
                  <div className="text-center py-12 mt-6 bg-white/[0.02] rounded-xl border border-white/5">
                    <Layers size={32} className="mx-auto mb-3 text-white/10" />
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">No fields configured yet</p>
                    <p className="text-white/30 text-[9px] uppercase tracking-wider">
                      Add custom fields for {fieldCategory.name} products
                    </p>
                  </div>
                )}
              </>
            )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-black">
              <button
                onClick={closeFieldModal}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-colors"
                style={{ fontWeight: 900 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Builder Modal */}
      {showFieldBuilder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5">
                  <Layers size={18} className="text-white/40" />
                </div>
                <div>
                  <h2 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
                    {editingField ? 'Edit Field' : 'Create New Field'}
                  </h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">
                    Configure custom field for {fieldCategory?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeFieldBuilder}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Field Label */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={fieldFormData.label}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                  placeholder="E.G., THC PERCENTAGE, STRAIN TYPE"
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                  Field Type *
                </label>
                <select
                  value={fieldFormData.type}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-white/10 transition-colors"
                >
                  <option value="text">Text (Single Line)</option>
                  <option value="textarea">Text Area (Multi-line)</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select</option>
                  <option value="checkbox">Checkbox (Yes/No)</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Placeholder */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={fieldFormData.placeholder}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                    placeholder="ENTER VALUE..."
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                  />
                </div>

                {/* Default Value */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                    Default Value
                  </label>
                  <input
                    type="text"
                    value={fieldFormData.defaultValue}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                    placeholder="OPTIONAL"
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={fieldFormData.description}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, description: e.target.value })}
                  placeholder="Help text that appears below the field..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors resize-none"
                />
              </div>

              {/* Validation (for number fields) */}
              {fieldFormData.type === 'number' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-xl">
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                      Min Value
                    </label>
                    <input
                      type="number"
                      value={fieldFormData.validation.min}
                      onChange={(e) => setFieldFormData({
                        ...fieldFormData,
                        validation: { ...fieldFormData.validation, min: e.target.value }
                      })}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                      Max Value
                    </label>
                    <input
                      type="number"
                      value={fieldFormData.validation.max}
                      onChange={(e) => setFieldFormData({
                        ...fieldFormData,
                        validation: { ...fieldFormData.validation, max: e.target.value }
                      })}
                      placeholder="100"
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Options (for select fields) */}
              {fieldFormData.type === 'select' && (
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl">
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-2">
                    Dropdown Options
                  </label>
                  <textarea
                    value={fieldFormData.options.join('\n')}
                    onChange={(e) => setFieldFormData({
                      ...fieldFormData,
                      options: e.target.value.split('\n').filter(o => o.trim())
                    })}
                    placeholder="Enter each option on a new line:&#10;Indica&#10;Sativa&#10;Hybrid"
                    rows={4}
                    className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition-colors resize-none font-mono text-sm"
                  />
                  <p className="text-white/30 text-[9px] uppercase tracking-wider mt-2">
                    {fieldFormData.options.length} option{fieldFormData.options.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center gap-3 p-4 bg-black/20 border border-white/5 rounded-xl">
                <input
                  type="checkbox"
                  id="required-field"
                  checked={fieldFormData.required}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, required: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-white/10 bg-black/20 checked:bg-white/20 checked:border-white/20 focus:outline-none"
                />
                <label htmlFor="required-field" className="flex-1 cursor-pointer">
                  <div className="text-white text-xs uppercase tracking-tight font-black" style={{ fontWeight: 900 }}>Required Field</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">Users must fill this field when creating products</div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-white/5">
              <button
                onClick={closeFieldBuilder}
                disabled={savingField}
                className="flex-1 px-6 py-3 bg-black/20 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-colors disabled:opacity-30"
                style={{ fontWeight: 900 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                disabled={savingField || !fieldFormData.label.trim()}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
                style={{ fontWeight: 900 }}
              >
                {savingField ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    {editingField ? 'Update Field' : 'Create Field'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRICING TAB
// ============================================================================

interface PricingTabProps {
  blueprints: PricingBlueprint[];
  loading: boolean;
  vendorId: string;
  loadPricingBlueprints: () => void;
  categories: Category[];
  products: Product[];
}

function PricingTab({
  blueprints,
  loading,
  vendorId,
  loadPricingBlueprints,
  categories,
  products
}: PricingTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<PricingBlueprint | null>(null);

  const openCreateModal = () => {
    setSelectedBlueprint(null);
    setIsModalOpen(true);
  };

  const openEditModal = (blueprint: PricingBlueprint) => {
    setSelectedBlueprint(blueprint);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBlueprint(null);
  };

  const handleSave = () => {
    loadPricingBlueprints();
  };

  const handleDelete = async (blueprint: PricingBlueprint) => {
    const confirmed = await showConfirm({
      title: 'Delete Pricing Rule',
      message: `Are you sure you want to delete "${blueprint.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/vendor/pricing-blueprints?id=${blueprint.id}`, {
        method: 'DELETE',
        headers: {
          'x-vendor-id': vendorId
        }
      });

      const data = await response.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Rule Deleted',
          message: 'Pricing rule has been deleted successfully'
        });
        loadPricingBlueprints();
      } else {
        throw new Error(data.error || 'Failed to delete pricing rule');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete pricing rule'
      });
    }
  };

  const customBlueprints = blueprints.filter(b => b.vendor_id === vendorId);

  // Context info for grouping
  const contextInfo: Record<string, { label: string; description: string; order: number }> = {
    retail: {
      label: 'Retail',
      description: 'Direct-to-consumer pricing',
      order: 1
    },
    wholesale: {
      label: 'Wholesale',
      description: 'Bulk pricing for businesses',
      order: 2
    },
    distributor: {
      label: 'Distributor',
      description: 'Large volume pricing',
      order: 3
    },
    delivery: {
      label: 'Delivery',
      description: 'Delivery service pricing',
      order: 4
    }
  };

  const qualityTierInfo: Record<string, { label: string; order: number }> = {
    exotic: { label: 'Exotic', order: 1 },
    'top-shelf': { label: 'Top Shelf', order: 2 },
    'mid-shelf': { label: 'Mid Shelf', order: 3 },
    value: { label: 'Value', order: 4 }
  };

  const tierTypeInfo: Record<string, string> = {
    weight: 'Weight',
    quantity: 'Quantity',
    percentage: 'Percentage',
    flat: 'Flat',
    custom: 'Custom'
  };

  // Create a category lookup map
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  // Helper to extract quality tier from blueprint
  const extractQualityTier = (blueprint: PricingBlueprint): string | null => {
    // First check the quality_tier field
    if (blueprint.quality_tier) return blueprint.quality_tier;

    // Fallback to name parsing for legacy blueprints
    const name = blueprint.name.toLowerCase();
    if (name.includes('exotic')) return 'exotic';
    if (name.includes('top shelf') || name.includes('top-shelf')) return 'top-shelf';
    if (name.includes('mid shelf') || name.includes('mid-shelf')) return 'mid-shelf';
    if (name.includes('value')) return 'value';
    return null;
  };

  // Group blueprints by context, then by category
  // A blueprint can appear under multiple categories if assigned to multiple
  const groupedBlueprints = customBlueprints.reduce((acc, blueprint) => {
    const context = blueprint.context || 'other';

    if (!acc[context]) acc[context] = {};

    // Check if blueprint has category assignments
    if (blueprint.applicable_to_categories && blueprint.applicable_to_categories.length > 0) {
      // Add to each assigned category
      for (const categoryId of blueprint.applicable_to_categories) {
        const categoryName = categoryMap.get(categoryId) || 'Unknown Category';
        if (!acc[context][categoryName]) acc[context][categoryName] = [];
        acc[context][categoryName].push(blueprint);
      }
    } else {
      // No categories assigned - show under "All Categories"
      const categoryName = 'All Categories';
      if (!acc[context][categoryName]) acc[context][categoryName] = [];
      acc[context][categoryName].push(blueprint);
    }

    return acc;
  }, {} as Record<string, Record<string, PricingBlueprint[]>>);

  // Sort blueprints within each category by quality tier
  Object.keys(groupedBlueprints).forEach(context => {
    Object.keys(groupedBlueprints[context]).forEach(category => {
      groupedBlueprints[context][category].sort((a, b) => {
        const tierA = extractQualityTier(a);
        const tierB = extractQualityTier(b);
        if (!tierA && !tierB) return 0;
        if (!tierA) return 1;
        if (!tierB) return -1;
        const orderA = qualityTierInfo[tierA]?.order || 999;
        const orderB = qualityTierInfo[tierB]?.order || 999;
        return orderA - orderB;
      });
    });
  });

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-white/5">
        <p className="text-white/40 text-[10px] mb-4 uppercase tracking-wider">
          Create pricing structures and apply them to products
        </p>
        <button
          onClick={openCreateModal}
          className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all inline-flex items-center gap-2"
          style={{ fontWeight: 900 }}
        >
          <Plus size={12} strokeWidth={2.5} />
          Create Rule
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">Loading...</div>
        </div>
      ) : customBlueprints.length === 0 ? (
        <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <DollarSign size={32} className="mx-auto mb-4 text-white/10" strokeWidth={1.5} />
          <div className="text-white/60 text-[10px] uppercase tracking-[0.15em] mb-2">No Rules</div>
          <p className="text-white/40 text-[10px] mb-6">
            Create pricing structures for your products
          </p>
          <button
            onClick={openCreateModal}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all inline-flex items-center gap-2"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBlueprints)
            .sort(([a], [b]) => {
              const infoA = contextInfo[a];
              const infoB = contextInfo[b];
              return (infoA?.order || 999) - (infoB?.order || 999);
            })
            .map(([context, categoryGroups]) => {
              const info = contextInfo[context] || {
                label: context,
                description: 'Pricing rules',
                order: 999
              };

              const totalRules = Object.values(categoryGroups).reduce((sum, rules) => sum + rules.length, 0);

              return (
                <div key={context}>
                  {/* Context Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
                        {info.label}
                      </h3>
                      <p className="text-white/40 text-[9px] mt-0.5 uppercase tracking-wider">
                        {info.description}
                      </p>
                    </div>
                    <span className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                      {totalRules} {totalRules === 1 ? 'rule' : 'rules'}
                    </span>
                  </div>

                  {/* Categories */}
                  <div className="space-y-6">
                    {Object.entries(categoryGroups)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([category, categoryBlueprints]) => (
                        <div key={category}>
                          {/* Category Subheader */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[9px] uppercase tracking-[0.15em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                              {category}
                            </h4>
                            <span className="text-white/30 text-[8px] uppercase tracking-[0.15em]">
                              {categoryBlueprints.length}
                            </span>
                          </div>

                          {/* Blueprints Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryBlueprints.map((blueprint) => {
                              const tierType = tierTypeInfo[blueprint.tier_type] || blueprint.tier_type;
                              const qualityTier = extractQualityTier(blueprint);
                              const qualityInfo = qualityTier ? qualityTierInfo[qualityTier] : null;

                              return (
                                <div
                                  key={blueprint.id}
                                  className="bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h5 className="text-white font-black text-xs uppercase tracking-tight" style={{ fontWeight: 900 }}>
                                        {blueprint.name.replace(' (Custom)', '').replace(`${info.label} `, '').replace(`${category}`, '').replace(/^\s*-\s*/, '').trim() || category}
                                      </h5>
                                      {blueprint.description && (
                                        <p className="text-white/40 text-[9px] mt-1 line-clamp-1">
                                          {blueprint.description}
                                        </p>
                                      )}

                                      {/* Badges */}
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {qualityInfo && (
                                          <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[8px] uppercase tracking-[0.15em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                                            {qualityInfo.label}
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] uppercase tracking-[0.15em] text-white/40 font-black" style={{ fontWeight: 900 }}>
                                          {tierType}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] text-white/40">
                                          {blueprint.price_breaks.length} price break{blueprint.price_breaks.length !== 1 ? 's' : ''}
                                        </span>
                                        {(() => {
                                          const hasExplicitPrices = blueprint.price_breaks.some((pb: any) => pb.price !== undefined && pb.price !== null);
                                          return hasExplicitPrices ? (
                                            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[8px] text-green-400">
                                              Explicit Prices
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] text-blue-400">
                                              Auto-Calculate
                                            </span>
                                          );
                                        })()}
                                        {blueprint.applicable_to_categories && blueprint.applicable_to_categories.length > 0 && (
                                          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] text-purple-400">
                                            {blueprint.applicable_to_categories.length} {blueprint.applicable_to_categories.length === 1 ? 'category' : 'categories'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                    <button
                                      onClick={() => openEditModal(blueprint)}
                                      className="flex-1 bg-white/5 border border-white/10 rounded text-center px-3 py-1.5 text-[9px] text-white uppercase tracking-[0.15em] hover:bg-white/10 transition-colors font-black"
                                      style={{ fontWeight: 900 }}
                                    >
                                      Edit
                                    </button>
                                    <button className="flex-1 bg-white/10 border border-white/20 rounded text-center px-3 py-1.5 text-[9px] text-white uppercase tracking-[0.15em] hover:bg-white/20 transition-colors font-black" style={{ fontWeight: 900 }}>
                                      Apply
                                    </button>
                                    <button
                                      onClick={() => handleDelete(blueprint)}
                                      className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[9px] text-white/60 hover:text-red-400 hover:border-red-400/20 hover:bg-red-500/10 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} strokeWidth={2} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Pricing Blueprint Modal */}
      <PricingBlueprintModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        vendorId={vendorId}
        blueprint={selectedBlueprint || undefined}
        categories={categories}
      />
    </div>
  );
}
