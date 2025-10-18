"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
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
    initial_quantity: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Convert files to data URLs for preview
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Submit to API
    console.log('Submitting product:', formData, images);
    
    setTimeout(() => {
      setLoading(false);
      router.push('/vendor/products');
    }, 2000);
  };

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
          Add New Product
        </h1>
        <p className="text-white/60 text-sm">
          Submit a new product for admin approval
        </p>
      </div>

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
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
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
            {/* Image Grid */}
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

            {/* Upload Button */}
            <label className="block">
              <div className="border-2 border-dashed border-white/10 p-8 text-center hover:border-white/20 transition-colors cursor-pointer bg-[#1a1a1a]">
                <Upload size={32} className="text-white/40 mx-auto mb-3" />
                <div className="text-white/80 text-sm mb-1">Click to upload images</div>
                <div className="text-white/40 text-xs">PNG, JPG up to 10MB (min 3 images recommended)</div>
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
                  value={formData.thc_percentage}
                  onChange={(e) => setFormData({...formData, thc_percentage: e.target.value})}
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
                  value={formData.cbd_percentage}
                  onChange={(e) => setFormData({...formData, cbd_percentage: e.target.value})}
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
                value={formData.strain_type}
                onChange={(e) => setFormData({...formData, strain_type: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              >
                <option value="">Select type</option>
                <option value="indica">Indica</option>
                <option value="sativa">Sativa</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Initial Quantity */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Initial Quantity (grams)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.initial_quantity}
                onChange={(e) => setFormData({...formData, initial_quantity: e.target.value})}
                placeholder="100"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors"
              />
            </div>

            {/* Lineage */}
            <div className="col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Lineage / Genetics
              </label>
              <input
                type="text"
                value={formData.lineage}
                onChange={(e) => setFormData({...formData, lineage: e.target.value})}
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
                value={formData.terpenes}
                onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
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
                value={formData.effects}
                onChange={(e) => setFormData({...formData, effects: e.target.value})}
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
            disabled={loading}
            className="group px-6 py-3 bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white/20 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {loading ? 'Submitting...' : 'Submit for Review'}
              {!loading && (
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

