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
import { Button, Input, Card, Container, ds, cn } from '@/components/ds';
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
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [consistencyFilter, setConsistencyFilter] = useState<string>('all'); // For concentrates
  const [tierFilter, setTierFilter] = useState<string>('all'); // For flower pricing tiers
  const [strainTypeFilter, setStrainTypeFilter] = useState<string>('all'); // Indica/Sativa/Hybrid
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
        console.log('🏷️ Sample categories:', prods.slice(0, 5).map((p: any) => ({ name: p.name, category: p.category })));
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

    // Filter by category (parent or subcategory)
    if (categoryFilter !== 'all') {
      if (subcategoryFilter !== 'all') {
        // Specific subcategory selected - filter by subcategory name
        const subcat = categories.find(c => c.id === subcategoryFilter);
        if (subcat) {
          items = items.filter(p => p.category === subcat.name);
        }
      } else {
        // Parent category selected - show all products in that parent and its subcategories
        const parent = categories.find(c => c.id === categoryFilter);
        const subcats = categories.filter(c => c.parent_id === categoryFilter);
        const categoryNames = [parent?.name, ...subcats.map(s => s.name)].filter(Boolean);
        items = items.filter(p => categoryNames.includes(p.category));
      }
    }

    // Filter by consistency (concentrates only)
    if (consistencyFilter !== 'all') {
      items = items.filter(p => {
        if (!p.custom_fields) return false;
        if (Array.isArray(p.custom_fields)) {
          const field = p.custom_fields.find((f: any) =>
            f.field_name === 'consistency' || f.label === 'Consistency'
          );
          return (field?.field_value || field?.value) === consistencyFilter;
        } else if (typeof p.custom_fields === 'object' && p.custom_fields !== null) {
          return (p.custom_fields as any).consistency === consistencyFilter;
        }
        return false;
      });
    }

    // Filter by strain type (Indica/Sativa/Hybrid)
    if (strainTypeFilter !== 'all') {
      items = items.filter(p => {
        if (!p.custom_fields) return false;
        if (Array.isArray(p.custom_fields)) {
          const field = p.custom_fields.find((f: any) =>
            f.field_name === 'strain_type' || f.label === 'Strain Type'
          );
          return (field?.field_value || field?.value) === strainTypeFilter;
        } else if (typeof p.custom_fields === 'object' && p.custom_fields !== null) {
          return (p.custom_fields as any).strain_type === strainTypeFilter;
        }
        return false;
      });
    }

    // Filter by pricing tier (flower only) - TODO: implement when product has tier assignment
    if (tierFilter !== 'all') {
      // For now, skip - would need product_pricing_assignments table lookup
      // items = items.filter(p => p.pricing_tier_id === tierFilter);
    }

    return items;
  }, [products, search, statusFilter, categoryFilter, subcategoryFilter, categories, consistencyFilter, strainTypeFilter, tierFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Get parent categories only (Steve Jobs style - clean dropdown)
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  // Get subcategories for selected parent
  const subcategories = useMemo(() => {
    if (categoryFilter === 'all' || !categoryFilter) return [];
    return categories.filter(c => c.parent_id === categoryFilter);
  }, [categories, categoryFilter]);

  // Get unique consistencies for concentrates (from product custom_fields)
  // Steve Jobs Style: Subcategories inherit parent's filter attributes
  const consistencies = useMemo(() => {
    const concentratesCategory = categories.find(c => c.slug === 'concentrates' && !c.parent_id);
    if (!concentratesCategory) return [];

    // Check if current filter is concentrates parent OR a concentrates subcategory
    const selectedCategory = categories.find(c => c.id === categoryFilter);
    const isConcentratesOrChild = categoryFilter === concentratesCategory.id ||
      selectedCategory?.parent_id === concentratesCategory.id;

    if (!isConcentratesOrChild) return [];

    const consistencySet = new Set<string>();
    products.forEach(p => {
      if (p.category === 'Concentrates' && p.custom_fields) {
        // Check both array and object formats
        if (Array.isArray(p.custom_fields)) {
          const consistencyField = p.custom_fields.find((f: any) =>
            f.field_name === 'consistency' || f.label === 'Consistency'
          );
          if (consistencyField?.field_value || consistencyField?.value) {
            consistencySet.add(consistencyField.field_value || consistencyField.value);
          }
        } else if (typeof p.custom_fields === 'object' && p.custom_fields !== null) {
          const fields = p.custom_fields as any;
          if (fields.consistency) {
            consistencySet.add(fields.consistency);
          }
        }
      }
    });
    return Array.from(consistencySet).sort();
  }, [products, categories, categoryFilter]);

  // Get unique pricing tiers for flower
  // Steve Jobs Style: Subcategories inherit parent's pricing tiers
  const pricingTiers = useMemo(() => {
    const flowerCategory = categories.find(c => c.slug === 'flower' && !c.parent_id);
    if (!flowerCategory) return [];

    // Check if current filter is flower parent OR a flower subcategory
    const selectedCategory = categories.find(c => c.id === categoryFilter);
    const isFlowerOrChild = categoryFilter === flowerCategory.id ||
      selectedCategory?.parent_id === flowerCategory.id;

    if (!isFlowerOrChild) return [];

    // Get pricing tier blueprints for the PARENT category (inheritance!)
    // Even if a flower subcategory is selected, we use the parent's tiers
    const effectiveCategoryId = selectedCategory?.parent_id || categoryFilter;

    return pricingBlueprints
      .filter(pb => {
        if (!pb.is_active || pb.context !== 'product') return false;

        // Check if this tier applies to the parent category
        if (!pb.applicable_to_categories || pb.applicable_to_categories.length === 0) return true;
        return pb.applicable_to_categories.includes(effectiveCategoryId);
      })
      .map(pb => ({
        id: pb.id,
        name: pb.name,
        tier_type: pb.tier_type
      }));
  }, [categories, categoryFilter, pricingBlueprints]);

  // Get unique strain types (Indica/Sativa/Hybrid) for current category
  // Steve Jobs Style: Subcategories inherit parent's filter attributes
  const strainTypes = useMemo(() => {
    const flowerCategory = categories.find(c => c.slug === 'flower' && !c.parent_id);
    const concentratesCategory = categories.find(c => c.slug === 'concentrates' && !c.parent_id);

    if (!flowerCategory || !concentratesCategory) return [];

    // Check if current filter is flower/concentrates parent OR their subcategories
    const selectedCategory = categories.find(c => c.id === categoryFilter);
    const isFlowerOrChild = categoryFilter === flowerCategory.id ||
      selectedCategory?.parent_id === flowerCategory.id;
    const isConcentratesOrChild = categoryFilter === concentratesCategory.id ||
      selectedCategory?.parent_id === concentratesCategory.id;

    if (!isFlowerOrChild && !isConcentratesOrChild) return [];

    const strainTypeSet = new Set<string>();
    products.forEach(p => {
      if ((p.category === 'Flower' || p.category === 'Concentrates') && p.custom_fields) {
        // Check both array and object formats
        if (Array.isArray(p.custom_fields)) {
          const strainTypeField = p.custom_fields.find((f: any) =>
            f.field_name === 'strain_type' || f.label === 'Strain Type'
          );
          if (strainTypeField?.field_value || strainTypeField?.value) {
            strainTypeSet.add(strainTypeField.field_value || strainTypeField.value);
          }
        } else if (typeof p.custom_fields === 'object' && p.custom_fields !== null) {
          const fields = p.custom_fields as any;
          if (fields.strain_type) {
            strainTypeSet.add(fields.strain_type);
          }
        }
      }
    });

    // Sort in standard order: Indica, Sativa, Hybrid
    const types = Array.from(strainTypeSet);
    const order = ['Indica', 'Sativa', 'Hybrid'];
    return types.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [products, categories, categoryFilter]);

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
              <h2 className="text-white text-2xl font-lightmb-2" style={{ fontWeight: 900 }}>
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
                        <h3 className="text-white font-lighttext-base" style={{ fontWeight: 900 }}>
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
                      <h3 className="text-white font-lighttext-base" style={{ fontWeight: 900 }}>
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
          <h1 className="text-xs uppercase tracking-[0.15em] text-white font-lightmb-1" style={{ fontWeight: 900 }}>
            Products
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">
            Manage your catalog, categories, and pricing
          </p>
        </div>

        {activeTab === 'catalog' && (
          <Link
            href="/vendor/products/new"
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-lighttransition-all inline-flex items-center gap-2"
                      >
            <Plus size={12} strokeWidth={2.5} />
            Add Product
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className={cn("flex gap-2 mb-6 border-b", ds.colors.border.default)}>
        <button
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "px-4 py-3 transition-all",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.typography.weight.light,
            activeTab === 'catalog'
              ? cn('text-white border-b-2 border-white')
              : cn(ds.colors.text.quaternary, 'hover:text-white/60')
          )}
        >
          <div className="flex items-center gap-2">
            <Package size={14} />
            Catalog
            <span className={cn("px-2 py-0.5 rounded text-[8px]", ds.colors.bg.hover)}>
              {stats.total}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            "px-4 py-3 transition-all",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.typography.weight.light,
            activeTab === 'categories'
              ? cn('text-white border-b-2 border-white')
              : cn(ds.colors.text.quaternary, 'hover:text-white/60')
          )}
        >
          <div className="flex items-center gap-2">
            <FolderTree size={14} />
            Categories
            <span className={cn("px-2 py-0.5 rounded text-[8px]", ds.colors.bg.hover)}>
              {categories.length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={cn(
            "px-4 py-3 transition-all",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.typography.weight.light,
            activeTab === 'pricing'
              ? cn('text-white border-b-2 border-white')
              : cn(ds.colors.text.quaternary, 'hover:text-white/60')
          )}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={14} />
            Pricing Rules
            <span className={cn("px-2 py-0.5 rounded text-[8px]", ds.colors.bg.hover)}>
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
          parentCategories={parentCategories}
          subcategories={subcategories}
          subcategoryFilter={subcategoryFilter}
          setSubcategoryFilter={setSubcategoryFilter}
          consistencies={consistencies}
          consistencyFilter={consistencyFilter}
          setConsistencyFilter={setConsistencyFilter}
          strainTypes={strainTypes}
          strainTypeFilter={strainTypeFilter}
          setStrainTypeFilter={setStrainTypeFilter}
          pricingTiers={pricingTiers}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
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
  parentCategories: Category[];
  subcategories: Category[];
  subcategoryFilter: string;
  setSubcategoryFilter: (f: string) => void;
  consistencies: string[];
  consistencyFilter: string;
  setConsistencyFilter: (f: string) => void;
  strainTypes: string[];
  strainTypeFilter: string;
  setStrainTypeFilter: (f: string) => void;
  pricingTiers: any[];
  tierFilter: string;
  setTierFilter: (f: string) => void;
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
  parentCategories,
  subcategories,
  subcategoryFilter,
  setSubcategoryFilter,
  consistencies,
  consistencyFilter,
  setConsistencyFilter,
  strainTypes,
  strainTypeFilter,
  setStrainTypeFilter,
  pricingTiers,
  tierFilter,
  setTierFilter,
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
        <Container padding="normal" className={ds.effects.radius['2xl']}>
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>Total</div>
          <div className={cn("text-white", ds.typography.size['2xl'], ds.typography.weight.light)}>{stats.total}</div>
        </Container>
        <Container padding="normal" className={ds.effects.radius['2xl']}>
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>Active</div>
          <div className={cn("text-white", ds.typography.size['2xl'], ds.typography.weight.light)}>{stats.approved}</div>
        </Container>
        <Container padding="normal" className={ds.effects.radius['2xl']}>
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>Pending</div>
          <div className={cn("text-white", ds.typography.size['2xl'], ds.typography.weight.light)}>{stats.pending}</div>
        </Container>
        <Container padding="normal" className={ds.effects.radius['2xl']}>
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>Rejected</div>
          <div className={cn("text-white", ds.typography.size['2xl'], ds.typography.weight.light)}>{stats.rejected}</div>
        </Container>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.colors.text.quaternary)} />
          <input
            type="text"
            placeholder="SEARCH PRODUCTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2",
              ds.colors.bg.primary,
              ds.colors.border.default,
              "border",
              ds.effects.radius.lg,
              "text-white",
              "placeholder:text-white/30",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              "focus:outline-none",
              `focus:${ds.colors.border.emphasis}`
            )}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "px-4 py-2",
            ds.colors.bg.primary,
            ds.colors.border.default,
            "border",
            ds.effects.radius.lg,
            "text-white",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.typography.weight.light,
            "focus:outline-none",
            `focus:${ds.colors.border.emphasis}`
          )}
        >
          <option value="all">All Status</option>
          <option value="approved">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setSubcategoryFilter('all'); // Reset subcategory when parent changes
          }}
          className={cn(
            "px-4 py-2",
            ds.colors.bg.primary,
            ds.colors.border.default,
            "border",
            ds.effects.radius.lg,
            "text-white",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.typography.weight.light,
            "focus:outline-none",
            `focus:${ds.colors.border.emphasis}`
          )}
        >
          <option value="all">All Categories</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory Pills - Steve Jobs Style (Beverages) */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>
            Dosage
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSubcategoryFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.typography.weight.light,
                subcategoryFilter === 'all'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
              )}
            >
              All
            </button>
            {subcategories.map((subcat) => (
              <button
                key={subcat.id}
                onClick={() => setSubcategoryFilter(subcat.id)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  subcategoryFilter === subcat.id
                    ? 'bg-white text-black'
                    : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                )}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Consistency Pills - Steve Jobs Style (Concentrates) */}
      {consistencies.length > 0 && (
        <div className="mb-6">
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>
            Consistency
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setConsistencyFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.typography.weight.light,
                consistencyFilter === 'all'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
              )}
            >
              All
            </button>
            {consistencies.map((consistency) => (
              <button
                key={consistency}
                onClick={() => setConsistencyFilter(consistency)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  consistencyFilter === consistency
                    ? 'bg-white text-black'
                    : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                )}
              >
                {consistency}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strain Type Pills - Steve Jobs Style (Flower & Concentrates) */}
      {strainTypes.length > 0 && (
        <div className="mb-6">
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>
            Strain Type
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setStrainTypeFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.typography.weight.light,
                strainTypeFilter === 'all'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
              )}
            >
              All
            </button>
            {strainTypes.map((type) => (
              <button
                key={type}
                onClick={() => setStrainTypeFilter(type)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  strainTypeFilter === type
                    ? 'bg-white text-black'
                    : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Tier Pills - Steve Jobs Style (Flower) */}
      {pricingTiers.length > 0 && (
        <div className="mb-6">
          <div className={cn(ds.typography.size.micro, ds.typography.weight.light, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>
            Quality Tier
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTierFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.typography.weight.light,
                tierFilter === 'all'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
              )}
            >
              All
            </button>
            {pricingTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setTierFilter(tier.id)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-all",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  tierFilter === tier.id
                    ? 'bg-white text-black'
                    : cn(ds.colors.bg.elevated, ds.colors.text.tertiary, `hover:${ds.colors.bg.hover}`, 'hover:text-white/80')
                )}
              >
                {tier.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12">
          <div className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wider, ds.typography.weight.light)}>Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <Container padding="normal" className={cn("text-center py-16", ds.effects.radius['2xl'])}>
          <Package size={48} className="mx-auto mb-4 text-white/20" />
          <div className={cn("text-white mb-2", ds.typography.size.sm, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>No products found</div>
          <div className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wider, ds.typography.weight.light, "mb-6")}>Start adding products to your catalog</div>
          <Link href="/vendor/products/new">
            <Button icon={Plus} iconPosition="left">
              Add Your First Product
            </Button>
          </Link>
        </Container>
      ) : (
        <>
          <div className="space-y-3">
            {products.map((product) => (
              <Container
                key={product.id}
                padding="normal"
                className={cn(
                  ds.effects.radius['2xl'],
                  ds.effects.transition.normal,
                  "group",
                  `hover:${ds.colors.border.emphasis}`
                )}
              >
                <div className="flex items-center gap-4">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <div className={cn("w-14 h-14 relative overflow-hidden flex-shrink-0 border", ds.colors.bg.elevated, ds.colors.border.default, ds.effects.radius.lg)}>
                      <Image
                        src={getSupabaseImageUrl(product.images[0], 112, 112)}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className={cn("w-14 h-14 flex items-center justify-center flex-shrink-0 border", ds.colors.bg.elevated, ds.colors.border.default, ds.effects.radius.lg)}>
                      <Package size={20} className="text-white/20" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-white truncate", ds.typography.size.sm, ds.typography.transform.uppercase, ds.typography.tracking.tight, ds.typography.weight.light)}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={cn(ds.colors.text.quaternary, ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>{product.sku}</span>
                      <span className={cn("text-white/20", ds.typography.size.micro)}>•</span>
                      <span className={cn(ds.colors.text.quaternary, ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>{product.category}</span>
                      {product.status === 'approved' && (
                        <>
                          <span className={cn("text-white/20", ds.typography.size.micro)}>•</span>
                          <span className={cn(ds.colors.status.success, "text-[8px] uppercase tracking-wider px-2 py-0.5 bg-green-500/10 rounded", ds.typography.weight.light)}>Active</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cn("text-white", ds.typography.size.lg, ds.typography.weight.light)}>${product.price.toFixed(2)}</div>
                    <div className={cn(ds.colors.text.ghost, ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wider, ds.typography.weight.light, "mt-0.5")}>
                      Stock: {product.total_stock}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className={cn("p-2 rounded-lg transition-colors", `hover:${ds.colors.bg.hover}`)}
                      title="Quick View"
                    >
                      <Eye size={14} className={ds.colors.text.tertiary} />
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
              </Container>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={cn(
                  "px-4 py-2 border text-white transition-all",
                  ds.colors.bg.primary,
                  ds.colors.border.default,
                  ds.effects.radius.lg,
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  `hover:${ds.colors.bg.elevated}`,
                  `hover:${ds.colors.border.emphasis}`
                )}
              >
                Previous
              </button>
              <div className={cn("px-4 py-2", ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wider, ds.typography.weight.light)}>
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={cn(
                  "px-4 py-2 border text-white transition-all",
                  ds.colors.bg.primary,
                  ds.colors.border.default,
                  ds.effects.radius.lg,
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.typography.weight.light,
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  `hover:${ds.colors.bg.elevated}`,
                  `hover:${ds.colors.border.emphasis}`
                )}
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
  const [parentForSubcategory, setParentForSubcategory] = useState<string | null>(null);
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

  // Expanded sections for each category (fields, subcategories, pricing)
  const [expandedSections, setExpandedSections] = useState<{ [categoryId: string]: 'fields' | 'subcategories' | null }>({});

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null);
    setParentForSubcategory(parentId || null);
    setFormData({ name: '', icon: '', description: '', imageFile: null });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setParentForSubcategory(null);
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
    setParentForSubcategory(null);
    setFormData({ name: '', icon: '', description: '', imageFile: null });
  };

  const toggleSection = (categoryId: string, section: 'fields' | 'subcategories') => {
    setExpandedSections(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] === section ? null : section
    }));
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
        image_url: imageUrl,
        parent_id: parentForSubcategory || null
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
            title: parentForSubcategory ? 'Subcategory Created' : 'Category Created',
            message: `${parentForSubcategory ? 'Subcategory' : 'Category'} created successfully`
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

  // Separate parent categories from subcategories
  const vendorCategories = categories.filter(c => c.vendor_id === vendorId);
  const parentCategories = vendorCategories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => vendorCategories.filter(c => c.parent_id === parentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "text-white mb-1", ds.typography.weight.light)}>
            Your Categories
          </h3>
          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
            Organize products with categories, subcategories, and custom fields
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={Plus} onClick={() => openCreateModal()}>
            NEW CATEGORY
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/40 text-[10px] uppercase tracking-wider">Loading categories...</div>
        </div>
      ) : parentCategories.length === 0 ? (
        <Container className="text-center py-16">
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6", ds.colors.bg.elevated)}>
            <FolderTree size={40} className={ds.colors.text.quaternary} />
          </div>
          <h4 className={cn("text-white mb-2", ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>
            No Categories Yet
          </h4>
          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-6 max-w-md mx-auto")}>
            Create categories to organize your products and add custom fields like THC%, strain type, etc.
          </p>
          <Button icon={Plus} onClick={() => openCreateModal()}>
            Create Your First Category
          </Button>
        </Container>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const categoryFields = fieldGroups.filter(fg => fg.category_id === category.id);
            const expandedSection = expandedSections[category.id];

            return (
              <div
                key={category.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Parent Category Header */}
                <div className="px-6 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {category.image_url ? (
                        <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                          <Image
                            src={getSupabaseImageUrl(category.image_url, 80, 80)}
                            alt={category.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                          <Package size={24} className="text-white/40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className={cn("text-white mb-0.5", ds.typography.size.sm, ds.typography.transform.uppercase, ds.typography.tracking.tight, ds.typography.weight.light)}>
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "line-clamp-1")}>
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className={cn("flex items-center gap-6", ds.colors.text.quaternary, ds.typography.size.micro, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.typography.weight.light)}>
                        <div className="text-center">
                          <div className={cn("text-white mb-0.5", ds.typography.size.base)}>{subcategories.length}</div>
                          <div>Subcategories</div>
                        </div>
                        <div className="text-center">
                          <div className={cn("text-white mb-0.5", ds.typography.size.base)}>{categoryFields.length}</div>
                          <div>Fields</div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 size={14} className="text-white/60" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Pills */}
                <div className="px-6 py-3 bg-black/40 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSection(category.id, 'subcategories')}
                      className={cn(
                        "px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5",
                        ds.typography.size.xs,
                        ds.typography.transform.uppercase,
                        ds.typography.tracking.wide,
                        ds.typography.weight.light,
                        expandedSection === 'subcategories'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      )}
                    >
                      <FolderTree size={12} />
                      Subcategories ({subcategories.length})
                    </button>
                    <button
                      onClick={() => toggleSection(category.id, 'fields')}
                      className={cn(
                        "px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5",
                        ds.typography.size.xs,
                        ds.typography.transform.uppercase,
                        ds.typography.tracking.wide,
                        ds.typography.weight.light,
                        expandedSection === 'fields'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      )}
                    >
                      <Layers size={12} />
                      Fields ({categoryFields.length})
                    </button>
                  </div>
                </div>

                {/* Subcategories Section */}
                {expandedSection === 'subcategories' && (
                  <div className="px-6 py-4 bg-black/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white/60 text-[10px] uppercase tracking-[0.15em] font-light">
                        Subcategories for {category.name}
                      </h4>
                      <button
                        onClick={() => openCreateModal(category.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] uppercase tracking-[0.15em] font-lighttransition-all flex items-center gap-1.5"
                                              >
                        <Plus size={12} />
                        Add Subcategory
                      </button>
                    </div>

                    {subcategories.length === 0 ? (
                      <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-white/5">
                        <FolderTree size={28} className="mx-auto mb-2 text-white/20" />
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3">No subcategories yet</p>
                        <button
                          onClick={() => openCreateModal(category.id)}
                          className="text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] font-black"
                                                  >
                          Create first subcategory →
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {subcategories.map((subcat) => {
                          // Steve Jobs: Show total field count (own + inherited from parent)
                          const subcatOwnFields = fieldGroups.filter(fg => fg.category_id === subcat.id);
                          const parentFields = fieldGroups.filter(fg => fg.category_id === category.id);
                          const totalFieldCount = subcatOwnFields.length + parentFields.length;

                          return (
                            <div
                              key={subcat.id}
                              className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="text-white text-[11px] uppercase tracking-tight font-lightmb-1" style={{ fontWeight: 900 }}>
                                    {subcat.name}
                                  </h5>
                                  {subcat.description && (
                                    <p className="text-white/40 text-[9px] uppercase tracking-wider line-clamp-1">
                                      {subcat.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => openEditModal(subcat)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={12} className="text-white/60" />
                                  </button>
                                  <button
                                    onClick={() => openFieldModal(subcat)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Fields"
                                  >
                                    <Layers size={12} className="text-white/60" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(subcat.id, subcat.name)}
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} className="text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-light">
                                {totalFieldCount} field{totalFieldCount !== 1 ? 's' : ''}
                                {parentFields.length > 0 && (
                                  <span className="text-white/30 ml-1">
                                    ({subcatOwnFields.length} + {parentFields.length} inherited)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Fields Section */}
                {expandedSection === 'fields' && (
                  <div className="px-6 py-4 bg-black/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white/60 text-[10px] uppercase tracking-[0.15em] font-light">
                        Custom Fields for {category.name}
                      </h4>
                      <button
                        onClick={() => openFieldModal(category)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[10px] uppercase tracking-[0.15em] font-lighttransition-all flex items-center gap-1.5"
                                              >
                        <Plus size={12} />
                        Configure Fields
                      </button>
                    </div>

                    {categoryFields.length === 0 ? (
                      <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-white/5">
                        <Layers size={28} className="mx-auto mb-2 text-white/20" />
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3">No custom fields configured</p>
                        <button
                          onClick={() => openFieldModal(category)}
                          className="text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] font-black"
                                                  >
                          Set up custom fields →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categoryFields.map((field) => (
                          <div
                            key={field.id}
                            className="bg-white/[0.03] border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white text-[11px] uppercase tracking-tight font-lightmb-0.5" style={{ fontWeight: 900 }}>
                                  {field.name}
                                </div>
                                <div className="text-white/40 text-[9px] uppercase tracking-wider">
                                  {field.fields?.length || 0} field{field.fields?.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <button
                                onClick={() => openFieldModal(category)}
                                className="text-white/60 hover:text-white text-[9px] uppercase tracking-[0.15em] font-black"
                                                              >
                                Edit →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                <h2 className="text-xs uppercase tracking-[0.15em] text-white font-lightmb-1" style={{ fontWeight: 900 }}>
                  {editingCategory
                    ? 'Edit Category'
                    : parentForSubcategory
                      ? 'Create Subcategory'
                      : 'Create Category'
                  }
                </h2>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">
                  {editingCategory
                    ? 'Update category details'
                    : parentForSubcategory
                      ? `Add subcategory to ${categories.find(c => c.id === parentForSubcategory)?.name || 'category'}`
                      : 'Add a new parent category'
                  }
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
                className="flex-1 px-6 py-3 bg-black/20 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-lighttransition-colors disabled:opacity-30"
                              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={saving || uploading || !formData.name.trim()}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-lighttransition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
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
                  <h2 className="text-xs uppercase tracking-[0.15em] text-white font-lightmb-1" style={{ fontWeight: 900 }}>
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
                    <h3 className="text-white font-lighttext-[10px] uppercase tracking-[0.15em] mb-4" style={{ fontWeight: 900 }}>
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
                                  <h4 className="text-white font-lighttext-xs uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                                    {field.definition?.label || field.fieldId}
                                  </h4>
                                  {field.source === 'admin' && (
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/40 text-[9px] font-lightuppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
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
                                    <div className="text-white/80 text-[10px] font-lightuppercase tracking-[0.15em] mb-0.5" style={{ fontWeight: 900 }}>
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
                  <span className="text-[10px] font-lightuppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
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
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-lighttext-[10px] uppercase tracking-[0.15em] transition-colors"
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
                  <h2 className="text-xs uppercase tracking-[0.15em] text-white font-lightmb-1" style={{ fontWeight: 900 }}>
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
                  <div className="text-white text-xs uppercase tracking-tight font-light">Required Field</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">Users must fill this field when creating products</div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-white/5">
              <button
                onClick={closeFieldBuilder}
                disabled={savingField}
                className="flex-1 px-6 py-3 bg-black/20 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-lighttransition-colors disabled:opacity-30"
                              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                disabled={savingField || !fieldFormData.label.trim()}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] uppercase tracking-[0.15em] font-lighttransition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
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
      <div className={cn("mb-6 pb-4 border-b", ds.colors.border.default)}>
        <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, "mb-4", ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
          Create pricing structures and apply them to products
        </p>
        <Button icon={Plus} onClick={openCreateModal}>
          Create Rule
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className={cn(ds.colors.text.quaternary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>Loading...</div>
        </div>
      ) : customBlueprints.length === 0 ? (
        <Container className="text-center py-20">
          <DollarSign size={32} className={cn("mx-auto mb-4", ds.colors.text.whisper)} strokeWidth={1.5} />
          <div className={cn(ds.colors.text.tertiary, ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, "mb-2")}>No Rules</div>
          <p className={cn(ds.colors.text.quaternary, ds.typography.size.xs, "mb-6")}>
            Create pricing structures for your products
          </p>
          <Button icon={Plus} onClick={openCreateModal}>
            Create First Rule
          </Button>
        </Container>
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
                      <h3 className="text-xs uppercase tracking-[0.15em] text-white font-light">
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
                            <h4 className="text-[9px] uppercase tracking-[0.15em] text-white/60 font-light">
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
                                      <h5 className="text-white font-lighttext-xs uppercase tracking-tight" style={{ fontWeight: 900 }}>
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
                                          <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[8px] uppercase tracking-[0.15em] text-white/60 font-light">
                                            {qualityInfo.label}
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] uppercase tracking-[0.15em] text-white/40 font-light">
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
                                                                          >
                                      Edit
                                    </button>
                                    <button className="flex-1 bg-white/10 border border-white/20 rounded text-center px-3 py-1.5 text-[9px] text-white uppercase tracking-[0.15em] hover:bg-white/20 transition-colors font-light">
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
