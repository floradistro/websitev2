"use client";

import { ds, cn } from "@/components/ds";

interface InputModeToggleProps {
  inputMode: "single" | "bulk";
  onModeChange: (mode: "single" | "bulk") => void;
}

export default function InputModeToggle({ inputMode, onModeChange }: InputModeToggleProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("single")}
          className={cn(
            "px-3 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black",
            inputMode === "single"
              ? "bg-white/10 border-white/20 text-white"
              : cn(ds.colors.bg.primary, "border-white/10 text-white/60 hover:border-white/20"),
          )}
          style={{ fontWeight: 900 }}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => onModeChange("bulk")}
          className={cn(
            "px-3 py-2 rounded-xl border transition-all text-[10px] uppercase tracking-[0.15em] font-black",
            inputMode === "bulk"
              ? "bg-white/10 border-white/20 text-white"
              : cn(ds.colors.bg.primary, "border-white/10 text-white/60 hover:border-white/20"),
          )}
          style={{ fontWeight: 900 }}
        >
          Bulk
        </button>
      </div>
    </div>
  );
}
