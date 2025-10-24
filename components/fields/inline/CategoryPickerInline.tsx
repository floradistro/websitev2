"use client";

import { useState, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CategoryPickerFieldInline({ label, value = [], onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (showPicker && categories.length === 0) {
      loadCategories();
    }
  }, [showPicker]);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await fetch('/api/supabase/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedCategories = categories.filter(c => value.includes(c.id) || value.includes(c.slug));

  // Load categories initially to show selected items
  useEffect(() => {
    if (value.length > 0 && categories.length === 0) {
      loadCategories();
    }
  }, [value]);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-white/60 text-xs">{label}</label>
        {selectedCategories.length > 0 && (
          <span className="text-green-400 text-[10px]">
            ✓ {selectedCategories.length} selected
          </span>
        )}
      </div>
      
      {/* Selected items - Always visible */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedCategories.map(cat => (
            <span key={cat.id} className="inline-flex items-center gap-1 bg-[#007acc]/20 text-[#4fc1ff] px-2 py-0.5 rounded text-[10px] border border-[#007acc]/30">
              {cat.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter(v => v !== cat.id && v !== cat.slug));
                }}
                className="hover:text-purple-100"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Loading state while fetching category names */}
      {value.length > 0 && categories.length === 0 && (
        <div className="bg-white/5 rounded px-2 py-1 mb-1">
          <span className="text-white/40 text-[10px]">Loading category names...</span>
        </div>
      )}

      {/* Picker button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full bg-black border border-white/10 text-white px-2 py-1.5 rounded text-xs flex items-center justify-between hover:border-white/30 transition-colors"
      >
        <span>{selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Select categories'}</span>
        <ChevronDown size={12} className={`transition-transform ${showPicker ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown picker */}
      {showPicker && (
        <div className="mt-1 bg-[#252526] border border-[#3e3e3e] rounded max-h-48 overflow-y-auto shadow-lg">
          {loading ? (
            <div className="p-3 text-center text-white/40 text-xs">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-3 text-center text-white/40 text-xs">No categories found</div>
          ) : (
            <div className="p-1">
              {categories.map(cat => {
                const isSelected = value.includes(cat.id) || value.includes(cat.slug);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (isSelected) {
                        onChange(value.filter(v => v !== cat.id && v !== cat.slug));
                      } else {
                        onChange([...value, cat.id]);
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
                      isSelected ? 'bg-[#007acc]/20 text-[#4fc1ff]' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-[#007acc] border-[#007acc]' : 'border-[#3e3e3e]'
                    }`}>
                      {isSelected && <Check size={8} className="text-white" />}
                    </div>
                    {cat.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

