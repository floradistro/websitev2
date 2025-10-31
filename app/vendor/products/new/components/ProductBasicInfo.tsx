"use client";

import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import AIAutofillPanel from './AIAutofillPanel';
import SectionHeader from '@/components/ui/SectionHeader';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductBasicInfoProps {
  formData: {
    name: string;
    description: string;
    category: string;
    product_visibility: 'internal' | 'marketplace';
  };
  categoryId: string;
  productType: 'simple' | 'variable';
  categories: Category[];
  loadingFields: boolean;
  dynamicFields: any[];
  loadingAI: boolean;
  aiSuggestions: any;
  showSuggestions: boolean;
  onFormDataChange: (formData: any) => void;
  onCategoryChange: (categoryId: string) => void;
  onProductTypeChange: (type: 'simple' | 'variable') => void;
  onAIAutofill: (selectedFields: string[], customPrompt: string) => Promise<void>;
  onApplySuggestions: (selectedFields: string[]) => void;
  onCloseSuggestions: () => void;
}

export default function ProductBasicInfo({
  formData,
  categoryId,
  productType,
  categories,
  loadingFields,
  dynamicFields,
  loadingAI,
  aiSuggestions,
  showSuggestions,
  onFormDataChange,
  onCategoryChange,
  onProductTypeChange,
  onAIAutofill,
  onApplySuggestions,
  onCloseSuggestions
}: ProductBasicInfoProps) {
  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
      <SectionHeader>Basic Information</SectionHeader>

      <div className="space-y-4">
        {/* Product Name */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
            placeholder="e.g., Blue Dream"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs"
          />

          {/* AI Autofill Panel - Enhanced with field selection and custom prompts */}
          <AIAutofillPanel
            productName={formData.name}
            category={formData.category}
            dynamicFields={dynamicFields}
            onAutofill={onAIAutofill}
            loading={loadingAI}
            aiSuggestions={aiSuggestions}
            showSuggestions={showSuggestions}
            onClose={onCloseSuggestions}
            onApply={onApplySuggestions}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
            placeholder="Describe your product..."
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-xs"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Category <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs cursor-pointer"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {loadingFields && (
            <p className="text-white/40 text-[10px] mt-2 flex items-center gap-1.5 uppercase tracking-[0.15em]">
              <Loader size={10} className="animate-spin" />
              Loading fields...
            </p>
          )}
        </div>

        {/* Product Type */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Product Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onProductTypeChange('simple')}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                productType === 'simple'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => onProductTypeChange('variable')}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                productType === 'variable'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              Variable
            </button>
          </div>
        </div>

        {/* Product Visibility */}
        <div>
          <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
            Product Visibility <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onFormDataChange({...formData, product_visibility: 'internal'})}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                formData.product_visibility === 'internal'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              <div className="flex flex-col items-center gap-1">
                <span>🔒 Internal</span>
                <span className="text-[7px] text-white/40 font-normal">POS, Inventory, TV</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onFormDataChange({...formData, product_visibility: 'marketplace'})}
              className={`px-3 py-2.5 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black ${
                formData.product_visibility === 'marketplace'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0a0a0a] border-white/10 text-white/60 hover:border-white/20'
              }`}
              style={{ fontWeight: 900 }}
            >
              <div className="flex flex-col items-center gap-1">
                <span>🌐 Marketplace</span>
                <span className="text-[7px] text-white/40 font-normal">Requires approval</span>
              </div>
            </button>
          </div>
          {formData.product_visibility === 'internal' && (
            <p className="text-green-400/60 text-[9px] mt-2 flex items-center gap-1.5 uppercase tracking-[0.15em]">
              <CheckCircle size={9} strokeWidth={2.5} />
              Will publish immediately
            </p>
          )}
          {formData.product_visibility === 'marketplace' && (
            <p className="text-orange-400/60 text-[9px] mt-2 flex items-center gap-1.5 uppercase tracking-[0.15em]">
              <AlertCircle size={9} strokeWidth={2.5} />
              Will require admin approval
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
