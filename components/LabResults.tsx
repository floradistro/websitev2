"use client";

import { ShieldCheck } from "lucide-react";

interface LabResultsProps {
  metaData: any[];
  attributes?: any[];
}

export default function LabResults({ metaData, attributes }: LabResultsProps) {
  // Extract COA URL
  let coaUrl = "";
  
  metaData.forEach((meta: any) => {
    const key = meta.key.toLowerCase();
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
      className="-mx-3 md:mx-0 block border-y md:border md:rounded-lg border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 animate-fadeIn group"
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors duration-300">
            <ShieldCheck size={24} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              Lab Tested
            </h3>
            <p className="text-sm text-white/60 font-light">
              View certificate →
            </p>
          </div>
        </div>
        
        <div className="bg-white/10 p-3 rounded-lg group-hover:bg-white/20 transition-colors duration-300">
          <img
            src="/logoprint.png"
            alt="Flora Distro"
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>
    </a>
  );
}

