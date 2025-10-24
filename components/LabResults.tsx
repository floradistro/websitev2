"use client";

import { ShieldCheck } from "lucide-react";

interface LabResultsProps {
  metaData: any[];
  attributes?: any[];
}

export default function LabResults({ metaData, attributes }: LabResultsProps) {
  // Extract COA URL
  let coaUrl = "";
  
  // Handle both array and object formats
  const metaArray = Array.isArray(metaData) ? metaData : 
    Object.entries(metaData || {}).map(([key, value]) => ({ key, value }));
  
  metaArray.forEach((meta: any) => {
    const key = (meta.key || '').toLowerCase();
    if (key.includes("coa") || key.includes("certificate") || key.includes("lab_report")) {
      if (meta.value && (meta.value.startsWith("http") || meta.value.startsWith("www"))) {
        coaUrl = meta.value;
      }
    }
  });

  // If no COA URL found, return null
  if (!coaUrl) {
    return null;
  }

  return (
    <a
      href={coaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-white/20 bg-white/5 backdrop-blur-xl hover:border-white/40 hover:bg-white/[0.08] transition-all duration-300 p-4 rounded-[20px] group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} strokeWidth={1.5} className="text-white/60" />
          <span className="text-xs uppercase tracking-[0.12em] text-white/80 group-hover:text-white">
            Lab Tested
          </span>
        </div>
        <span className="text-xs text-white/60 uppercase tracking-wider">
          View →
        </span>
      </div>
    </a>
  );
}

