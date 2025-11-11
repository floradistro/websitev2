"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAppAuth } from "@/context/AppAuthContext";
import { StoreCard } from "./components/StoreCard";
import { RefreshCw } from "@/lib/icons";

const fetcher = (url: string) =>
  fetch(url, {
    credentials: "include", // Include HTTP-only auth cookies
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

export default function StoreOperationsCenter() {
  const { user } = useAppAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch operations overview with 5-second polling for real-time updates
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR("/api/vendor/operations/overview", fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds for live updates
    revalidateOnFocus: true,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/60 mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading operations...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load</h2>
          <p className="text-sm text-white/40 mb-4">
            {error?.message || "An error occurred"}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] text-white rounded-xl text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { stores, lastUpdated } = data;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                Store Operations
              </h1>
              <p className="text-sm text-white/40">
                Manage terminals and payment processors across all locations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/30">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.04] rounded-lg transition-colors ${
                  isRefreshing ? "opacity-50" : ""
                }`}
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-white/40 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stores List */}
        {stores.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.06]">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Locations</h3>
            <p className="text-sm text-white/40">Add your first store location to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map((store: any) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
