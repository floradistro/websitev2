"use client";

import { ShieldCheck } from "lucide-react";
import Image from "next/image";

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
    <div className="-mx-3 md:mx-0 border-y md:border md:rounded-lg border-white/10 bg-white/5 backdrop-blur-sm animate-fadeIn overflow-hidden">
      <div className="relative">
        {/* Header with visual */}
        <div className="bg-gradient-to-br from-green-950/40 to-emerald-950/40 border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <ShieldCheck size={20} strokeWidth={2} className="text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-sm uppercase tracking-[0.15em] font-semibold text-white">
                Lab Tested
              </h3>
              <p className="text-xs text-white/60 font-light">
                Third-party certified
              </p>
            </div>
          </div>
        </div>

        {/* QR Code with Logo */}
        <a
          href={coaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white p-8 hover:bg-gray-50 transition-all duration-300 group"
          title="View Lab Results"
        >
          <div className="relative w-full max-w-[200px] mx-auto aspect-square">
            {/* QR Code placeholder - you can replace this with actual QR code generation */}
            <div className="w-full h-full bg-black rounded-lg p-4 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full border-4 border-white/20 rounded flex items-center justify-center relative">
                {/* QR pattern simulation */}
                <div className="absolute inset-0 opacity-40">
                  <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-[2px] p-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
                
                {/* Logo in center */}
                <div className="relative z-10 bg-white rounded-full p-3 shadow-lg">
                  <img
                    src="/logoprint.png"
                    alt="Flora Distro"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Text */}
          <div className="text-center mt-4">
            <p className="text-sm text-black/60 font-light">
              Tap to view full lab report
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}

