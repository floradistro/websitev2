"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { createVendorProduct, uploadVendorImages, uploadVendorCOA } from '@/lib/wordpress';

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCOA, setUploadingCOA] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [coaFile, setCoAFile] = useState<File | null>(null);
  const [uploadedCoaUrl, setUploadedCoaUrl] = useState<string | null>(null);
  
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Add to file list
    setImageFiles(prev => [...prev, ...fileArray]);
    
    // Generate previews
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Upload immediately for faster submission
    try {
      setUploadingImages(true);
      const response = await uploadVendorImages(fileArray);
      
      if (response.success && response.images) {
        const urls = response.images.map((img: any) => img.url);
        setUploadedImageUrls(prev => [...prev, ...urls]);
      }
      
      if (response.errors && response.errors.length > 0) {
        console.error('Image upload errors:', response.errors);
      }
    } catch (err) {
      console.error('Failed to upload images:', err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCOAUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCoAFile(file);
    
    // Upload immediately
    try {
      setUploadingCOA(true);
      const response = await uploadVendorCOA(file);
      
      if (response.success && response.url) {
        setUploadedCoaUrl(response.url);
      }
    } catch (err) {
      console.error('Failed to upload COA:', err);
    } finally {
      setUploadingCOA(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Submit product to API with uploaded image URLs
      const response = await createVendorProduct({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        thc_percentage: formData.thc_percentage,
        cbd_percentage: formData.cbd_percentage,
        strain_type: formData.strain_type,
        lineage: formData.lineage,
        terpenes: formData.terpenes,
        effects: formData.effects,
        initial_quantity: formData.initial_quantity,
        image_urls: uploadedImageUrls, // Include uploaded images
        coa_url: uploadedCoaUrl // Include uploaded COA
      });

      if (response && response.success) {
        setSuccess(true);
        
        // Show success message
        setTimeout(() => {
          router.push('/vendor/products');
        }, 2000);
      } else {
        setError('Failed to create product. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
      setLoading(false);
    }
  };

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
          Add New Product
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Submit a new product for admin approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0 lg:space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 -mx-4 lg:mx-0">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-medium mb-1">Product Submitted Successfully!</p>
              <p className="text-green-500/80 text-sm">Your product has been submitted for admin approval. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 -mx-4 lg:mx-0">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium mb-1">Submission Failed</p>
              <p className="text-red-500/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors resize-none text-base"
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded focus:outline-none focus:border-white/20 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Product Images</h2>
          
          <div className="space-y-4">
            {/* Image Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-white/5 rounded overflow-hidden group">
                    <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    {uploadedImageUrls[index] ? (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs flex items-center gap-1">
                        <CheckCircle size={12} />
                        Uploaded
                      </div>
                    ) : uploadingImages ? (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Uploading...
                      </div>
                    ) : null}
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

        {/* Certificate of Analysis */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-medium">Certificate of Analysis (COA)</h2>
            <span className="text-red-500 text-xs uppercase tracking-wider">Required</span>
          </div>

          {coaFile ? (
            <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-white/60" />
                <div>
                  <div className="text-white text-sm flex items-center gap-2">
                    {coaFile.name}
                    {uploadedCoaUrl && (
                      <span className="text-green-500 text-xs flex items-center gap-1">
                        <CheckCircle size={12} />
                        Uploaded
                      </span>
                    )}
                    {uploadingCOA && (
                      <span className="text-blue-500 text-xs flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Uploading...
                      </span>
                    )}
                  </div>
                  <div className="text-white/60 text-xs">{(coaFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoAFile(null);
                  setUploadedCoaUrl(null);
                }}
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
                <div className="text-white/40 text-xs">PDF format, max 5MB - Required for approval</div>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCOAUpload}
                className="hidden"
              />
            </label>
          )}

          <div className="mt-4 bg-blue-500/5 border border-blue-500/10 p-3">
            <div className="flex gap-2">
              <FileText size={16} className="text-blue-500/80 flex-shrink-0 mt-0.5" />
              <div className="text-blue-500/80 text-xs leading-relaxed">
                All products must include a Certificate of Analysis from an accredited laboratory. COAs must be less than 90 days old.
              </div>
            </div>
          </div>
        </div>

        {/* Strain Details */}
        <div className="bg-[#1a1a1a] lg:border border-t border-white/5 p-4 lg:p-6 -mx-4 lg:mx-0">
          <h2 className="text-white font-medium mb-6">Strain Details</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Lineage */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Lineage / Genetics
              </label>
              <input
                type="text"
                value={formData.lineage}
                onChange={(e) => setFormData({...formData, lineage: e.target.value})}
                placeholder="e.g., Blueberry × Haze"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Terpenes */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Dominant Terpenes
              </label>
              <input
                type="text"
                value={formData.terpenes}
                onChange={(e) => setFormData({...formData, terpenes: e.target.value})}
                placeholder="e.g., Myrcene, Pinene, Caryophyllene"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
              />
            </div>

            {/* Effects */}
            <div className="lg:col-span-2">
              <label className="block text-white/80 text-sm mb-2">
                Effects
              </label>
              <input
                type="text"
                value={formData.effects}
                onChange={(e) => setFormData({...formData, effects: e.target.value})}
                placeholder="e.g., Relaxed, Creative, Euphoric"
                className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
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
            disabled={loading}
            className="group w-full lg:w-auto px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

