export default function POSLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Skeleton */}
      <div className="border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white/5 border border-white/10 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="h-48 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
              <div className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
