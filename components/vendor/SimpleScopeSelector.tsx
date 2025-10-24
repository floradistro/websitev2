"use client";

/**
 * Simple Scope Selector - VSCode Style
 * Clean, minimal, 3-level scope selection
 */

interface SimpleScopeSelectorProps {
  value: { type: 'section_type' | 'page' | 'global'; value: string };
  onChange: (scope: { type: 'section_type' | 'page' | 'global'; value: string }) => void;
}

export function SimpleScopeSelector({ value, onChange }: SimpleScopeSelectorProps) {
  const scopeType = value.type || 'section_type';
  const scopeValue = value.value || 'hero';

  return (
    <div className="space-y-3">
      {/* Scope Type */}
      <div>
        <label className="block text-[#cccccc] text-xs mb-1.5">Apply To</label>
        <select
          value={scopeType}
          onChange={(e) => {
            const newType = e.target.value as any;
            let newValue = '';
            if (newType === 'section_type') newValue = 'hero';
            else if (newType === 'page') newValue = 'home';
            onChange({ type: newType, value: newValue });
          }}
          className="w-full bg-[#1e1e1e] border border-[#3e3e3e] text-[#cccccc] px-3 py-1.5 rounded text-sm hover:border-[#505050] focus:border-[#007acc] focus:outline-none transition-colors"
        >
          <option value="section_type">Specific Section Type</option>
          <option value="page">Entire Page</option>
          <option value="global">All Pages (Global)</option>
        </select>
      </div>

      {/* Section Type Selection */}
      {scopeType === 'section_type' && (
        <div>
          <label className="block text-[#cccccc] text-xs mb-1.5">Which Section</label>
          <select
            value={scopeValue}
            onChange={(e) => onChange({ type: scopeType, value: e.target.value })}
            className="w-full bg-[#1e1e1e] border border-[#3e3e3e] text-[#cccccc] px-3 py-1.5 rounded text-sm hover:border-[#505050] focus:border-[#007acc] focus:outline-none transition-colors"
          >
            <option value="hero">Hero</option>
            <option value="process">Process Steps</option>
            <option value="featured_products">Featured Products</option>
            <option value="reviews">Reviews</option>
            <option value="locations">Locations</option>
            <option value="about_story">About Story</option>
            <option value="footer">Footer</option>
          </select>
          <p className="text-[#858585] text-[10px] mt-1">
            Appears in all {scopeValue} sections across all pages
          </p>
        </div>
      )}

      {/* Page Selection */}
      {scopeType === 'page' && (
        <div>
          <label className="block text-[#cccccc] text-xs mb-1.5">Which Page</label>
          <select
            value={scopeValue}
            onChange={(e) => onChange({ type: scopeType, value: e.target.value })}
            className="w-full bg-[#1e1e1e] border border-[#3e3e3e] text-[#cccccc] px-3 py-1.5 rounded text-sm hover:border-[#505050] focus:border-[#007acc] focus:outline-none transition-colors"
          >
            <option value="home">Home Page</option>
            <option value="about">About Page</option>
            <option value="shop">Shop Page</option>
            <option value="contact">Contact Page</option>
            <option value="faq">FAQ Page</option>
          </select>
          <p className="text-[#858585] text-[10px] mt-1">
            Appears in all sections on the {scopeValue} page only
          </p>
        </div>
      )}

      {/* Global Info */}
      {scopeType === 'global' && (
        <div className="bg-[#1e1e1e] border border-[#3e3e3e] rounded p-3">
          <p className="text-[#cccccc] text-xs leading-relaxed">
            This field will appear in <span className="text-[#4fc1ff]">every section</span> on <span className="text-[#4fc1ff]">every page</span>.
          </p>
          <p className="text-[#858585] text-[10px] mt-2">
            Use for site-wide settings like brand colors, tracking codes, or universal badges.
          </p>
        </div>
      )}
    </div>
  );
}

