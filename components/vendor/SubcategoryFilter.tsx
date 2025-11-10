"use client";

/**
 * Steve Jobs-Style Subcategory Filter
 *
 * Clean, minimal pill interface for filtering subcategories
 * Shows when a parent category with children is selected
 */

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryFilterProps {
  subcategories: Category[];
  activeSubcategory: string;
  onSelect: (subcategoryId: string) => void;
}

export function SubcategoryFilter({
  subcategories,
  activeSubcategory,
  onSelect,
}: SubcategoryFilterProps) {
  if (subcategories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 py-3 overflow-x-auto">
      {/* All subcategories pill */}
      <button
        onClick={() => onSelect("all")}
        className={`
          px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-black whitespace-nowrap transition-all
          ${
            activeSubcategory === "all"
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
          }
        `}
        style={{ fontWeight: 900 }}
      >
        All
      </button>

      {/* Subcategory pills */}
      {subcategories.map((subcat) => (
        <button
          key={subcat.id}
          onClick={() => onSelect(subcat.id)}
          className={`
            px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-black whitespace-nowrap transition-all
            ${
              activeSubcategory === subcat.id
                ? "bg-white text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
            }
          `}
          style={{ fontWeight: 900 }}
        >
          {subcat.name}
        </button>
      ))}
    </div>
  );
}
