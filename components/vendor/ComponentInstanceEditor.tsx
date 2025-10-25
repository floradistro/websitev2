/**
 * Component Instance Editor
 * Edit individual component props in Live Editor
 */

"use client";

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { ProductSelectorDropdown } from './ProductSelectorDropdown';
import { CategorySelectorDropdown } from './CategorySelectorDropdown';
import { LocationSelectorDropdown } from './LocationSelectorDropdown';

interface ComponentInstanceEditorProps {
  instance: {
    id: string;
    component_key: string;
    props: Record<string, any>;
    field_bindings?: Record<string, string>;
    position_order: number;
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function ComponentInstanceEditor({
  instance,
  onUpdate,
  onDelete,
}: ComponentInstanceEditorProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  const handlePropChange = (propKey: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        props: {
          ...instance.props,
          [propKey]: value,
        },
      });
    }
  };
  
  const handleFieldBinding = (propKey: string, bindingKey: string) => {
    if (onUpdate) {
      onUpdate({
        field_bindings: {
          ...(instance.field_bindings || {}),
          [propKey]: bindingKey || undefined, // Remove if empty
        },
      });
    }
  };
  
  // Available bindings by context
  const availableBindings = [
    { key: '', label: '(None - use static value)' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'product_price', label: 'Product Price' },
    { key: 'product_description', label: 'Product Description' },
    { key: 'vendor_name', label: 'Store Name' },
    { key: 'vendor_tagline', label: 'Store Tagline' },
  ];
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'components');
      
      const response = await fetch('/api/vendor/media-library/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success && data.file) {
        handlePropChange('src', data.file.file_url);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Render editors based on component type
  const renderPropEditors = () => {
    const { component_key, props } = instance;
    
    // Image/Logo component
    if (component_key === 'image') {
      return (
        <>
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Preview</label>
            {props.src && (
              <div className="w-full h-32 bg-black border border-[#1a1a1a] flex items-center justify-center overflow-hidden mb-3">
                <img 
                  src={props.src} 
                  alt={props.alt || 'Preview'} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Source</label>
            <input
              type="text"
              value={props.src || ''}
              onChange={(e) => handlePropChange('src', e.target.value)}
              placeholder="/path/to/image.jpg"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 font-mono focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-1.5 border border-[#1a1a1a] hover:bg-[#1a1a1a] text-neutral-500 hover:text-neutral-400 px-2 py-1 text-[9px] transition-colors">
                <Upload size={10} />
                <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                disabled={uploadingImage}
              />
            </label>
            
            <button
              onClick={() => setShowMediaLibrary(true)}
              className="flex items-center gap-1.5 border border-[#1a1a1a] hover:bg-[#1a1a1a] text-neutral-500 hover:text-neutral-400 px-2 py-1 text-[9px] transition-colors"
            >
              <ImageIcon size={10} />
              <span>Library</span>
            </button>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Alt Text</label>
            <input
              type="text"
              value={props.alt || ''}
              onChange={(e) => handlePropChange('alt', e.target.value)}
              placeholder="Description for accessibility"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Aspect Ratio</label>
            <select
              value={props.aspect || 'auto'}
              onChange={(e) => handlePropChange('aspect', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="auto">Auto</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
              <option value="3:4">3:4 (Portrait)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Fit</label>
              <select
                value={props.fit || 'cover'}
                onChange={(e) => handlePropChange('fit', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Radius</label>
              <select
                value={props.radius || 'none'}
                onChange={(e) => handlePropChange('radius', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">XL</option>
                <option value="full">Circle</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Position</label>
            <select
              value={props.position || 'center'}
              onChange={(e) => handlePropChange('position', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.priority === true}
                onChange={(e) => handlePropChange('priority', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Priority (Load immediately)
            </label>
          </div>
        </>
      );
    }
    
    // Text component
    if (component_key === 'text') {
      const contentBinding = instance.field_bindings?.content || '';
      
      return (
        <>
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Content</label>
            <textarea
              value={props.content || ''}
              onChange={(e) => handlePropChange('content', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
              rows={3}
              disabled={!!contentBinding}
            />
            {contentBinding && (
              <p className="text-[9px] text-blue-400 mt-1">🔗 Bound to: {contentBinding}</p>
            )}
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Dynamic Binding</label>
            <select
              value={contentBinding}
              onChange={(e) => handleFieldBinding('content', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              {availableBindings.map(binding => (
                <option key={binding.key} value={binding.key}>
                  {binding.label}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-neutral-600 mt-1">
              Bind to dynamic data (overrides static content)
            </p>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Variant</label>
            <select
              value={props.variant || 'paragraph'}
              onChange={(e) => handlePropChange('variant', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="headline">Headline</option>
              <option value="subheadline">Subheadline</option>
              <option value="paragraph">Paragraph</option>
              <option value="label">Label</option>
              <option value="caption">Caption</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Size</label>
              <select
                value={props.size || 'md'}
                onChange={(e) => handlePropChange('size', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="xs">XS</option>
                <option value="sm">SM</option>
                <option value="md">MD</option>
                <option value="lg">LG</option>
                <option value="xl">XL</option>
                <option value="2xl">2XL</option>
                <option value="3xl">3XL</option>
                <option value="4xl">4XL</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Align</label>
              <select
                value={props.align || 'left'}
                onChange={(e) => handlePropChange('align', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Color</label>
            <input
              type="text"
              value={props.color || ''}
              onChange={(e) => handlePropChange('color', e.target.value)}
              placeholder="#ffffff"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a] font-mono"
            />
          </div>
        </>
      );
    }
    
    // Button component
    if (component_key === 'button') {
      return (
        <>
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Button Text</label>
            <input
              type="text"
              value={props.text || ''}
              onChange={(e) => handlePropChange('text', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Link URL</label>
            <input
              type="text"
              value={props.href || ''}
              onChange={(e) => handlePropChange('href', e.target.value)}
              placeholder="/shop"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Variant</label>
              <select
                value={props.variant || 'primary'}
                onChange={(e) => handlePropChange('variant', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="ghost">Ghost</option>
                <option value="outline">Outline</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Size</label>
              <select
                value={props.size || 'md'}
                onChange={(e) => handlePropChange('size', e.target.value)}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="sm">SM</option>
                <option value="md">MD</option>
                <option value="lg">LG</option>
                <option value="xl">XL</option>
              </select>
            </div>
          </div>
        </>
      );
    }
    
    // Spacer component
    if (component_key === 'spacer') {
      return (
        <div>
          <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Size</label>
          <select
            value={props.size || 'md'}
            onChange={(e) => handlePropChange('size', e.target.value)}
            className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
          >
            <option value="xs">XS (8px)</option>
            <option value="sm">SM (16px)</option>
            <option value="md">MD (32px)</option>
            <option value="lg">LG (48px)</option>
            <option value="xl">XL (64px)</option>
            <option value="2xl">2XL (96px)</option>
          </select>
        </div>
      );
    }
    
    // Icon component
    if (component_key === 'icon') {
      return (
        <>
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Icon (emoji)</label>
            <input
              type="text"
              value={props.name || ''}
              onChange={(e) => handlePropChange('name', e.target.value)}
              placeholder="🚀"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a] text-center text-2xl"
              maxLength={2}
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Size</label>
            <select
              value={props.size || 'md'}
              onChange={(e) => handlePropChange('size', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
            </select>
          </div>
        </>
      );
    }
    
    // Smart Product Grid
    if (component_key === 'smart_product_grid') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">🛍️ Auto-fetches products from database</p>
          </div>
          
          {/* Content */}
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Headline (optional)</label>
            <input
              type="text"
              value={props.headline || ''}
              onChange={(e) => handlePropChange('headline', e.target.value)}
              placeholder="Featured Products"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Subheadline (optional)</label>
            <input
              type="text"
              value={props.subheadline || ''}
              onChange={(e) => handlePropChange('subheadline', e.target.value)}
              placeholder="Check out our latest products"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          {/* Layout */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Columns</label>
              <select
                value={props.columns || 3}
                onChange={(e) => handlePropChange('columns', parseInt(e.target.value))}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
                <option value="5">5 Columns</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Max Products</label>
              <input
                type="number"
                value={props.maxProducts || 12}
                onChange={(e) => handlePropChange('maxProducts', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              />
            </div>
          </div>
          
          {/* Card Style */}
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Card Style</label>
            <select
              value={props.cardStyle || 'minimal'}
              onChange={(e) => handlePropChange('cardStyle', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="minimal">Minimal</option>
              <option value="bordered">Bordered</option>
              <option value="elevated">Elevated (shadow)</option>
            </select>
          </div>
          
          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] text-neutral-600">Select Specific Products</label>
              <button
                onClick={() => setShowProductSelector(!showProductSelector)}
                className="text-[9px] text-blue-400 hover:text-neutral-500"
              >
                {showProductSelector ? 'Hide' : 'Show'} Selector
              </button>
            </div>
            
            {showProductSelector ? (
              <ProductSelectorDropdown
                vendorId={props.vendorId}
                selectedProductIds={props.selectedProductIds || []}
                onChange={(ids) => handlePropChange('selectedProductIds', ids)}
              />
            ) : (
              <div className="text-[9px] text-neutral-600">
                {(props.selectedProductIds?.length || 0) > 0 
                  ? `${props.selectedProductIds.length} product(s) selected`
                  : 'All products (click Show to filter)'}
              </div>
            )}
          </div>
          
          {/* Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] text-neutral-600">Filter by Categories</label>
              <button
                onClick={() => setShowCategorySelector(!showCategorySelector)}
                className="text-[9px] text-blue-400 hover:text-neutral-500"
              >
                {showCategorySelector ? 'Hide' : 'Show'} Selector
              </button>
            </div>
            
            {showCategorySelector ? (
              <CategorySelectorDropdown
                selectedCategoryIds={props.selectedCategoryIds || []}
                onChange={(ids) => handlePropChange('selectedCategoryIds', ids)}
              />
            ) : (
              <div className="text-[9px] text-neutral-600">
                {(props.selectedCategoryIds?.length || 0) > 0 
                  ? `${props.selectedCategoryIds.length} categor${props.selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected`
                  : 'All categories (click Show to filter)'}
              </div>
            )}
          </div>
          
          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showPrice !== false}
                onChange={(e) => handlePropChange('showPrice', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Price
            </label>
            
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showQuickAdd !== false}
                onChange={(e) => handlePropChange('showQuickAdd', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Quick Add Button
            </label>
          </div>
        </>
      );
    }
    
    // Smart Product Detail
    if (component_key === 'smart_product_detail') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">🏷️ Auto-fetches product data from URL</p>
            <p className="text-[9px] text-neutral-600 mt-1">Product determined by URL slug</p>
          </div>
          
          {/* Override Product Slug */}
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Override Product Slug (optional)</label>
            <input
              type="text"
              value={props.productSlug || ''}
              onChange={(e) => handlePropChange('productSlug', e.target.value)}
              placeholder="Leave empty to use URL"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
            <p className="text-[9px] text-neutral-600 mt-1">Override URL slug to show specific product</p>
          </div>
          
          {/* Display Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showGallery !== false}
                onChange={(e) => handlePropChange('showGallery', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Image Gallery
            </label>
            
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showPricingTiers !== false}
                onChange={(e) => handlePropChange('showPricingTiers', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Pricing Tiers Dropdown
            </label>
            
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showFields !== false}
                onChange={(e) => handlePropChange('showFields', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Blueprint Fields
            </label>
            
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showAddToCart !== false}
                onChange={(e) => handlePropChange('showAddToCart', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Add to Cart Button
            </label>
          </div>
        </>
      );
    }
    
    // Smart Locations
    if (component_key === 'smart_locations') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">📍 Auto-fetches store locations</p>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Headline (optional)</label>
            <input
              type="text"
              value={props.headline || ''}
              onChange={(e) => handlePropChange('headline', e.target.value)}
              placeholder="Visit us in person"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Subheadline (optional)</label>
            <input
              type="text"
              value={props.subheadline || ''}
              onChange={(e) => handlePropChange('subheadline', e.target.value)}
              placeholder="Find a store near you"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] text-neutral-600">Select Specific Locations</label>
              <button
                onClick={() => setShowLocationSelector(!showLocationSelector)}
                className="text-[9px] text-blue-400 hover:text-neutral-500"
              >
                {showLocationSelector ? 'Hide' : 'Show'} Selector
              </button>
            </div>
            
            {showLocationSelector ? (
              <LocationSelectorDropdown
                vendorId={props.vendorId}
                selectedLocationIds={props.selectedLocationIds || []}
                onChange={(ids) => handlePropChange('selectedLocationIds', ids)}
              />
            ) : (
              <div className="text-[9px] text-neutral-600">
                {(props.selectedLocationIds?.length || 0) > 0 
                  ? `${props.selectedLocationIds.length} location(s) selected`
                  : 'All locations (click Show to filter)'}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showMap === true}
                onChange={(e) => handlePropChange('showMap', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Map
            </label>
            
            <label className="flex items-center gap-2 text-[9px] text-neutral-600">
              <input
                type="checkbox"
                checked={props.showDirections !== false}
                onChange={(e) => handlePropChange('showDirections', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Directions Links
            </label>
          </div>
        </>
      );
    }
    
    // Smart Reviews
    if (component_key === 'smart_reviews') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">⭐ Auto-fetches customer reviews</p>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Headline (optional)</label>
            <input
              type="text"
              value={props.headline || ''}
              onChange={(e) => handlePropChange('headline', e.target.value)}
              placeholder="Customer Reviews"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Limit</label>
              <input
                type="number"
                value={props.limit || 6}
                onChange={(e) => handlePropChange('limit', parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              />
            </div>
            
            <div>
              <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Min Rating</label>
              <select
                value={props.minRating || 1}
                onChange={(e) => handlePropChange('minRating', parseInt(e.target.value))}
                className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
              >
                <option value="1">1+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars Only</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Product ID (optional)</label>
            <input
              type="text"
              value={props.productId || ''}
              onChange={(e) => handlePropChange('productId', e.target.value)}
              placeholder="Leave empty for all vendor reviews"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500 font-mono"
            />
            <p className="text-[9px] text-neutral-600 mt-1">Show reviews for specific product</p>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Layout</label>
            <select
              value={props.layout || 'grid'}
              onChange={(e) => handlePropChange('layout', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="list">List</option>
            </select>
          </div>
        </>
      );
    }
    
    // Smart Header
    if (component_key === 'smart_header') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">🔝 Smart Header - Full Control</p>
          </div>
          
          {/* Logo */}
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Logo URL</label>
            <input
              type="text"
              value={props.logoUrl || ''}
              onChange={(e) => handlePropChange('logoUrl', e.target.value)}
              placeholder="/logo.png"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500 font-mono"
            />
          </div>
          
          {/* Vendor Info (read-only) */}
          <div className="border border-[#1a1a1a] p-2">
            <p className="text-[9px] text-neutral-600 mb-1">Vendor Info (Auto)</p>
            <p className="text-[9px] text-neutral-600">Name: {props.vendorName}</p>
            <p className="text-[9px] text-neutral-600">Slug: {props.vendorSlug}</p>
          </div>
          
          {/* Announcement Bar */}
          <div className="border-t border-[#1a1a1a] pt-3 mt-2">
            <label className="flex items-center gap-2 text-[9px] text-neutral-600 mb-2">
              <input
                type="checkbox"
                checked={props.showAnnouncement !== false}
                onChange={(e) => handlePropChange('showAnnouncement', e.target.checked)}
                className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
              />
              Show Announcement Bar
            </label>
            
            {props.showAnnouncement !== false && (
              <div>
                <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Announcement Text</label>
                <input
                  type="text"
                  value={props.announcementText || ''}
                  onChange={(e) => handlePropChange('announcementText', e.target.value)}
                  placeholder="Free shipping over $45"
                  className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
                />
              </div>
            )}
          </div>
          
          {/* Navigation Links */}
          <div className="border-t border-[#1a1a1a] pt-3 mt-2">
            <label className="block text-[9px] text-neutral-600 mb-2">Navigation Links</label>
            <div className="space-y-2">
              {(props.navLinks || []).map((link: any, idx: number) => (
                <div key={idx} className="border border-[#1a1a1a] p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={link.label || ''}
                      onChange={(e) => {
                        const newLinks = [...(props.navLinks || [])];
                        newLinks[idx] = { ...link, label: e.target.value };
                        handlePropChange('navLinks', newLinks);
                      }}
                      placeholder="Label"
                      className="flex-1 bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500"
                    />
                    <button
                      onClick={() => {
                        const newLinks = (props.navLinks || []).filter((_: any, i: number) => i !== idx);
                        handlePropChange('navLinks', newLinks);
                      }}
                      className="px-2 py-1 text-[9px] text-neutral-600 hover:text-neutral-400"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(props.navLinks || [])];
                      newLinks[idx] = { ...link, href: e.target.value };
                      handlePropChange('navLinks', newLinks);
                    }}
                    placeholder="/path"
                    className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500 font-mono"
                  />
                  <label className="flex items-center gap-2 text-[9px] text-neutral-600 mt-1">
                    <input
                      type="checkbox"
                      checked={link.showDropdown === true}
                      onChange={(e) => {
                        const newLinks = [...(props.navLinks || [])];
                        newLinks[idx] = { ...link, showDropdown: e.target.checked };
                        handlePropChange('navLinks', newLinks);
                      }}
                      className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                    />
                    Show Dropdown
                  </label>
                </div>
              ))}
              
              <button
                onClick={() => {
                  const newLinks = [...(props.navLinks || []), { label: 'New Link', href: '/page', showDropdown: false }];
                  handlePropChange('navLinks', newLinks);
                }}
                className="w-full border border-[#1a1a1a] hover:bg-[#1a1a1a] text-neutral-600 hover:text-neutral-400 px-2 py-1 text-[9px] transition-colors"
              >
                + Add Link
              </button>
            </div>
          </div>
          
          {/* Feature Toggles */}
          <div className="border-t border-[#1a1a1a] pt-3 mt-2">
            <label className="block text-[9px] text-neutral-600 mb-2">Features</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={props.showSearch !== false}
                  onChange={(e) => handlePropChange('showSearch', e.target.checked)}
                  className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                />
                Show Search
              </label>
              
              <label className="flex items-center gap-2 text-[9px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={props.showCart !== false}
                  onChange={(e) => handlePropChange('showCart', e.target.checked)}
                  className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                />
                Show Cart
              </label>
              
              <label className="flex items-center gap-2 text-[9px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={props.showAccount !== false}
                  onChange={(e) => handlePropChange('showAccount', e.target.checked)}
                  className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                />
                Show Account
              </label>
            </div>
          </div>
          
          {/* Behavior */}
          <div className="border-t border-[#1a1a1a] pt-3 mt-2">
            <label className="block text-[9px] text-neutral-600 mb-2">Behavior</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={props.sticky !== false}
                  onChange={(e) => handlePropChange('sticky', e.target.checked)}
                  className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                />
                Sticky (Fixed to top)
              </label>
              
              <label className="flex items-center gap-2 text-[9px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={props.hideOnScroll !== false}
                  onChange={(e) => handlePropChange('hideOnScroll', e.target.checked)}
                  className="w-3 h-3 bg-transparent border border-[#1a1a1a]"
                />
                Hide on Scroll Down
              </label>
            </div>
          </div>
          
          {/* Styling */}
          <div className="border-t border-[#1a1a1a] pt-3 mt-2">
            <label className="block text-[9px] text-neutral-600 mb-2">Styling (Advanced)</label>
            <div className="space-y-2">
              <div>
                <label className="block text-[9px] text-neutral-600 mb-1">Background</label>
                <input
                  type="text"
                  value={props.backgroundColor || 'bg-black/40 backdrop-blur-3xl'}
                  onChange={(e) => handlePropChange('backgroundColor', e.target.value)}
                  className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 font-mono"
                />
              </div>
              
              <div>
                <label className="block text-[9px] text-neutral-600 mb-1">Text Color</label>
                <input
                  type="text"
                  value={props.textColor || 'text-neutral-400'}
                  onChange={(e) => handlePropChange('textColor', e.target.value)}
                  className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 font-mono"
                />
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // Smart Footer
    if (component_key === 'smart_footer') {
      return (
        <>
          <div className="border border-[#1a1a1a] p-2 mb-3">
            <p className="text-[9px] text-neutral-600">🔚 Smart Footer - Full Control</p>
          </div>
          
          <div className="text-[9px] text-neutral-600">
            Footer editor coming soon. For now, edit the raw JSON below.
          </div>
        </>
      );
    }
    
    // Other smart components - show info only
    if (component_key.startsWith('smart_')) {
      return (
        <div className="border border-[#1a1a1a] p-3">
          <p className="text-[9px] text-neutral-600">
            ℹ️ Smart component auto-fetches data from database
          </p>
          <p className="text-[9px] text-neutral-600 mt-2">
            vendorId: {props.vendorId}
          </p>
        </div>
      );
    }
    
    // Divider component
    if (component_key === 'divider') {
      return (
        <>
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={props.color || '#333333'}
                onChange={(e) => handlePropChange('color', e.target.value)}
                className="w-10 h-8 rounded border border-neutral-700 bg-neutral-900"
              />
              <input
                type="text"
                value={props.color || '#333333'}
                onChange={(e) => handlePropChange('color', e.target.value)}
                className="flex-1 bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500 font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Thickness (px)</label>
            <input
              type="number"
              value={props.thickness || 1}
              onChange={(e) => handlePropChange('thickness', parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            />
          </div>
          
          <div>
            <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Spacing</label>
            <select
              value={props.spacing || 'md'}
              onChange={(e) => handlePropChange('spacing', e.target.value)}
              className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[10px] text-neutral-400 focus:outline-none focus:border-[#2a2a2a]"
            >
              <option value="xs">XS (8px)</option>
              <option value="sm">SM (16px)</option>
              <option value="md">MD (24px)</option>
              <option value="lg">LG (32px)</option>
              <option value="xl">XL (48px)</option>
            </select>
          </div>
        </>
      );
    }
    
    // Generic JSON editor for other components
    return (
      <div>
        <label className="block text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Props (JSON)</label>
        <textarea
          value={JSON.stringify(props, null, 2)}
          onChange={(e) => {
            try {
              const newProps = JSON.parse(e.target.value);
              onUpdate({ props: newProps });
            } catch (err) {
              // Invalid JSON - ignore
            }
          }}
          className="w-full bg-transparent border border-[#1a1a1a] px-2 py-1 text-[9px] text-neutral-500 font-mono"
          rows={8}
        />
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[9px] text-neutral-600 uppercase tracking-wider">{instance.component_key}</h4>
          <button
            onClick={onDelete}
            className="text-[9px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Delete
          </button>
        </div>
        <p className="text-[9px] text-neutral-700">Order: {instance.position_order}</p>
      </div>
      
      {/* Property Editors */}
      <div className="space-y-5">
        {renderPropEditors()}
      </div>
    </div>
  );
}

