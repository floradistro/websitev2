/**
 * Reusable skeleton loaders for vendor pages
 * Styles are in globals-dashboard.css
 */

export function StatCardSkeleton() {
  return (
    <div className="minimal-glass subtle-glow p-6 animate-pulse">
      <div className="h-3 w-24 mb-4 bg-white/5 rounded"></div>
      <div className="h-8 w-20 mb-2 bg-white/5 rounded"></div>
      <div className="h-3 w-32 bg-white/5 rounded"></div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="minimal-glass p-6 hover:bg-white/[0.02] transition-all animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 flex-shrink-0 bg-white/5 rounded"></div>
        <div className="flex-1">
          <div className="h-5 w-40 mb-2 bg-white/5 rounded"></div>
          <div className="h-3 w-24 bg-white/5 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-white/5 rounded"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[12px] bg-white/5"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded"></div>
            <div className="h-3 w-20 bg-white/5 rounded"></div>
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
      <td className="p-4"><div className="h-4 w-16 bg-white/5 rounded"></div></td>
      <td className="p-4"><div className="h-6 w-20 bg-white/5 rounded"></div></td>
      <td className="p-4"><div className="h-6 w-16 bg-white/5 rounded"></div></td>
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="minimal-glass p-6 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-32 mb-2 bg-white/5 rounded"></div>
        <div className="h-3 w-24 bg-white/5 rounded"></div>
      </div>
      <div className="h-64 flex items-end justify-between gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 bg-white/5 rounded" style={{ height: `${Math.random() * 100}%` }}></div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="w-full px-4 lg:px-0 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-12">
        <div className="h-8 w-48 mb-2 bg-white/5 rounded"></div>
        <div className="h-4 w-64 bg-white/5 rounded"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="minimal-glass p-6">
            <div className="w-10 h-10 mb-3 bg-white/5 rounded"></div>
            <div className="h-3 w-20 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <div className="minimal-glass p-6">
            <div className="h-4 w-32 mb-6 bg-white/5 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsSkeleton() {
  return (
    <div className="w-full px-4 lg:px-0 animate-pulse">
      {/* Header */}
      <div className="mb-12 flex justify-between items-center">
        <div>
          <div className="h-8 w-48 mb-2 bg-white/5 rounded"></div>
          <div className="h-4 w-32 bg-white/5 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-white/5 rounded"></div>
      </div>

      {/* Filters */}
      <div className="minimal-glass p-6 mb-8">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-white/5 rounded"></div>
          <div className="h-10 w-24 bg-white/5 rounded"></div>
          <div className="h-10 w-24 bg-white/5 rounded"></div>
        </div>
      </div>

      {/* Table */}
      <div className="minimal-glass overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/5">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="p-4">
                  <div className="h-3 w-20 bg-white/5 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

