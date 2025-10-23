"use client";

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="minimal-glass subtle-glow p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-2 w-16 bg-white/5 rounded"></div>
            <div className="w-4 h-4 bg-white/5 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-white/5 rounded mb-2"></div>
          <div className="h-2 w-20 bg-white/5 rounded"></div>
        </div>
      ))}
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="minimal-glass subtle-glow -mx-4 lg:mx-0">
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>
      
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className={`px-4 lg:px-6 py-4 animate-pulse ${
            i !== rows - 1 ? 'border-b border-white/5' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-white/5 rounded"></div>
            <div className="w-10 h-10 bg-white/5 rounded"></div>
            <div className="flex-1 min-w-0">
              <div className="h-3 w-48 bg-white/5 rounded mb-2"></div>
              <div className="h-2 w-32 bg-white/5 rounded"></div>
            </div>
            <div className="h-3 w-16 bg-white/5 rounded"></div>
            <div className="h-3 w-12 bg-white/5 rounded"></div>
            <div className="h-6 w-16 bg-white/5 rounded"></div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-white/5 rounded"></div>
              <div className="w-8 h-8 bg-white/5 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="minimal-glass subtle-glow p-6 animate-pulse">
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-2 w-32 bg-white/5 rounded mb-2"></div>
          <div className="h-2 w-24 bg-white/5 rounded"></div>
        </div>
        <div className="w-1 h-1 bg-white/5 rounded-full"></div>
      </div>
      <div className="h-64 flex items-end justify-around gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}



