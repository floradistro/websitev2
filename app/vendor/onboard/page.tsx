'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Sparkles, Loader2 } from 'lucide-react';

export default function VendorOnboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    store_name: '',
    slug: '',
    email: '',
    store_tagline: '',
    vendor_type: 'cannabis',
    brand_colors: {
      primary: '#000000',
      secondary: '#ffffff'
    },
    business_description: '',
    unique_selling_points: ''
  });
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Create vendor
      console.log('Creating vendor...');
      const createRes = await fetch('/api/vendors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const createData = await createRes.json();
      
      if (!createData.success) {
        alert(createData.error || 'Failed to create vendor');
        setLoading(false);
        return;
      }
      
      const vendor = createData.vendor;
      console.log('✅ Vendor created:', vendor.id);
      
      // Step 2: Trigger AI generation
      console.log('Triggering AI generation...');
      const generateRes = await fetch('/api/vendors/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          vendorData: {
            ...formData,
            id: vendor.id,
            slug: vendor.slug
          }
        })
      });
      
      const generateData = await generateRes.json();
      
      if (generateData.success) {
        // Redirect to generating page
        router.push(`/vendor/onboard/generating?vendor_id=${vendor.id}`);
      } else {
        alert(generateData.error || 'Failed to generate storefront');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-light tracking-wide">Create Your Storefront</h1>
              <p className="text-xs text-white/40">AI-powered setup in 2 minutes</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 1 ? 'bg-white text-black' : 'bg-white/10 text-white/40'
          }`}>
            1
          </div>
          <div className={`h-px w-16 ${step >= 2 ? 'bg-white' : 'bg-white/10'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 2 ? 'bg-white text-black' : 'bg-white/10 text-white/40'
          }`}>
            2
          </div>
          <div className={`h-px w-16 ${step >= 3 ? 'bg-white' : 'bg-white/10'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 3 ? 'bg-white text-black' : 'bg-white/10 text-white/40'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          {/* Basic Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-light mb-6">Basic Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Store Name *</label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={e => {
                    const name = e.target.value;
                    setFormData({ 
                      ...formData, 
                      store_name: name,
                      slug: formData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    });
                  }}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Flora Distro"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">URL Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm">yachtclub.com/storefront?vendor=</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors"
                    pattern="[a-z0-9-]+"
                    placeholder="flora-distro"
                    required
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="hello@floradistro.com"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Business Details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-light mb-6">Tell Us About Your Business</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tagline</label>
                <input
                  type="text"
                  value={formData.store_tagline}
                  onChange={e => setFormData({ ...formData, store_tagline: e.target.value })}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Premium cannabis delivered fast"
                />
                <p className="text-xs text-white/40 mt-1">One line that describes what makes you special</p>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Business Type *</label>
                <select
                  value={formData.vendor_type}
                  onChange={e => setFormData({ ...formData, vendor_type: e.target.value })}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors"
                  required
                >
                  <option value="cannabis">Cannabis Dispensary</option>
                  <option value="restaurant">Restaurant / Food Service</option>
                  <option value="retail">Retail Store</option>
                  <option value="service">Service Provider</option>
                  <option value="distributor">Wholesale / Distributor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">What makes your business unique?</label>
                <textarea
                  value={formData.unique_selling_points}
                  onChange={e => setFormData({ ...formData, unique_selling_points: e.target.value })}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/40 transition-colors h-24 resize-none"
                  placeholder="Small-batch grows, sustainable practices, same-day delivery..."
                />
                <p className="text-xs text-white/40 mt-1">This helps AI write better copy for your storefront</p>
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Brand Colors</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.brand_colors.primary}
                        onChange={e => setFormData({ 
                          ...formData, 
                          brand_colors: { ...formData.brand_colors, primary: e.target.value }
                        })}
                        className="w-12 h-12 rounded border border-white/20 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brand_colors.primary}
                        onChange={e => setFormData({ 
                          ...formData, 
                          brand_colors: { ...formData.brand_colors, primary: e.target.value }
                        })}
                        className="flex-1 bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.brand_colors.secondary}
                        onChange={e => setFormData({ 
                          ...formData, 
                          brand_colors: { ...formData.brand_colors, secondary: e.target.value }
                        })}
                        className="w-12 h-12 rounded border border-white/20 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brand_colors.secondary}
                        onChange={e => setFormData({ 
                          ...formData, 
                          brand_colors: { ...formData.brand_colors, secondary: e.target.value }
                        })}
                        className="flex-1 bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-5 rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Your Storefront...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate My Storefront with AI</span>
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-white/40">
            AI will design a professional storefront in ~60 seconds
          </p>
        </form>
      </div>
    </div>
  );
}

