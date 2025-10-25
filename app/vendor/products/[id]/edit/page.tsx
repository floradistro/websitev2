"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Save, AlertCircle, FileText, CheckCircle, Plus, Trash2, Download } from 'lucide-react';
import Link from 'next/link';

interface COA {
  id: string;
  file_name: string;
  file_url: string;
  lab_name: string | null;
  test_date: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  test_results: any;
  is_verified: boolean;
  upload_date: string;
}

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCOA, setUploadingCOA] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coas, setCoas] = useState<COA[]>([]);
  const [showCOAForm, setShowCOAForm] = useState(false);
  const [showCoaLibrary, setShowCoaLibrary] = useState(false);
  const [coaLibrary, setCoaLibrary] = useState<any[]>([]);
  
  const [coaForm, setCoaForm] = useState({
    file: null as File | null,
    product_name_on_coa: '',
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
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost_price: '',  // ← ADD COST TRACKING
    thc_percentage: '',
    cbd_percentage: '',
    strain_type: '',
    lineage: '',
    terpenes: '',
    effects: '',
    quantity: '',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
  });

  useEffect(() => {
    loadProductAndCOAs();
  }, [productId]);

  async function loadProductAndCOAs() {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) {
        router.push('/vendor/login');
        return;
      }

      // Fetch product data
      const productRes = await fetch(`/api/supabase/products/${productId}`);
      const productData = await productRes.json();
      
      if (productData.success && productData.product) {
        const p = productData.product;
        setProduct({
          name: p.name || '',
          description: p.description || '',
          category: p.primary_category_id || '',
          price: p.price || p.regular_price || '',
          cost_price: p.cost_price || '',  // ← LOAD COST PRICE
          thc_percentage: p.meta_data?.thc_percentage || '',
          cbd_percentage: p.meta_data?.cbd_percentage || '',
          strain_type: p.meta_data?.strain_type || '',
          lineage: p.meta_data?.lineage || '',
          terpenes: p.meta_data?.terpenes || '',
          effects: p.meta_data?.effects || '',
          quantity: p.stock_quantity || '',
          status: p.status === 'published' ? 'approved' : 'pending',
        });
      }

      // Fetch COAs
      const coasRes = await fetch(`/api/vendor/coas?product_id=${productId}`, {
        headers: {
          'x-vendor-id': vendorId
        }
      });
      const coasData = await coasRes.json();
      
      if (coasData.success) {
        // Filter COAs for this specific product
        const productCOAs = coasData.coas.filter((coa: any) => coa.productId === productId);
        setCoas(productCOAs);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading product:', error);
      setLoading(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCOAFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoaForm(prev => ({ ...prev, file }));
    }
  };

  const handleCOAUpload = async () => {
    if (!coaForm.file) {
      alert('Please select a file');
      return;
    }

    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) {
      alert('Not authenticated');
      return;
    }

    setUploadingCOA(true);

    try {
      const formData = new FormData();
      formData.append('file', coaForm.file);
      formData.append('product_id', productId);
      formData.append('product_name_on_coa', coaForm.product_name_on_coa);
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

      const response = await fetch('/api/vendor/coas', {
        method: 'POST',
        headers: {
          'x-vendor-id': vendorId
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('COA uploaded successfully!');
        setShowCOAForm(false);
        setCoaForm({
          file: null,
          product_name_on_coa: '',
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
        loadProductAndCOAs(); // Reload to show new COA
      } else {
        alert('Failed to upload COA: ' + data.error);
      }
    } catch (error) {
      console.error('COA upload error:', error);
      alert('Failed to upload COA');
    } finally {
      setUploadingCOA(false);
    }
  };

  const handleDeleteCOA = async (coaId: string) => {
    if (!confirm('Are you sure you want to delete this COA?')) return;

    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) return;

    try {
      const response = await fetch(`/api/vendor/coas?id=${coaId}`, {
        method: 'DELETE',
        headers: {
          'x-vendor-id': vendorId
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('COA deleted successfully');
        loadProductAndCOAs();
      } else {
        alert('Failed to delete COA: ' + data.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete COA');
    }
  };

  const loadCoaLibrary = async () => {
    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) return;
    
    try {
      const response = await fetch('/api/vendor/coas', {
        headers: { 'x-vendor-id': vendorId }
      });
      
      const data = await response.json();
      if (data.success) {
        setCoaLibrary(data.coas);
      }
    } catch (error) {
      console.error('Error loading COA library:', error);
    }
  };

  const handleAssignExistingCOA = async (coaId: string) => {
    const vendorId = localStorage.getItem('vendor_id');
    if (!vendorId) return;

    try {
      const response = await fetch(`/api/vendor/coas?id=${coaId}`, {
        method: 'PUT',
        headers: {
          'x-vendor-id': vendorId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId })
      });

      const data = await response.json();

      if (data.success) {
        alert('COA assigned successfully!');
        setShowCoaLibrary(false);
        loadProductAndCOAs();
      } else {
        alert('Failed to assign COA: ' + data.error);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Failed to assign COA');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      const updateData = {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        cost_price: product.cost_price || null,  // ← INCLUDE COST PRICE
        thc_percentage: product.thc_percentage,
        cbd_percentage: product.cbd_percentage,
        strain_type: product.strain_type,
        lineage: product.lineage,
        terpenes: product.terpenes,
        effects: product.effects,
        quantity: product.quantity,
      };

      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId || ''
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Product updated successfully!');
        router.push('/vendor/products');
      } else {
        alert(data.error || 'Failed to update product');
        setSaving(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:max-w-4xl lg:mx-auto px-4 lg:px-0 py-6 lg:py-0">
        <div className="bg-black lg:border border-white/5 p-12 text-center text-white/60">
          Loading product...
        </div>
      </div>
    );
  }

  return (
    <div className="lg:max-w-4xl lg:mx-auto animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
          Edit Product
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          {product.status === 'approved' 
            ? 'Editing will create a change request for admin approval' 
            : 'Update and resubmit for review'}
        </p>
      </div>

      {/* Status Notices */}
      {product.status === 'rejected' && (
        <div className="mb-6 bg-red-500/5 lg:border border-t border-b border-red-500/10 p-4 -mx-4 lg:mx-0">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <div className="text-red-500 text-sm font-medium mb-1">Product Rejected</div>
              <div className="text-white/60 text-xs">
                This product was rejected by admin. Please address the issues noted and resubmit.
              </div>
            </div>
          </div>
        </div>
      )}

      {product.status === 'pending' && (
        <div className="mb-6 bg-white/5 lg:border border-t border-b border-white/10 p-4 -mx-4 lg:mx-0">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-white/60 flex-shrink-0" />
            <div>
              <div className="text-white text-sm font-medium mb-1">Pending Review</div>
              <div className="text-white/60 text-xs">
                This product is currently under review by our team.
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-0 lg:space-y-6">
        {/* Basic Information */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={product.name}
                onChange={(e) => setProduct({...product, name: e.target.value})}
                placeholder="e.g., Blue Dream"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={product.description}
                onChange={(e) => setProduct({...product, description: e.target.value})}
                placeholder="Describe your product..."
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors resize-none text-base"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={product.category}
                onChange={(e) => setProduct({...product, category: e.target.value})}
                className="w-full bg-black border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              >
                <option value="">Select category</option>
                <option value="Flower">Flower</option>
                <option value="Concentrate">Concentrate</option>
                <option value="Edibles">Edibles</option>
                <option value="Vape">Vape</option>
              </select>
            </div>

            {/* COST PRICE (Vendor Private) */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Cost Price (Your Cost)
                <span className="ml-2 text-white/40 text-xs">🔒 Private</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={product.cost_price}
                  onChange={(e) => setProduct({...product, cost_price: e.target.value})}
                  placeholder="10.00"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded-[14px] focus:outline-none focus:border-white/20 text-base"
                />
              </div>
              <p className="text-white/40 text-xs mt-1">
                Your cost per unit (not visible to customers)
              </p>
            </div>

            {/* SELLING PRICE */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Selling Price (per gram) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={product.price}
                  onChange={(e) => setProduct({...product, price: e.target.value})}
                  placeholder="14.99"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded-[14px] focus:outline-none focus:border-white/20 text-base"
                />
              </div>
              
              {/* MARGIN CALCULATION */}
              {product.cost_price && product.price && parseFloat(product.cost_price) > 0 && parseFloat(product.price) > 0 && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className={`font-medium ${
                    ((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.price) * 100) >= 40 
                      ? 'text-green-400' 
                      : ((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.price) * 100) >= 25 
                      ? 'text-yellow-400' 
                      : 'text-red-400'
                  }`}>
                    Margin: {((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.price) * 100).toFixed(1)}%
                  </span>
                  <span className="text-white/40">|</span>
                  <span className="text-green-400">
                    Profit: ${(parseFloat(product.price) - parseFloat(product.cost_price)).toFixed(2)}/unit
                  </span>
                  {product.quantity && parseFloat(product.quantity) > 0 && (
                    <>
                      <span className="text-white/40">|</span>
                      <span className="text-blue-400">
                        Total Value: ${((parseFloat(product.price) - parseFloat(product.cost_price)) * parseFloat(product.quantity)).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lab Results / COA */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-medium">Certificates of Analysis (COA)</h2>
            <Link 
              href="/vendor/lab-results"
              className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors"
            >
              View All COAs
            </Link>
          </div>

          {/* Existing COAs */}
          {coas.length > 0 && (
            <div className="space-y-3 mb-4">
            {coas.map((coa) => (
              <div key={coa.id} className="bg-white/5 border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-white/60" />
                    <div>
                      <div className="text-white text-sm font-medium">{coa.file_name}</div>
                      {coa.batch_number && (
                        <div className="text-white/60 text-xs font-mono">Batch: {coa.batch_number}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 ${
                      coa.is_verified 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-white/5 text-white/60 border border-white/10'
                    }`}>
                      {coa.is_verified ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {coa.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    <a
                      href={coa.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white p-1 transition-colors"
                      title="View COA"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteCOA(coa.id)}
                      className="text-red-500 hover:text-red-400 p-1"
                      title="Delete COA"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {coa.test_date && (
                      <div>
                        <div className="text-white/60 mb-1">Test Date</div>
                        <div className="text-white">{new Date(coa.test_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {coa.test_results?.thc && (
                      <div>
                        <div className="text-white/60 mb-1">THC</div>
                        <div className="text-white font-medium">{coa.test_results.thc}%</div>
                      </div>
                    )}
                    {coa.test_results?.cbd && (
                      <div>
                        <div className="text-white/60 mb-1">CBD</div>
                        <div className="text-white font-medium">{coa.test_results.cbd}%</div>
                      </div>
                    )}
                  </div>
                  {coa.lab_name && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                      Tested by {coa.lab_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Select from Library or Upload New COA */}
          {!showCOAForm && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCoaLibrary(true);
                  loadCoaLibrary();
                }}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
              >
                <FileText size={18} />
                <span className="text-sm">Select from Library</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCOAForm(true)}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-3 transition-all"
              >
                <Plus size={18} />
                <span className="text-sm">Upload New COA</span>
              </button>
            </div>
          )}

          {/* COA Upload Form */}
          {showCOAForm && (
            <div className="bg-white/5 border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium text-sm">Upload COA Details</h3>
                <button
                  type="button"
                  onClick={() => setShowCOAForm(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-white/80 text-sm mb-2">COA File *</label>
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
                  <label className="block border-2 border-dashed border-white/10 p-6 text-center hover:border-white/20 transition-colors cursor-pointer">
                    <Upload size={24} className="text-white/40 mx-auto mb-2" />
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

              <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-white/80 text-sm mb-2">Product Name on COA</label>
                <input
                  type="text"
                  value={coaForm.product_name_on_coa}
                  onChange={(e) => setCoaForm(prev => ({ ...prev, product_name_on_coa: e.target.value }))}
                  placeholder="e.g., Blue Dream (as written on COA)"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Lab Name</label>
                <input
                  type="text"
                  value={coaForm.lab_name}
                  onChange={(e) => setCoaForm(prev => ({ ...prev, lab_name: e.target.value }))}
                  placeholder="e.g., Quantix Analytics"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Batch Number</label>
                <input
                  type="text"
                  value={coaForm.batch_number}
                  onChange={(e) => setCoaForm(prev => ({ ...prev, batch_number: e.target.value }))}
                  placeholder="e.g., BATCH-2025-001"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                />
              </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Test Date</label>
                  <input
                    type="date"
                    value={coaForm.test_date}
                    onChange={(e) => setCoaForm(prev => ({ ...prev, test_date: e.target.value }))}
                    className="w-full bg-black border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={coaForm.expiry_date}
                    onChange={(e) => setCoaForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full bg-black border border-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/10"
                  />
                </div>
              </div>

              {/* Test Results */}
              <div>
                <div className="text-white/80 text-sm mb-3">Test Results (Optional)</div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-white/60 text-xs mb-1">THC %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={coaForm.thc}
                      onChange={(e) => setCoaForm(prev => ({ ...prev, thc: e.target.value }))}
                      placeholder="22.5"
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
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
                      className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-2 py-2 text-sm focus:outline-none focus:border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCOAForm(false)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCOAUpload}
                  disabled={!coaForm.file || uploadingCOA}
                  className="flex-1 px-4 py-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                >
                  {uploadingCOA ? 'Uploading...' : 'Upload COA'}
                </button>
              </div>
            </div>
          )}

          {coas.length === 0 && !showCOAForm && (
            <div className="mt-4 bg-white/5 border border-white/10 p-3">
              <div className="flex gap-2">
                <AlertCircle size={16} className="text-white/60 flex-shrink-0 mt-0.5" />
                <div className="text-white/60 text-xs leading-relaxed">
                  Products require a valid COA to be approved and sold on the marketplace.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strain Details */}
        <div className="bg-black lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Strain Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">THC Percentage</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={product.thc_percentage}
                  onChange={(e) => setProduct({...product, thc_percentage: e.target.value})}
                  placeholder="24.5"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">CBD Percentage</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={product.cbd_percentage}
                  onChange={(e) => setProduct({...product, cbd_percentage: e.target.value})}
                  placeholder="0.5"
                  className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Strain Type</label>
              <select
                value={product.strain_type}
                onChange={(e) => setProduct({...product, strain_type: e.target.value})}
                className="w-full bg-black border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              >
                <option value="">Select type</option>
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Current Quantity (grams)</label>
              <input
                type="number"
                step="0.1"
                value={product.quantity}
                onChange={(e) => setProduct({...product, quantity: e.target.value})}
                placeholder="100"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
                disabled={product.status === 'approved'}
              />
              {product.status === 'approved' && (
                <p className="text-white/40 text-xs mt-1">Use Inventory page to adjust stock</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">Lineage / Genetics</label>
              <input
                type="text"
                value={product.lineage}
                onChange={(e) => setProduct({...product, lineage: e.target.value})}
                placeholder="e.g., Blueberry × Haze"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">Dominant Terpenes</label>
              <input
                type="text"
                value={product.terpenes}
                onChange={(e) => setProduct({...product, terpenes: e.target.value})}
                placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">Effects</label>
              <input
                type="text"
                value={product.effects}
                onChange={(e) => setProduct({...product, effects: e.target.value})}
                placeholder="e.g., Relaxed, Creative, Euphoric"
                className="w-full bg-black border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 lg:gap-4 px-4 lg:px-0 py-6 lg:py-0 border-t lg:border-t-0 border-white/5 -mx-4 lg:mx-0">
          <Link
            href="/vendor/products"
            className="w-full lg:w-auto text-center px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="group flex items-center justify-center gap-2 w-full lg:w-auto px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />
            {saving ? 'Saving...' : product.status === 'approved' ? 'Submit Change Request' : 'Save & Resubmit'}
          </button>
        </div>
      </form>

      {/* COA Library Modal */}
      {showCoaLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCoaLibrary(false)}>
          <div className="bg-black border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-white/5 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-light text-white mb-1">Select COA from Library</h2>
                  <p className="text-white/60 text-sm">Choose an existing Certificate of Analysis to assign to this product</p>
                </div>
                <button
                  onClick={() => setShowCoaLibrary(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* COA List */}
            <div className="p-6">
              <div className="space-y-3">
                {coaLibrary.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    <div className="text-sm">No COAs in your library yet</div>
                    <div className="text-xs mt-1">Upload your first COA to get started</div>
                  </div>
                ) : (
                  coaLibrary.map((coa) => (
                    <div key={coa.id} className="bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText size={16} className="text-white/60 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-medium truncate">{coa.fileName || 'COA'}</div>
                            {coa.productNameOnCoa && (
                              <div className="text-white/80 text-xs font-medium">COA Product: {coa.productNameOnCoa}</div>
                            )}
                            <div className="text-white/60 text-xs">
                              {coa.productName && <span>Assigned to: {coa.productName}</span>}
                              {!coa.productName && <span>Not assigned to product</span>}
                            </div>
                            {coa.batchNumber && (
                              <div className="text-white/60 text-xs font-mono">Batch: {coa.batchNumber}</div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssignExistingCOA(coa.id)}
                          className="px-3 py-1.5 bg-white text-black hover:bg-white/90 text-xs font-medium uppercase tracking-wider transition-all"
                        >
                          Select
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-xs">
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
                        {coa.testingLab && coa.testingLab !== 'N/A' && (
                          <div>
                            <div className="text-white/60 mb-1">Lab</div>
                            <div className="text-white truncate">{coa.testingLab}</div>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider inline-flex items-center gap-1 ${
                          coa.status === 'approved' 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-white/5 text-white/60 border border-white/10'
                        }`}>
                          {coa.status === 'approved' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {coa.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
