"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ProductFormHeaderProps {
  inputMode: 'single' | 'bulk';
}

export default function ProductFormHeader({ inputMode }: ProductFormHeaderProps) {
  return (
    <div className="border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-[9px] uppercase tracking-[0.15em] mb-3 transition-all font-black"
          style={{ fontWeight: 900 }}
        >
          <ArrowLeft size={10} strokeWidth={1.5} />
          Back
        </Link>

        <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
          Add New Product
        </h1>
        <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
          {inputMode === 'bulk' ? 'Bulk import products' : 'Submit for approval'}
        </p>
      </div>
    </div>
  );
}
