"use client";

import { MapPin, DollarSign, ShoppingCart, ChevronRight, Plus } from "@/lib/icons";
import { TerminalCard } from "./TerminalCard";
import { AddTerminalModal } from "./AddTerminalModal";
import { useState } from "react";

interface StoreCardProps {
  store: {
    id: string;
    name: string;
    address: {
      line1: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
    };
    taxConfig: {
      sales_tax_rate: number;
      taxes?: Array<{ name: string; rate: number }>;
    } | null;
    processor: {
      name: string;
      type: string;
      isActive: boolean;
      lastTestStatus: "success" | "failed" | null;
    } | null;
    terminals: Array<any>;
    activeTerminals: number;
    todaySales: number;
    todayTransactions: number;
  };
}

export function StoreCard({ store }: StoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded by default
  const [showAddTerminal, setShowAddTerminal] = useState(false);

  return (
    <>
      {showAddTerminal && (
        <AddTerminalModal
          storeId={store.id}
          storeName={store.name}
          onClose={() => setShowAddTerminal(false)}
          onSuccess={() => {
            // Refresh the page data
            window.location.reload();
          }}
        />
      )}
    <div className="border border-white/[0.06] rounded-2xl bg-white/[0.02] overflow-hidden">
      {/* Store Header */}
      <div
        className="p-6 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-white tracking-tight">{store.name}</h3>
              {store.activeTerminals > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.06] rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-white/60">
                    {store.activeTerminals} Active
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            {store.address.line1 && (
              <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {store.address.line1}, {store.address.city}, {store.address.state}{" "}
                  {store.address.zip}
                </span>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/[0.04] rounded-lg">
                  <DollarSign className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    ${store.todaySales.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/30">Today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/[0.04] rounded-lg">
                  <ShoppingCart className="w-3.5 h-3.5 text-white/30" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{store.todayTransactions}</p>
                  <p className="text-xs text-white/30">Transactions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Info */}
          <div className="flex flex-col items-end gap-3">
            {/* Tax Rate */}
            {store.taxConfig && (
              <div className="text-xs text-white/40">
                Tax: {(store.taxConfig.sales_tax_rate * 100).toFixed(2)}%
              </div>
            )}

            {/* Expand Indicator */}
            <ChevronRight
              className={`w-4 h-4 text-white/30 transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable Terminals Section */}
      {isExpanded && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-sm font-medium text-white/60">
              Terminals ({store.terminals.length})
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddTerminal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] rounded-xl text-sm font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Terminal
            </button>
          </div>

          {store.terminals.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.06]">
              <p className="text-sm text-white/40 mb-4">No terminals configured</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddTerminal(true);
                }}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Add Your First Terminal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.terminals.map((terminal) => (
                <TerminalCard key={terminal.id} terminal={terminal} storeName={store.name} locationId={store.id} />
              ))}
            </div>
          )}

          {/* Tax Breakdown (if expanded) */}
          {store.taxConfig?.taxes && store.taxConfig.taxes.length > 0 && (
            <div className="mt-5 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <p className="text-xs font-medium text-white/40 mb-3">Tax Breakdown</p>
              <div className="space-y-2">
                {store.taxConfig.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white/50">{tax.name}</span>
                    <span className="text-white/70 font-medium">
                      {typeof tax.rate === 'number' ? tax.rate.toFixed(2) : tax.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
