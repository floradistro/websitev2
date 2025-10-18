"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Save, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coaFile, setCoAFile] = useState<File | null>(null);
  const [existingCOA, setExistingCOA] = useState<any>(null);
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
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
    // TODO: Fetch actual product from API
    // Mock data based on product ID
    setTimeout(() => {
      const mockProducts: any = {
        '50001': {
          name: 'OG Kush',
          description: 'The legendary OG Kush from the California coast. This classic strain delivers heavy relaxation with its signature pine and lemon aroma.',
          category: 'flower',
          price: '15.99',
          thc_percentage: '22.8',
          cbd_percentage: '0.3',
          strain_type: 'hybrid',
          lineage: 'Chemdawg × Lemon Thai × Pakistani Kush',
          terpenes: 'β-Caryophyllene, Limonene, Myrcene',
          effects: 'Relaxed, Happy, Euphoric, Uplifted',
          quantity: '156.75',
          status: 'approved' as const,
        },
        '50002': {
          name: 'Blue Dream',
          description: 'West Coast staple Blue Dream balances full-body relaxation with gentle cerebral invigoration. Sweet berry aroma with smooth smoke.',
          category: 'flower',
          price: '14.99',
          thc_percentage: '19.2',
          cbd_percentage: '0.8',
          strain_type: 'hybrid',
          lineage: 'Blueberry × Haze',
          terpenes: 'Myrcene, Pinene, Caryophyllene',
          effects: 'Creative, Uplifted, Relaxed, Focused',
          quantity: '203.5',
          status: 'approved' as const,
        },
        '50003': {
          name: 'Sour Diesel',
          description: 'Iconic East Coast Sour Diesel with pungent diesel aroma and energizing sativa effects. Perfect for daytime use.',
          category: 'flower',
          price: '16.99',
          thc_percentage: '23.4',
          cbd_percentage: '0.2',
          strain_type: 'sativa',
          lineage: 'Chemdawg 91 × Super Skunk',
          terpenes: 'Caryophyllene, Limonene, Myrcene',
          effects: 'Energetic, Uplifted, Creative, Focused',
          quantity: '127.25',
          status: 'approved' as const,
        },
        '50004': {
          name: 'Girl Scout Cookies',
          description: 'The famous GSC (formerly Girl Scout Cookies) offers a sweet and earthy aroma with powerful euphoric effects.',
          category: 'flower',
          price: '17.99',
          thc_percentage: '25.1',
          cbd_percentage: '0.4',
          strain_type: 'hybrid',
          lineage: 'OG Kush × Durban Poison',
          terpenes: 'Caryophyllene, Limonene, Humulene',
          effects: 'Euphoric, Happy, Relaxed, Creative',
          quantity: '145.0',
          status: 'approved' as const,
        },
        '50005': {
          name: 'Gelato',
          description: 'Premium Gelato with its signature sweet and fruity flavor profile. Dense, frosty buds with vibrant purple hues.',
          category: 'flower',
          price: '18.99',
          thc_percentage: '21.6',
          cbd_percentage: '0.4',
          strain_type: 'hybrid',
          lineage: 'Sunset Sherbet × Thin Mint Cookies',
          terpenes: 'Limonene, Caryophyllene, Humulene',
          effects: 'Relaxed, Happy, Euphoric, Uplifted',
          quantity: '98.5',
          status: 'approved' as const,
        },
        '50010': {
          name: 'Durban Poison',
          description: 'Pure South African sativa with sweet, piney aroma. Energizing and clear-headed effects perfect for productivity.',
          category: 'flower',
          price: '16.99',
          thc_percentage: '24.5',
          cbd_percentage: '0.2',
          strain_type: 'sativa',
          lineage: 'South African Landrace',
          terpenes: 'Terpinolene, Myrcene, Ocimene',
          effects: 'Energetic, Uplifted, Focused, Creative',
          quantity: '0',
          status: 'pending' as const,
        },
      };

      const data = mockProducts[productId as string] || mockProducts['50001'];
      setProduct(data);
      
      // Mock existing COA for approved products
      if (data.status === 'approved') {
        const coaData: any = {
          '50001': { coaNumber: 'COA-2025-001547', thc: '22.8%', cbd: '0.3%' },
          '50002': { coaNumber: 'COA-2025-001548', thc: '19.2%', cbd: '0.8%' },
          '50003': { coaNumber: 'COA-2025-001549', thc: '23.4%', cbd: '0.2%' },
          '50004': { coaNumber: 'COA-2025-001550', thc: '25.1%', cbd: '0.4%' },
          '50005': { coaNumber: 'COA-2025-001551', thc: '21.6%', cbd: '0.4%' },
        };
        
        if (coaData[productId as string]) {
          setExistingCOA({
            ...coaData[productId as string],
            testDate: '2025-10-15',
            status: 'approved',
            lab: 'Quantix Analytics'
          });
        }
      }
      
      setLoading(false);
    }, 1000);
  }, [productId]);

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

  const handleCOAUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoAFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // TODO: Submit to API as change request
    console.log('Submitting change request for product:', productId, product, images, coaFile);
    
    setTimeout(() => {
      setSaving(false);
      router.push('/vendor/products');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center text-white/60">
          Loading product...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Edit Product
        </h1>
        <p className="text-white/60 text-sm">
          {product.status === 'approved' 
            ? 'Editing will create a change request for admin approval' 
            : 'Update and resubmit for review'}
        </p>
      </div>

      {/* Status Notice */}
      {product.status === 'rejected' && (
        <div className="mb-6 bg-red-500/5 border border-red-500/10 p-4">
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
        <div className="mb-6 bg-yellow-500/5 border border-yellow-500/10 p-4">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-yellow-500 flex-shrink-0" />
            <div>
              <div className="text-yellow-500 text-sm font-medium mb-1">Pending Review</div>
              <div className="text-white/60 text-xs">
                This product is currently under review by our team.
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white font-medium mb-6">Basic Information</h2>
          
          <div className="space-y-4">
            {/* Product Name */}
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            {/* Description */}
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={product.category}
                onChange={(e) => setProduct({...product, category: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              >
                <option value="">Select category</option>
                <option value="flower">Flower</option>
                <option value="concentrates">Concentrates</option>
                <option value="edibles">Edibles</option>
                <option value="vapes">Vapes</option>
                <option value="beverages">Beverages</option>
              </select>
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Base Price (per gram) <span className="text-red-500">*</span>
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
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white font-medium mb-6">Product Images</h2>
          
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square bg-white/5 rounded overflow-hidden group">
                    <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="block">
              <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-[#1a1a1a]">
                <Upload size={32} className="text-white/40 mx-auto mb-3" />
                <div className="text-white/80 text-sm mb-1">Click to upload new images</div>
                <div className="text-white/40 text-xs">PNG, JPG up to 10MB</div>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Lab Results / COA */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-medium">Certificate of Analysis (COA)</h2>
            <Link 
              href="/vendor/lab-results"
              className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors"
            >
              View All COAs
            </Link>
          </div>

          {/* Existing COA */}
          {existingCOA && (
            <div className="mb-4 bg-white/5 border border-white/10 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-green-500" />
                  <div>
                    <div className="text-white text-sm font-medium">Current COA</div>
                    <div className="text-white/60 text-xs font-mono">{existingCOA.coaNumber}</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 inline-flex items-center gap-1">
                  <CheckCircle size={12} />
                  {existingCOA.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-white/60 mb-1">Test Date</div>
                  <div className="text-white">{new Date(existingCOA.testDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-white/60 mb-1">THC</div>
                  <div className="text-white font-medium">{existingCOA.thc}</div>
                </div>
                <div>
                  <div className="text-white/60 mb-1">CBD</div>
                  <div className="text-white font-medium">{existingCOA.cbd}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                Tested by {existingCOA.lab}
              </div>
            </div>
          )}

          {/* Upload New COA */}
          <div>
            <label className="block text-white/80 text-sm mb-3">
              {existingCOA ? 'Upload Updated COA (New Batch)' : 'Upload COA'}
            </label>
            
            {coaFile ? (
              <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-white/60" />
                  <div>
                    <div className="text-white text-sm">{coaFile.name}</div>
                    <div className="text-white/60 text-xs">{(coaFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCoAFile(null)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-[#1a1a1a]">
                  <Upload size={32} className="text-white/40 mx-auto mb-3" />
                  <div className="text-white/80 text-sm mb-1">Upload Certificate of Analysis</div>
                  <div className="text-white/40 text-xs">PDF format, max 5MB</div>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCOAUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {!existingCOA && !coaFile && (
            <div className="mt-4 bg-yellow-500/5 border border-yellow-500/10 p-3">
              <div className="flex gap-2">
                <AlertCircle size={16} className="text-yellow-500/80 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-500/80 text-xs leading-relaxed">
                  Products require a valid COA to be approved and sold on the marketplace.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strain Details */}
        <div className="bg-[#1a1a1a] border border-white/5 p-6">
          <h2 className="text-white font-medium mb-6">Strain Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* THC % */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                THC Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={product.thc_percentage}
                  onChange={(e) => setProduct({...product, thc_percentage: e.target.value})}
                  placeholder="24.5"
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            {/* CBD % */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                CBD Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={product.cbd_percentage}
                  onChange={(e) => setProduct({...product, cbd_percentage: e.target.value})}
                  placeholder="0.5"
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            {/* Strain Type */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Strain Type
              </label>
              <select
                value={product.strain_type}
                onChange={(e) => setProduct({...product, strain_type: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              >
                <option value="">Select type</option>
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Current Quantity */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Current Quantity (grams)
              </label>
              <input
                type="number"
                step="0.1"
                value={product.quantity}
                onChange={(e) => setProduct({...product, quantity: e.target.value})}
                placeholder="100"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
                disabled={product.status === 'approved'}
              />
              {product.status === 'approved' && (
                <p className="text-white/40 text-xs mt-1">Use Inventory page to adjust stock</p>
              )}
            </div>

            {/* Lineage */}
            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Lineage / Genetics
              </label>
              <input
                type="text"
                value={product.lineage}
                onChange={(e) => setProduct({...product, lineage: e.target.value})}
                placeholder="e.g., Blueberry × Haze"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            {/* Terpenes */}
            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Dominant Terpenes
              </label>
              <input
                type="text"
                value={product.terpenes}
                onChange={(e) => setProduct({...product, terpenes: e.target.value})}
                placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            {/* Effects */}
            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Effects
              </label>
              <input
                type="text"
                value={product.effects}
                onChange={(e) => setProduct({...product, effects: e.target.value})}
                placeholder="e.g., Relaxed, Creative, Euphoric"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/vendor/products"
            className="px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="group flex items-center gap-2 px-6 py-3 bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white/20 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />
            {saving ? 'Saving...' : product.status === 'approved' ? 'Submit Change Request' : 'Save & Resubmit'}
          </button>
        </div>
      </form>
    </div>
  );
}

