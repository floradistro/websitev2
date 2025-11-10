"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count?: number;
}

interface CategoryPickerFieldProps {
  value: string[]; // Array of category IDs or slugs
  onChange: (value: string[]) => void;
  multiSelect?: boolean;
  showProductCount?: boolean;
  label?: string;
}

export function CategoryPickerField({
  value = [],
  onChange,
  multiSelect = true,
  showProductCount = true,
  label = "Select Categories",
}: CategoryPickerFieldProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      // Only load parent categories (no subcategories in main dropdown)
      const response = await fetch(
        "/api/supabase/categories?parent=null&active=true",
      );

      if (!response.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch categories:", response.status);
        }
        setLoading(false);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        if (process.env.NODE_ENV === "development") {
          console.error("Categories API returned non-JSON response");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success || Array.isArray(data)) {
        setCategories(data.categories || data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading categories:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (multiSelect) {
      if (value.includes(categoryId)) {
        onChange(value.filter((id) => id !== categoryId));
      } else {
        onChange([...value, categoryId]);
      }
    } else {
      onChange([categoryId]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-white/80 text-sm mb-2">{label}</label>

      {loading ? (
        <div className="text-white/40 text-xs py-4 text-center">
          Loading categories...
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto bg-black/50 border border-white/20 rounded p-2">
          {categories.map((category) => {
            const isSelected =
              value.includes(category.id) || value.includes(category.slug);
            return (
              <div
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-purple-500/20 border border-purple-500/40"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected
                        ? "bg-purple-500 border-purple-500"
                        : "border-white/20"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-white text-sm">{category.name}</span>
                </div>
                {showProductCount && category.product_count !== undefined && (
                  <span className="text-white/40 text-xs">
                    {category.product_count} products
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="text-white/40 text-xs mt-2">
          {value.length} {multiSelect ? "categories" : "category"} selected
        </div>
      )}
    </div>
  );
}
