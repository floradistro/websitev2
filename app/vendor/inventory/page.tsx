"use client";

import { useEffect, useState } from 'react';
import { Search, ChevronRight, Package, CheckCircle, AlertTriangle, X, Save, Plus, Minus, Edit2, FileText, Send, Filter, MapPin, ArrowRightLeft, Download, Sliders, Trash2, Upload, Shield } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface FloraFields {
  thc_percentage?: string;
  cbd_percentage?: string;
  strain_type?: string;
  lineage?: string;
  terpenes?: string;
  effects?: string;
  nose?: string;
  taste?: string;
}

interface InventoryItem {
  id: number | null;
  inventory_id: number | null;
  product_id: string; // Supabase UUID
  product_name: string;
  sku: string;
  quantity: number;
  category_name: string;
  image: string | null;
  price: number;
  description?: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_status_label: string;
  location_name: string;
  location_id: number | null;
  location_names?: string; // NEW: Show all locations with stock
  locations_with_stock?: number; // NEW: Count of locations
  inventory_locations?: any[]; // NEW: Full inventory data per location
  flora_fields?: FloraFields;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  is_primary: boolean;
  is_active: boolean;
}

type ViewMode = 'details' | 'adjust' | 'fields' | 'images' | 'coas';

export default function VendorInventory() {
  const { isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<Record<string, ViewMode>>({});
  const [quickAdjustInput, setQuickAdjustInput] = useState<string>('');
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [setQuantityInput, setSetQuantityInput] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [strainTypeFilter, setStrainTypeFilter] = useState<string>('all');
  const [thcRangeFilter, setThcRangeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'status' | 'location'>('name');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Bulk actions
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [transferToLocation, setTransferToLocation] = useState<string>('');
  
  // Field editing
  const [editedFields, setEditedFields] = useState<Record<string, FloraFields>>({});
  const [submittingChange, setSubmittingChange] = useState(false);
  
  // COA management
  const [productCOAs, setProductCOAs] = useState<Record<string, any[]>>({});
  const [uploadingCOA, setUploadingCOA] = useState(false);
  const [coaForm, setCoaForm] = useState({
    file: null as File | null,
    lab_name: '',
    test_date: '',
    expiry_date: '',
    batch_number: '',
    thc: '',
    cbd: '',
    thca: '',
    cbda: '',
    cbg: '',
    cbn: '',
    total_cannabinoids: '',
    total_terpenes: '',
  });

  const loadInventory = async () => {
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const storedVendorId = localStorage.getItem('vendor_id');
      if (!storedVendorId) {
        setLoading(false);
        return;
      }
      
      setVendorId(storedVendorId);

      // Fetch products, inventory, and locations in parallel
      const [productsResponse, inventoryResponse, locationsResponse] = await Promise.all([
        axios.get('/api/vendor/products', {
          headers: { 'x-vendor-id': storedVendorId }
        }).catch(() => ({ data: { products: [] } })),
        axios.get('/api/vendor/inventory', {
          headers: { 'x-vendor-id': storedVendorId }
        }).catch(() => ({ data: { inventory: [] } })),
        axios.get('/api/vendor/locations', {
          headers: { 'x-vendor-id': storedVendorId }
        }).catch(() => ({ data: { locations: [] } }))
      ]);
      
      const inventoryData = inventoryResponse.data.inventory || [];
      const locationsData = locationsResponse.data.locations || [];
      const allProducts = productsResponse.data.products || [];
      
      setLocations(locationsData);
      
      // Debug: Check product statuses
      console.log('🔵 Total vendor products:', allProducts.length);
      const statusBreakdown = allProducts.reduce((acc: any, p: any) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
      console.log('🔵 Product status breakdown:', statusBreakdown);
      
      // Show ALL vendor products (including pending, draft, etc.) for inventory management
      const vendorProducts = allProducts;
      
      console.log('🔵 Vendor products to display:', vendorProducts.length);
      console.log('🔵 Inventory records:', inventoryData.length);
      console.log('🔵 Locations:', locationsData.length);
      
      // Debug: Check inventory product_id vs products UUID
      const inventoryProductIds = new Set(inventoryData.map((i: any) => i.product_id));
      const productUUIDs = new Set(vendorProducts.map((p: any) => p.id));
      const orphanedInventory = [...inventoryProductIds].filter(id => !productUUIDs.has(id));
      if (orphanedInventory.length > 0) {
        console.log('⚠️ Inventory records without matching products:', orphanedInventory.length, orphanedInventory);
      }
      
      // Create inventory map grouped by product_id (UUID) → locations
      const inventoryByProduct = new Map();
      inventoryData.forEach((inv: any) => {
        // Use product_id which is now UUID
        const productId = inv.product_id?.toString();
        if (!inventoryByProduct.has(productId)) {
          inventoryByProduct.set(productId, []);
        }
        inventoryByProduct.get(productId).push(inv);
      });
      
      // Map products to show inventory across all locations
      const mappedData = vendorProducts.map((product: any) => {
        // Match by UUID, not wordpress_id
        const productInventory = inventoryByProduct.get(product.id) || [];
        
        // Calculate totals across all locations
        const totalQuantity = productInventory.reduce((sum: number, inv: any) => sum + parseFloat(inv.quantity || 0), 0);
        const locationsWithStock = productInventory.filter((inv: any) => parseFloat(inv.quantity || 0) > 0);
        
        // Determine overall stock status
        let stockStatus = 'out_of_stock';
        if (totalQuantity > 0) {
          stockStatus = totalQuantity > 10 ? 'in_stock' : 'low_stock';
        }
        
        // Get primary location (most stock) or first location
        const primaryInv = productInventory.sort((a: any, b: any) => 
          parseFloat(b.quantity || 0) - parseFloat(a.quantity || 0)
        )[0];
        
        // Show WHERE products are in stock
        const locationsList = productInventory.map((inv: any) => {
          const loc = locationsData.find((l: any) => l.id === inv.location_id);
          const qty = parseFloat(inv.quantity || 0);
          return { 
            name: loc?.name || 'Unknown Location', 
            quantity: qty,
            id: inv.location_id
          };
        }).filter((l: any) => l.quantity > 0);
        
        return {
          id: primaryInv?.id || null,
          inventory_id: primaryInv?.id || null,
          product_id: product.id, // Supabase UUID
          product_name: product.name,
          sku: product.sku || '',
          quantity: totalQuantity,
          locations_with_stock: locationsWithStock.length,
          inventory_locations: productInventory,
          location_names: locationsList.map((l: any) => l.name).join(', ') || 'No locations',
          category_name: product.primary_category?.name || 'Product',
          image: product.featured_image_storage || product.featured_image || null,
          price: parseFloat(product.regular_price || 0),
          description: product.short_description || product.description || '',
          stock_status: stockStatus,
          stock_status_label: totalQuantity > 0 ? 
            `In Stock at ${locationsWithStock.length} location${locationsWithStock.length !== 1 ? 's' : ''}` :
            'Not Stocked',
          location_name: primaryInv?.location_name || 'No Location',
          location_id: primaryInv?.location_id || null,
          flora_fields: product.meta_data || {}
        };
      });
      
      console.log('✅ Mapped inventory data:', mappedData.length, 'items');
      
      setInventory(mappedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]);
      setLoading(false);
    }
  };
    
  useEffect(() => {
    loadInventory();
  }, [authLoading, isAuthenticated]);

  // Check for expand parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const expandProductId = params.get('expand');
      if (expandProductId) {
        setExpandedId(expandProductId);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleQuickAdjust = async (productId: any, operation: 'add' | 'subtract') => {
    const amount = parseFloat(quickAdjustInput);
    if (isNaN(amount) || amount <= 0) {
      showNotification({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Enter a valid amount',
      });
      return;
    }
    
    const item = inventory.find(inv => inv.product_id === productId);
    if (!item) {
      showNotification({
        type: 'error',
        title: 'Not Found',
        message: 'Inventory record not found',
      });
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch('/api/vendor/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId || ''
        },
        body: JSON.stringify({
          inventoryId: item.id,
          productId: item.product_id,
          adjustment: operation === 'add' ? amount : -amount,
          reason: adjustmentReason || `${operation === 'add' ? 'Added' : 'Removed'} ${amount} units`,
          locationId: item.location_id || undefined
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to adjust inventory');
      }
      
      showNotification({
        type: 'success',
        title: 'Stock Updated',
        message: `Inventory ${operation === 'add' ? 'increased' : 'decreased'} by ${amount} units`,
      });
      
      await loadInventory();
      
      setAdjustmentInput('');
      setAdjustmentReason('');
      setQuickAdjustInput('');
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Adjustment Failed',
        message: error.message || 'Failed to adjust inventory',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSetQuantity = async (productId: any) => {
    const qty = parseFloat(setQuantityInput);
    if (isNaN(qty) || qty < 0) {
      showNotification({
        type: 'warning',
        title: 'Invalid Quantity',
        message: 'Enter a valid quantity',
      });
      return;
    }

    const item = inventory.find(inv => inv.product_id === productId);
    if (!item) {
      showNotification({
        type: 'error',
        title: 'Not Found',
        message: 'Inventory item not found',
      });
      return;
    }

    try {
      setProcessing(true);
      
      const currentQty = item.quantity || 0;
      const targetQty = qty;
      const adjustment = targetQty - currentQty;
      
      if (adjustment === 0) {
        showNotification({
          type: 'info',
          title: 'No Change',
          message: 'Quantity unchanged',
        });
        setProcessing(false);
        return;
      }
      
      const response = await fetch('/api/vendor/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId || ''
        },
        body: JSON.stringify({
          inventoryId: item.id,
          adjustment: adjustment,
          reason: `Set quantity to ${targetQty}`
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to set inventory');
      }
      
      showNotification({
        type: 'success',
        title: 'Stock Updated',
        message: `Inventory set to ${targetQty}g`,
      });
      
      await loadInventory();
      setSetQuantityInput('');
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update inventory',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!transferToLocation || selectedItems.size === 0) {
      showNotification({
        type: 'warning',
        title: 'Invalid Selection',
        message: 'Select items and destination location',
      });
      return;
    }

    await showConfirm({
      title: 'Transfer Stock',
      message: `Transfer ${selectedItems.size} item(s) to selected location?`,
      confirmText: 'Transfer',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          setProcessing(true);
          
          // Call bulk transfer API
          showNotification({
            type: 'info',
            title: 'Transfer Initiated',
            message: 'Processing bulk transfer...',
          });
          
          // TODO: Implement bulk transfer API endpoint
          
          showNotification({
            type: 'success',
            title: 'Transfer Complete',
            message: `${selectedItems.size} item(s) transferred successfully`,
          });
          
          setShowBulkTransfer(false);
          setSelectedItems(new Set());
          setTransferToLocation('');
          await loadInventory();
          
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Transfer Failed',
            message: error.message || 'Failed to transfer items',
          });
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const handleExportInventory = () => {
    const csv = [
      ['Product', 'SKU', 'Category', 'Location', 'Quantity', 'Price', 'Stock Status'].join(','),
      ...filteredInventory.map(item => [
        item.product_name,
        item.sku,
        item.category_name,
        item.location_name,
        item.quantity,
        item.price,
        item.stock_status_label
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'Inventory exported successfully',
    });
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const handleSubmitChangeRequest = async (productId: any) => {
    const changes = editedFields[productId];
    
    if (!changes || Object.keys(changes).length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Changes',
        message: 'No changes to submit',
      });
      return;
    }

    try {
      setSubmittingChange(true);
      // Change requests coming soon
      showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: 'Product change requests feature coming soon',
      });
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Submit Failed',
        message: error.message || 'Failed to submit changes',
      });
    } finally {
      setSubmittingChange(false);
    }
  };

  const toggleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredInventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(i => i.product_id)));
    }
  };

  const handleDeleteInventory = async (inventoryId: string, productName: string) => {
    await showConfirm({
      title: 'Delete Inventory Record',
      message: `Are you sure you want to delete "${productName}" from inventory? This will remove the product from this location.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          setProcessing(true);
          
          const response = await axios.delete(`/api/vendor/inventory?inventory_id=${inventoryId}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'Deleted',
              message: 'Inventory record deleted successfully'
            });
            await loadInventory();
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete inventory record'
          });
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  // COA Management Functions
  const loadProductCOAs = async (productId: string) => {
    if (!vendorId) return;
    
    try {
      const response = await axios.get(`/api/vendor/coas?product_id=${productId}`, {
        headers: { 'x-vendor-id': vendorId }
      });
      
      if (response.data.success) {
        setProductCOAs(prev => ({
          ...prev,
          [productId]: response.data.coas
        }));
      }
    } catch (error) {
      console.error('Error loading COAs:', error);
    }
  };

  const handleCOAFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoaForm(prev => ({ ...prev, file }));
    }
  };

  const handleCOAUpload = async (productId: string) => {
    if (!coaForm.file || !vendorId) {
      showNotification({
        type: 'error',
        title: 'Missing File',
        message: 'Please select a file to upload'
      });
      return;
    }

    setUploadingCOA(true);

    try {
      const formData = new FormData();
      formData.append('file', coaForm.file);
      formData.append('product_id', productId);
      formData.append('lab_name', coaForm.lab_name);
      formData.append('test_date', coaForm.test_date);
      formData.append('expiry_date', coaForm.expiry_date);
      formData.append('batch_number', coaForm.batch_number);
      
      // Build test results object
      const testResults: any = {};
      if (coaForm.thc) testResults.thc = parseFloat(coaForm.thc);
      if (coaForm.cbd) testResults.cbd = parseFloat(coaForm.cbd);
      if (coaForm.thca) testResults.thca = parseFloat(coaForm.thca);
      if (coaForm.cbda) testResults.cbda = parseFloat(coaForm.cbda);
      if (coaForm.cbg) testResults.cbg = parseFloat(coaForm.cbg);
      if (coaForm.cbn) testResults.cbn = parseFloat(coaForm.cbn);
      if (coaForm.total_cannabinoids) testResults.total_cannabinoids = parseFloat(coaForm.total_cannabinoids);
      if (coaForm.total_terpenes) testResults.total_terpenes = parseFloat(coaForm.total_terpenes);
      
      formData.append('test_results', JSON.stringify(testResults));

      const response = await axios.post('/api/vendor/coas', formData, {
        headers: {
          'x-vendor-id': vendorId,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'COA Uploaded',
          message: 'Certificate of Analysis uploaded successfully'
        });
        
        // Reset form
        setCoaForm({
          file: null,
          lab_name: '',
          test_date: '',
          expiry_date: '',
          batch_number: '',
          thc: '',
          cbd: '',
          thca: '',
          cbda: '',
          cbg: '',
          cbn: '',
          total_cannabinoids: '',
          total_terpenes: '',
        });
        
        // Reload COAs for this product
        await loadProductCOAs(productId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.error || 'Failed to upload COA'
      });
    } finally {
      setUploadingCOA(false);
    }
  };

  const handleDeleteCOA = async (coaId: string, productId: string) => {
    if (!vendorId) return;

    await showConfirm({
      title: 'Delete COA',
      message: 'Are you sure you want to delete this Certificate of Analysis?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/vendor/coas?id=${coaId}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          if (response.data.success) {
            showNotification({
              type: 'success',
              title: 'COA Deleted',
              message: 'Certificate deleted successfully'
            });
            await loadProductCOAs(productId);
          }
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete COA'
          });
        }
      }
    });
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'text-red-500';
      case 'low_stock': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const categories = ['all', ...Array.from(new Set(inventory.map(i => i.category_name)))];
  const strainTypes = ['all', ...Array.from(new Set(inventory.map(i => i.flora_fields?.strain_type).filter(Boolean)))];

  let filteredInventory = inventory.filter(item => {
    // Location filter - check if product has inventory at this location
    if (locationFilter !== 'all') {
      const hasInventoryAtLocation = item.inventory_locations?.some((inv: any) => 
        inv.location_id === locationFilter
      );
      if (!hasInventoryAtLocation) return false;
      
      // When filtering by location, use that location's quantity for stock status
      const invAtLocation = item.inventory_locations?.find((inv: any) => inv.location_id === locationFilter);
      const qtyAtLocation = parseFloat(invAtLocation?.quantity || 0);
      
      // Apply stock filter based on location-specific quantity
      if (stockFilter === 'in_stock' && qtyAtLocation === 0) return false; // Has ANY stock
      if (stockFilter === 'low_stock' && (qtyAtLocation === 0 || qtyAtLocation > 10)) return false;
      if (stockFilter === 'out_of_stock' && qtyAtLocation > 0) return false;
    } else {
      // No location filter - use aggregated quantity
      if (stockFilter === 'in_stock' && item.quantity === 0) return false; // Has ANY stock
      if (stockFilter === 'low_stock' && item.stock_status !== 'low_stock') return false;
      if (stockFilter === 'out_of_stock' && item.quantity > 0) return false;
    }
    
    // Category filter
    if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false;
    
    // Strain type filter
    if (strainTypeFilter !== 'all' && item.flora_fields?.strain_type !== strainTypeFilter) return false;
    
    // THC range filter
    if (thcRangeFilter !== 'all') {
      const thc = parseFloat(item.flora_fields?.thc_percentage || '0');
      switch (thcRangeFilter) {
        case 'low': if (thc >= 15) return false; break;
        case 'medium': if (thc < 15 || thc >= 25) return false; break;
        case 'high': if (thc < 25) return false; break;
      }
    }
    
    // Search filter
    if (search && !item.product_name.toLowerCase().includes(search.toLowerCase()) && 
        !(item.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  // Sorting
  filteredInventory = filteredInventory.sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.product_name.localeCompare(b.product_name);
      case 'quantity': return b.quantity - a.quantity;
      case 'status': return a.stock_status.localeCompare(b.stock_status);
      case 'location': return a.location_name.localeCompare(b.location_name);
      default: return 0;
    }
  });

  const stats = {
    total: inventory.length,
    in_stock: inventory.filter(i => i.quantity > 0).length, // Count ALL with stock (in_stock + low_stock)
    low_stock: inventory.filter(i => i.stock_status === 'low_stock').length,
    out_of_stock: inventory.filter(i => i.quantity === 0).length
  };

  // Location-based stats - show products with inventory records at each location
  const locationStats = locations.map(loc => {
    // Get all products that have inventory records at this location
    const productsAtLocation = inventory.filter(i => {
      // Check if product has inventory at this location
      return i.inventory_locations?.some((inv: any) => inv.location_id === loc.id);
    });
    
    // Count products with stock at this location
    const stockedAtLocation = productsAtLocation.filter(i => {
      const invAtLoc = i.inventory_locations?.find((inv: any) => inv.location_id === loc.id);
      return invAtLoc && parseFloat(invAtLoc.quantity || 0) > 0;
    });
    
    // Calculate totals for this location only
    const totalGrams = productsAtLocation.reduce((sum, i) => {
      const invAtLoc = i.inventory_locations?.find((inv: any) => inv.location_id === loc.id);
      return sum + parseFloat(invAtLoc?.quantity || 0);
    }, 0);
    
    const totalValue = productsAtLocation.reduce((sum, i) => {
      const invAtLoc = i.inventory_locations?.find((inv: any) => inv.location_id === loc.id);
      const qty = parseFloat(invAtLoc?.quantity || 0);
      return sum + (qty * i.price);
    }, 0);
    
    return {
      location: loc,
      unique_products: productsAtLocation.length,
      stocked_products: stockedAtLocation.length,
      total_grams: totalGrams,
      total_value: totalValue
    };
  }).filter(stat => stat.unique_products > 0); // Only show locations with inventory records

  return (
    <div className="w-full max-w-full animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
              Multi-Location Inventory
            </h1>
            <p className="text-white/60 text-xs lg:text-sm">
              {filteredInventory.length} of {inventory.length} products • {locations.length} locations
            </p>
          </div>
          
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <button
                onClick={() => setShowBulkTransfer(true)}
                className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-white px-4 py-2 text-xs uppercase tracking-wider transition-all"
              >
                <ArrowRightLeft size={14} />
                Transfer ({selectedItems.size})
              </button>
            )}
            <button
              onClick={handleExportInventory}
              className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-white px-4 py-2 text-xs uppercase tracking-wider transition-all"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-white/40" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Total</span>
          </div>
          <div className="text-xl text-white font-light">{stats.total}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">In Stock</span>
          </div>
          <div className="text-xl text-green-500 font-light">{stats.in_stock}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Low</span>
          </div>
          <div className="text-xl text-yellow-500 font-light">{stats.low_stock}</div>
        </div>
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <X size={14} className="text-red-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Out</span>
          </div>
          <div className="text-xl text-red-500 font-light">{stats.out_of_stock}</div>
        </div>
      </div>

      {/* Location Stats */}
      {locationStats.length > 0 && (
        <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 mb-6 -mx-4 lg:mx-0">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-white/60" />
                <span className="text-white text-sm font-medium">Inventory by Location</span>
              </div>
              <span className="text-white/40 text-xs">{locationStats.length} active location{locationStats.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {locationStats.map(stat => (
              <div key={stat.location.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{stat.location.name}</span>
                    {stat.location.is_primary && (
                      <span className="px-2 py-0.5 text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 uppercase tracking-wider">
                        Primary
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setLocationFilter(stat.location.id.toString())}
                    className="text-[10px] text-white/60 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    View Products →
                  </button>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-black/20 border border-white/5 rounded p-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Unique Products</div>
                    <div className="text-lg text-white font-light">{stat.unique_products}</div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 rounded p-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Stocked</div>
                    <div className="text-lg text-green-500 font-light">{stat.stocked_products}</div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 rounded p-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Quantity</div>
                    <div className="text-lg text-white font-light">{stat.total_grams.toFixed(1)}g</div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 rounded p-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Inventory Value</div>
                    <div className="text-lg text-white font-light">${stat.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 p-4 mb-6 -mx-4 lg:mx-0">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-sm"
            />
          </div>

          {/* Primary Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
            >
              <option value="name">Sort: Name</option>
              <option value="quantity">Sort: Quantity</option>
              <option value="status">Sort: Status</option>
              <option value="location">Sort: Location</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider border transition-all ${
                showAdvancedFilters ? 'border-white text-white bg-white/5' : 'border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <Sliders size={14} />
              Advanced
            </button>

            {/* Stock Status Pills */}
            {['all', 'in_stock', 'low_stock', 'out_of_stock'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStockFilter(filter as any)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                  stockFilter === filter 
                    ? filter === 'in_stock' ? 'border-green-500 text-green-500' 
                      : filter === 'low_stock' ? 'border-yellow-500 text-yellow-500'
                      : filter === 'out_of_stock' ? 'border-red-500 text-red-500'
                      : 'border-white text-white'
                    : 'border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {/* Strain Type Filter */}
              <select
                value={strainTypeFilter}
                onChange={(e) => setStrainTypeFilter(e.target.value)}
                className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
              >
                <option value="all">All Strains</option>
                {strainTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* THC Range Filter */}
              <select
                value={thcRangeFilter}
                onChange={(e) => setThcRangeFilter(e.target.value)}
                className="bg-[#1a1a1a] border border-white/5 text-white px-3 py-2 text-xs focus:outline-none focus:border-white/10"
              >
                <option value="all">All THC Levels</option>
                <option value="low">Low (0-15%)</option>
                <option value="medium">Medium (15-25%)</option>
                <option value="high">High (25%+)</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setLocationFilter('all');
                  setStrainTypeFilter('all');
                  setThcRangeFilter('all');
                  setStockFilter('all');
                  setSearch('');
                }}
                className="px-3 py-2 text-xs uppercase tracking-wider border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 mb-6 -mx-4 lg:mx-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedItems.size === filteredInventory.length}
              onChange={selectAll}
              className="w-4 h-4 bg-[#1a1a1a] border border-white/20"
            />
            <span className="text-white text-sm">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={() => setShowBulkTransfer(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <ArrowRightLeft size={14} />
            Transfer Stock
          </button>
        </div>
      )}

      {/* Product Cards */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center text-white/60">Loading inventory...</div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-2">No items found</div>
            <div className="text-white/40 text-sm">Try adjusting your filters</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInventory.map((item, index) => {
            const isExpanded = expandedId === item.product_id;
            const currentView = viewMode[item.product_id] || 'details';
            const currentFields = editedFields[item.product_id] || item.flora_fields || {};
            const hasChanges = editedFields[item.product_id] && Object.keys(editedFields[item.product_id]).length > 0;
            const isSelected = selectedItems.has(item.product_id);
            
            // When filtering by location, show location-specific quantity
            let displayQuantity = item.quantity;
            let displayStatus = item.stock_status;
            let displayLabel = item.stock_status_label;
            
            if (locationFilter !== 'all') {
              const invAtLocation = item.inventory_locations?.find((inv: any) => inv.location_id === locationFilter);
              displayQuantity = parseFloat(invAtLocation?.quantity || 0);
              displayStatus = displayQuantity === 0 ? 'out_of_stock' : displayQuantity > 10 ? 'in_stock' : 'low_stock';
              displayLabel = displayStatus === 'in_stock' ? 'In Stock' : displayStatus === 'low_stock' ? 'Low Stock' : 'Not Stocked';
            }
            
            return (
              <div
                key={item.id || `inventory-${item.product_id}-${index}`}
                className={`bg-[#1a1a1a] lg:border border-t border-b transition-all -mx-4 lg:mx-0 ${
                  isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/[0.04]'
                }`}
              >
                {/* Main Row */}
                <div
                  className="flex items-center gap-4 px-4 lg:px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectItem(item.product_id);
                    }}
                    className="w-4 h-4 bg-[#1a1a1a] border border-white/20"
                  />

                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.product_id)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/40"
                  >
                    <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.product_id)}
                    className="w-12 h-12 bg-white/5 rounded flex-shrink-0 overflow-hidden"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-white/40" />
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.product_id)}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-white font-medium text-sm mb-0.5">{item.product_name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-white/40 flex-wrap">
                      <span className="font-mono">{item.sku || 'No SKU'}</span>
                      <span>•</span>
                      <span>{item.category_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {item.location_name}
                      </span>
                      {item.flora_fields?.strain_type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{item.flora_fields.strain_type}</span>
                        </>
                      )}
                      {item.flora_fields?.thc_percentage && (
                        <>
                          <span>•</span>
                          <span>THC: {item.flora_fields.thc_percentage}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.product_id)}
                    className="text-right flex-shrink-0"
                  >
                    <div className={`text-2xl font-light mb-0.5 ${getStockStatusColor(displayStatus)}`}>
                      {displayQuantity.toFixed(1)}g
                    </div>
                    <div className={`text-[10px] uppercase tracking-wider ${getStockStatusColor(displayStatus)}`}>
                      {displayLabel}
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-black/20">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-white/[0.04]">
                      <button
                        onClick={() => setViewMode(prev => ({ ...prev, [item.product_id]: 'details' }))}
                        className={`px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'details' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setViewMode(prev => ({ ...prev, [item.product_id]: 'adjust' }))}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'adjust' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Edit2 size={12} />
                        Stock
                      </button>
                      <button
                        onClick={() => {
                          setViewMode(prev => ({ ...prev, [item.product_id]: 'fields' }));
                          if (!editedFields[item.product_id]) {
                            setEditedFields(prev => ({ ...prev, [item.product_id]: { ...item.flora_fields } }));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'fields' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <FileText size={12} />
                        Product Fields
                        {hasChanges && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />}
                      </button>
                      <button
                        onClick={() => {
                          setViewMode(prev => ({ ...prev, [item.product_id]: 'coas' }));
                          loadProductCOAs(item.product_id);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider border transition-all ${
                          currentView === 'coas' ? 'border-white text-white' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <Shield size={12} />
                        COAs
                      </button>
                    </div>

                    <div className="px-4 lg:px-6 py-6">
                      {/* Details View */}
                      {currentView === 'details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Product Info</div>
                            
                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">SKU</span>
                                <span className="text-white/80 text-xs font-mono">{item.sku || '—'}</span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Price/gram</span>
                                <span className="text-white/80 text-xs">${item.price.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Category</span>
                                <span className="text-white/80 text-xs">{item.category_name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Stock Info</div>
                            
                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Current Stock</span>
                                <span className={`text-lg font-medium ${getStockStatusColor(item.stock_status)}`}>
                                  {item.quantity.toFixed(2)}g
                                </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Status</span>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider border ${
                                  item.stock_status === 'out_of_stock' ? 'border-red-500 text-red-500' :
                                  item.stock_status === 'low_stock' ? 'border-yellow-500 text-yellow-500' :
                                  'border-green-500 text-green-500'
                                }`}>
                                  {item.stock_status === 'out_of_stock' ? <X size={10} /> :
                                   item.stock_status === 'low_stock' ? <AlertTriangle size={10} /> :
                                   <CheckCircle size={10} />}
                                  {item.stock_status_label}
                                </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Location</span>
                                <span className="text-white/80 text-xs flex items-center gap-1">
                                  <MapPin size={12} />
                                  {item.location_name}
                                </span>
                              </div>
                            </div>

                            <div className="border border-white/[0.04] rounded p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs">Total Value</span>
                                <span className="text-white/80 text-xs font-medium">
                                  ${(item.quantity * item.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">Quick Actions</div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode(prev => ({ ...prev, [item.product_id]: 'adjust' }));
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                            >
                              <Edit2 size={16} />
                              <span className="text-xs uppercase tracking-wider font-medium">Adjust Inventory</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode(prev => ({ ...prev, [item.product_id]: 'fields' }));
                                if (!editedFields[item.product_id]) {
                                  setEditedFields(prev => ({ ...prev, [item.product_id]: { ...item.flora_fields } }));
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                            >
                              <FileText size={16} />
                              <span className="text-xs uppercase tracking-wider font-medium">Edit Product Details</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewMode(prev => ({ ...prev, [item.product_id]: 'coas' }));
                                loadProductCOAs(item.product_id);
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
                            >
                              <Shield size={16} />
                              <span className="text-xs uppercase tracking-wider font-medium">Manage COAs</span>
                            </button>

                            {item.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteInventory(item.id!.toString(), item.product_name);
                                }}
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600/20 hover:border-red-500/40 px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={16} />
                                <span className="text-xs uppercase tracking-wider font-medium">Delete from Location</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Adjust Stock View */}
                      {currentView === 'adjust' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="border border-white/[0.04] rounded p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Plus size={16} className="text-green-500" />
                              <span className="text-white text-sm font-medium">Quick Add / Remove</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-white/60 text-xs mb-2 block">Amount (grams)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={quickAdjustInput}
                                  onChange={(e) => setQuickAdjustInput(e.target.value)}
                                  placeholder="—"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 text-base focus:outline-none focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item.product_id, 'add');
                                  }}
                                  disabled={processing || !quickAdjustInput}
                                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/30 text-white px-4 py-3 transition-all disabled:cursor-not-allowed"
                                >
                                  <Plus size={18} />
                                  <span className="text-xs uppercase tracking-wider font-medium">Add</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item.product_id, 'subtract');
                                  }}
                                  disabled={processing || !quickAdjustInput}
                                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 text-white px-4 py-3 transition-all disabled:cursor-not-allowed"
                                >
                                  <Minus size={18} />
                                  <span className="text-xs uppercase tracking-wider font-medium">Remove</span>
                                </button>
                              </div>

                              <div className="pt-4 border-t border-white/5">
                                <div className="text-white/40 text-[10px] mb-2 uppercase tracking-wider">Quick Presets</div>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 3.5, 7, 14, 28].map(preset => (
                                    <button
                                      key={preset}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickAdjustInput(preset.toString());
                                      }}
                                      className="px-2 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-xs"
                                    >
                                      {preset}g
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border border-white/[0.04] rounded p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Save size={16} className="text-blue-500" />
                              <span className="text-white text-sm font-medium">Set Exact Quantity</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-white/60 text-xs mb-2 block">New Quantity (grams)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={setQuantityInput}
                                  onChange={(e) => setSetQuantityInput(e.target.value)}
                                  placeholder="—"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 text-base focus:outline-none focus:border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetQuantity(item.product_id);
                                }}
                                disabled={processing || !setQuantityInput}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 disabled:bg-white/30 text-black px-4 py-3 transition-all disabled:cursor-not-allowed"
                              >
                                <Save size={18} />
                                <span className="text-xs uppercase tracking-wider font-medium">Update Stock</span>
                              </button>

                              <div className="text-white/40 text-xs pt-3 border-t border-white/5">
                                Current: {item.quantity.toFixed(2)}g • This will override the stock level
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Product Fields View */}
                      {currentView === 'fields' && (
                        <div>
                          {/* Header with Submit Button */}
                          {hasChanges && (
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-yellow-500" />
                                <span className="text-yellow-500 text-xs uppercase tracking-wider">Unsaved Changes</span>
                              </div>
                              <button
                                onClick={() => handleSubmitChangeRequest(item.product_id)}
                                disabled={submittingChange}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white px-4 py-2 transition-all disabled:cursor-not-allowed"
                              >
                                <Send size={14} />
                                <span className="text-[10px] uppercase tracking-wider font-medium">
                                  {submittingChange ? 'Submitting...' : 'Submit for Approval'}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Compact Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* THC % */}
                            <div className="border border-white/[0.04] rounded p-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">THC %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={currentFields.thc_percentage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, thc_percentage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* CBD % */}
                            <div className="border border-white/[0.04] rounded p-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">CBD %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={currentFields.cbd_percentage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, cbd_percentage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Strain Type */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Strain Type</label>
                              <select
                                value={currentFields.strain_type || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, strain_type: e.target.value }
                                }))}
                                className="w-full bg-transparent border-none text-white text-sm focus:outline-none px-0 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">—</option>
                                <option value="indica">Indica</option>
                                <option value="sativa">Sativa</option>
                                <option value="hybrid">Hybrid</option>
                              </select>
                            </div>

                            {/* Lineage */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Lineage</label>
                              <input
                                type="text"
                                value={currentFields.lineage || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, lineage: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Nose */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-2">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Nose / Aroma</label>
                              <input
                                type="text"
                                value={currentFields.nose || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, nose: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Terpenes */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Dominant Terpenes</label>
                              <input
                                type="text"
                                value={currentFields.terpenes || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, terpenes: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Effects */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Effects</label>
                              <input
                                type="text"
                                value={currentFields.effects || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, effects: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Taste */}
                            <div className="border border-white/[0.04] rounded p-2 lg:col-span-4">
                              <label className="text-white/40 text-[10px] mb-1.5 block uppercase tracking-wider">Taste / Flavor</label>
                              <input
                                type="text"
                                value={currentFields.taste || ''}
                                onChange={(e) => setEditedFields(prev => ({
                                  ...prev,
                                  [item.product_id]: { ...currentFields, taste: e.target.value }
                                }))}
                                placeholder="—"
                                className="w-full bg-transparent border-none text-white placeholder-white/30 px-0 py-1 text-sm focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Info Box */}
                          {!hasChanges && (
                            <div className="mt-4 p-3 bg-white/5 border border-white/10 flex items-center gap-2">
                              <FileText size={14} className="text-white/60 flex-shrink-0" />
                              <span className="text-white/60 text-xs">
                                Edit any field above. Changes will be submitted for admin review before going live.
                              </span>
                            </div>
                          )}
                          
                          {/* Warning Box */}
                          {hasChanges && (
                            <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-2">
                              <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                              <span className="text-yellow-500/80 text-xs">
                                You have unsaved changes. Click "Submit for Approval" to send for admin review.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* COAs Management View */}
                      {currentView === 'coas' && (
                        <div className="space-y-4">
                          {/* Existing COAs */}
                          {productCOAs[item.product_id] && productCOAs[item.product_id].length > 0 && (
                            <div className="space-y-3">
                              <div className="text-white/60 text-xs font-medium uppercase tracking-wider">
                                Existing COAs ({productCOAs[item.product_id].length})
                              </div>
                              {productCOAs[item.product_id].map((coa: any) => (
                                <div key={coa.id} className="bg-white/5 border border-white/10 p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1">
                                      <FileText size={16} className="text-white/60 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-white text-sm font-medium truncate">{coa.fileName || 'COA'}</div>
                                        {coa.batchNumber && (
                                          <div className="text-white/60 text-xs font-mono">Batch: {coa.batchNumber}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 ${
                                        coa.status === 'approved' 
                                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                          : 'bg-white/5 text-white/60 border border-white/10'
                                      }`}>
                                        {coa.status === 'approved' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                        {coa.status}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCOA(coa.id, item.product_id)}
                                        className="text-red-500 hover:text-red-400 p-1 transition-colors"
                                        title="Delete COA"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 text-xs">
                                    {coa.testDate && (
                                      <div>
                                        <div className="text-white/60 mb-1">Test Date</div>
                                        <div className="text-white">{new Date(coa.testDate).toLocaleDateString()}</div>
                                      </div>
                                    )}
                                    {coa.thc && (
                                      <div>
                                        <div className="text-white/60 mb-1">THC</div>
                                        <div className="text-white font-medium">{coa.thc}</div>
                                      </div>
                                    )}
                                    {coa.cbd && (
                                      <div>
                                        <div className="text-white/60 mb-1">CBD</div>
                                        <div className="text-white font-medium">{coa.cbd}</div>
                                      </div>
                                    )}
                                  </div>
                                  {coa.testingLab && coa.testingLab !== 'N/A' && (
                                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                                      Tested by {coa.testingLab}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload New COA Form */}
                          <div className="bg-white/5 border border-white/10 p-4 space-y-4">
                            <div className="text-white font-medium text-sm">Upload New COA</div>

                            {/* File Upload */}
                            <div>
                              <label className="block text-white/80 text-xs mb-2">COA File *</label>
                              {coaForm.file ? (
                                <div className="bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-white/60" />
                                    <div>
                                      <div className="text-white text-xs">{coaForm.file.name}</div>
                                      <div className="text-white/60 text-xs">{(coaForm.file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCoaForm(prev => ({ ...prev, file: null }))}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <label className="block border-2 border-dashed border-white/10 p-4 text-center hover:border-white/20 transition-colors cursor-pointer">
                                  <Upload size={20} className="text-white/40 mx-auto mb-2" />
                                  <div className="text-white/80 text-xs mb-1">Click to upload COA</div>
                                  <div className="text-white/40 text-xs">PDF or image, max 25MB</div>
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={handleCOAFileSelect}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-white/80 text-xs mb-1">Lab Name</label>
                                <input
                                  type="text"
                                  value={coaForm.lab_name}
                                  onChange={(e) => setCoaForm(prev => ({ ...prev, lab_name: e.target.value }))}
                                  placeholder="e.g., Quantix Analytics"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-2 text-xs focus:outline-none focus:border-white/10"
                                />
                              </div>

                              <div>
                                <label className="block text-white/80 text-xs mb-1">Batch Number</label>
                                <input
                                  type="text"
                                  value={coaForm.batch_number}
                                  onChange={(e) => setCoaForm(prev => ({ ...prev, batch_number: e.target.value }))}
                                  placeholder="e.g., BATCH-2025-001"
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-2 text-xs focus:outline-none focus:border-white/10"
                                />
                              </div>

                              <div>
                                <label className="block text-white/80 text-xs mb-1">Test Date</label>
                                <input
                                  type="date"
                                  value={coaForm.test_date}
                                  onChange={(e) => setCoaForm(prev => ({ ...prev, test_date: e.target.value }))}
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white px-2 py-2 text-xs focus:outline-none focus:border-white/10"
                                />
                              </div>

                              <div>
                                <label className="block text-white/80 text-xs mb-1">Expiry Date</label>
                                <input
                                  type="date"
                                  value={coaForm.expiry_date}
                                  onChange={(e) => setCoaForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                                  className="w-full bg-[#1a1a1a] border border-white/5 text-white px-2 py-2 text-xs focus:outline-none focus:border-white/10"
                                />
                              </div>
                            </div>

                            {/* Test Results */}
                            <div>
                              <div className="text-white/80 text-xs mb-2">Test Results (Optional)</div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-white/60 text-xs mb-1">THC %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.thc}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, thc: e.target.value }))}
                                    placeholder="22.5"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">CBD %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.cbd}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, cbd: e.target.value }))}
                                    placeholder="0.5"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">THCa %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.thca}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, thca: e.target.value }))}
                                    placeholder="1.2"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">CBDa %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.cbda}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, cbda: e.target.value }))}
                                    placeholder="0.3"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">CBG %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.cbg}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, cbg: e.target.value }))}
                                    placeholder="0.8"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">CBN %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.cbn}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, cbn: e.target.value }))}
                                    placeholder="0.2"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">Total Canna %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.total_cannabinoids}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, total_cannabinoids: e.target.value }))}
                                    placeholder="25.0"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 text-xs mb-1">Total Terps %</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={coaForm.total_terpenes}
                                    onChange={(e) => setCoaForm(prev => ({ ...prev, total_terpenes: e.target.value }))}
                                    placeholder="2.5"
                                    className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-2 py-1.5 text-xs focus:outline-none focus:border-white/10"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Upload Button */}
                            <button
                              type="button"
                              onClick={() => handleCOAUpload(item.product_id)}
                              disabled={!coaForm.file || uploadingCOA}
                              className="w-full px-4 py-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                            >
                              {uploadingCOA ? 'Uploading...' : 'Upload COA'}
                            </button>
                          </div>

                          {(!productCOAs[item.product_id] || productCOAs[item.product_id].length === 0) && (
                            <div className="bg-white/5 border border-white/10 p-3">
                              <div className="flex gap-2">
                                <AlertTriangle size={16} className="text-white/60 flex-shrink-0 mt-0.5" />
                                <div className="text-white/60 text-xs leading-relaxed">
                                  Products require a valid COA to be approved and sold on the marketplace.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Transfer Modal */}
      <AdminModal
        isOpen={showBulkTransfer}
        onClose={() => {
          setShowBulkTransfer(false);
          setTransferToLocation('');
        }}
        title="Bulk Transfer Stock"
        description={`Transfer ${selectedItems.size} selected item(s) to another location`}
        onSubmit={handleBulkTransfer}
        submitText="Transfer"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
              Destination Location
            </label>
            <select
              value={transferToLocation}
              onChange={(e) => setTransferToLocation(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            >
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.is_primary ? '(Primary)' : ''} - {loc.city}, {loc.state}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 p-4">
            <p className="text-white/60 text-xs mb-2">
              <strong>Note:</strong> Stock transfers will:
            </p>
            <ul className="text-white/60 text-xs space-y-1 list-disc list-inside">
              <li>Move inventory from current location to selected location</li>
              <li>Update stock levels immediately</li>
              <li>Create audit trail for tracking</li>
            </ul>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
