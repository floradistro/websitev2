"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface CategorySelectorDropdownProps {
  selectedCategoryIds: string[];
  onChange: (categoryIds: string[]) => void;
}

export function CategorySelectorDropdown({
  selectedCategoryIds,
  onChange,
}: CategorySelectorDropdownProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load categories:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(c.id),
  );

  const toggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedCategoryIds, categoryId]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded"
            >
              <span>{category.name}</span>
              <button
                onClick={() => toggleCategory(category.id)}
                className="hover:bg-green-700 rounded"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category List */}
      <div className="max-h-48 overflow-y-auto border border-neutral-800 rounded bg-neutral-950">
        {loading ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            Loading...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            No categories found
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 p-2 hover:bg-neutral-900 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {category.name}
                  </div>
                  {category.slug && (
                    <div className="text-xs text-neutral-500">
                      {category.slug}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        {selectedCategories.length === 0
          ? "Select categories or leave empty to show all"
          : `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"} selected`}
      </p>
    </div>
  );
}
