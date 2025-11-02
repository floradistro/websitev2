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
    // If "All" is selected, clicking any category should select only that one
    if (isAllSelected) {
      onCategoriesChange([category]);
      return;
    }

    // Toggle the category
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    // If all categories are selected, treat as "all"
    if (newCategories.length === availableCategories.length) {
      onCategoriesChange([]);
    } else if (newCategories.length === 0) {
      // If nothing selected, go back to "all"
      onCategoriesChange([]);
    } else {
      onCategoriesChange(newCategories);
    }
  };

  const isCategorySelected = (category: string) => {
    return selectedCategories.includes(category);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          Display Categories
        </label>
        <span className="text-xs text-white/40">
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
              px-4 py-2.5 rounded-full text-sm font-bold
              transition-all duration-200 ease-out
              ${
                isAllSelected
                  ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
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
            className={`
              px-4 py-2.5 rounded-full text-sm font-bold
              transition-all duration-200 ease-out
              ${
                isCategorySelected(category)
                  ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {availableCategories.length === 0 && (
        <div className="text-sm text-white/40 italic py-4 text-center bg-white/5 border border-white/10 rounded-lg">
          No categories found. Make sure products have categories assigned in your inventory.
        </div>
      )}

      <p className="text-xs text-white/30 mt-2">
        Select specific categories to display on the menu, or choose "All Categories" to show everything.
      </p>
    </div>
  );
}
