'use client';

import { useState, useEffect } from 'react';

interface CategorySelectorProps {
  availableCategories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  showAllOption?: boolean;
}

export default function CategorySelector({
  availableCategories,
  selectedCategories,
  onCategoriesChange,
  showAllOption = true,
}: CategorySelectorProps) {
  const [isAllSelected, setIsAllSelected] = useState(
    selectedCategories.length === 0 || selectedCategories.length === availableCategories.length
  );

  useEffect(() => {
    setIsAllSelected(
      selectedCategories.length === 0 || selectedCategories.length === availableCategories.length
    );
  }, [selectedCategories, availableCategories]);

  const handleAllClick = () => {
    onCategoriesChange([]);
    setIsAllSelected(true);
  };

  const handleCategoryClick = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    // If all categories are selected, treat as "all"
    if (newCategories.length === availableCategories.length) {
      onCategoriesChange([]);
    } else if (newCategories.length === 0) {
      onCategoriesChange([]);
    } else {
      onCategoriesChange(newCategories);
    }
  };

  const isCategorySelected = (category: string) => {
    return isAllSelected || selectedCategories.includes(category);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          Display Categories
        </label>
        <span className="text-xs text-gray-500">
          {isAllSelected
            ? 'All categories'
            : `${selectedCategories.length} selected`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {showAllOption && (
          <button
            type="button"
            onClick={handleAllClick}
            className={`
              px-4 py-2.5 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              ${
                isAllSelected
                  ? 'bg-gray-900 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }
            `}
          >
            All Categories
          </button>
        )}

        {availableCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategoryClick(category)}
            disabled={isAllSelected}
            className={`
              px-4 py-2.5 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              ${
                isCategorySelected(category) && !isAllSelected
                  ? 'bg-gray-900 text-white shadow-lg scale-105'
                  : isAllSelected
                  ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {availableCategories.length === 0 && (
        <div className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
          No categories available. Add products with categories to enable filtering.
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Select specific categories to display on the menu, or choose "All Categories" to show everything.
      </p>
    </div>
  );
}
