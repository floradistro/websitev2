"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

interface CategorySectionProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
}

export default function CategorySection({ categories }: CategorySectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Categories</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <Tag className="w-4 h-4 text-white/60" />
            <span className="text-white/90">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
